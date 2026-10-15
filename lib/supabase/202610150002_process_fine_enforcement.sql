
CREATE OR REPLACE FUNCTION public.process_fine_enforcement()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_participant RECORD;
    v_deadline timestamptz;
    v_now timestamptz := now();

    v_locked integer := 0;
    v_frontend_evicted integer := 0;
    v_fully_evicted integer := 0;
    v_unlocked integer := 0;
    v_rows integer := 0;
BEGIN
    /*
     * Only active and locked participants are eligible.
     * Pending participants are never affected.
     * Final evictions are never automatically reversed.
     */
    FOR v_participant IN
        SELECT
            p.id,
            p.room_id,
            p.room_status,
            p.eviction_stage
        FROM public.participants p
        WHERE p.room_status IN ('active', 'locked')
          AND p.eviction_stage <> 'FULLY_EVICTED'
        ORDER BY p.id
        FOR UPDATE
    LOOP
        /*
         * The earliest unpaid fine determines the lifecycle.
         *
         * Normally due_at is the payment deadline.
         * If due_at is NULL, use created_at + 48 hours.
         *
         * Using the earliest deadline prevents a later fine
         * from resetting an existing overdue fine's timeline.
         */
        SELECT MIN(
            COALESCE(
                f.due_at,
                f.created_at + INTERVAL '48 hours'
            )
        )
        INTO v_deadline
        FROM public.fines f
        WHERE f.participant_id = v_participant.id
          AND f.room_id = v_participant.room_id
          AND f.status = 'UNPAID';

        /*
         * No unpaid fines remain, or the next unpaid fine
         * has not reached its deadline.
         *
         * Restore access only when this lifecycle previously
         * locked the participant. Do not change unrelated states.
         */
        IF v_deadline IS NULL OR v_deadline > v_now THEN
            IF v_participant.eviction_stage IN (
                'LOCKED',
                'FRONTEND_EVICTED'
            ) THEN
                UPDATE public.participants
                SET
                    room_status = 'active',
                    eviction_stage = 'NONE',
                    locked_at = NULL,
                    frontend_evicted_at = NULL,
                    fully_evicted_at = NULL
                WHERE id = v_participant.id
                  AND room_status = 'locked'
                  AND eviction_stage IN (
                      'LOCKED',
                      'FRONTEND_EVICTED'
                  );

                GET DIAGNOSTICS v_rows = ROW_COUNT;
                v_unlocked := v_unlocked + v_rows;
            END IF;

            CONTINUE;
        END IF;

        /*
         * STAGE 3: Total eviction.
         * Eight days after the payment deadline:
         * 48 hours initial payment period + 3 days + 5 days.
         */
        IF v_now >= v_deadline + INTERVAL '8 days' THEN
            UPDATE public.participants
            SET
                room_status = 'evicted',
                eviction_stage = 'FULLY_EVICTED',
                locked_at = COALESCE(
                    locked_at,
                    v_deadline
                ),
                frontend_evicted_at = COALESCE(
                    frontend_evicted_at,
                    v_deadline + INTERVAL '3 days'
                ),
                fully_evicted_at = COALESCE(
                    fully_evicted_at,
                    v_deadline + INTERVAL '8 days'
                )
            WHERE id = v_participant.id
              AND room_status IN ('active', 'locked')
              AND eviction_stage <> 'FULLY_EVICTED';

            GET DIAGNOSTICS v_rows = ROW_COUNT;
            v_fully_evicted := v_fully_evicted + v_rows;

        /*
         * STAGE 2: Frontend eviction.
         * Five days after the payment deadline.
         * Keep the backend room_status as 'locked'.
         */
        ELSIF v_now >= v_deadline + INTERVAL '3 days' THEN
            UPDATE public.participants
            SET
                room_status = 'locked',
                eviction_stage = 'FRONTEND_EVICTED',
                locked_at = COALESCE(
                    locked_at,
                    v_deadline
                ),
                frontend_evicted_at = COALESCE(
                    frontend_evicted_at,
                    v_deadline + INTERVAL '3 days'
                )
            WHERE id = v_participant.id
              AND room_status IN ('active', 'locked')
              AND eviction_stage <> 'FRONTEND_EVICTED';

            GET DIAGNOSTICS v_rows = ROW_COUNT;
            v_frontend_evicted :=
                v_frontend_evicted + v_rows;

        /*
         * STAGE 1: Dashboard lock.
         * At the payment deadline, which is normally 48 hours
         * after the fine was created.
         */
        ELSE
            UPDATE public.participants
            SET
                room_status = 'locked',
                eviction_stage = 'LOCKED',
                locked_at = COALESCE(
                    locked_at,
                    v_deadline
                )
            WHERE id = v_participant.id
              AND room_status IN ('active', 'locked')
              AND eviction_stage <> 'LOCKED';

            GET DIAGNOSTICS v_rows = ROW_COUNT;
            v_locked := v_locked + v_rows;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'newly_locked', v_locked,
        'newly_frontend_evicted', v_frontend_evicted,
        'newly_fully_evicted', v_fully_evicted,
        'newly_unlocked', v_unlocked,
        'completed_at', v_now
    );
END;
$function$;

-- Only the trusted background worker may execute this function.
REVOKE ALL ON FUNCTION public.process_fine_enforcement()
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.process_fine_enforcement()
    TO service_role;
