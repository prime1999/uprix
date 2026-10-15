
CREATE OR REPLACE FUNCTION public.process_missed_activity_batch()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_record RECORD;
    v_timezone text;
    v_today date;
    v_end_date date;
    v_occurred_on date;
    v_type text;
    v_result text;

    v_calls integer := 0;
    v_counts jsonb := '{}'::jsonb;
BEGIN
    /*
     * Process each active or locked participant whose room exists.
     * Admins are intentionally included.
     */
    FOR v_record IN
        SELECT
            p.id AS participant_id,
            p.room_id,
            p.timezone,
            r.start_date,
            r.end_date
        FROM public.participants p
        JOIN public.rooms r
          ON r.id = p.room_id
        WHERE p.room_status IN ('active', 'locked')
        ORDER BY p.room_id, p.id
    LOOP
        /*
         * Validate the saved timezone. Fall back to Africa/Lagos
         * if the value is null or not recognized by PostgreSQL.
         */
        SELECT CASE
            WHEN EXISTS (
                SELECT 1
                FROM pg_timezone_names
                WHERE name = v_record.timezone
            )
            THEN v_record.timezone
            ELSE 'Africa/Lagos'
        END
        INTO v_timezone;

        v_today := (now() AT TIME ZONE v_timezone)::date;

        /*
         * Never process today or a future date.
         * Revisit the full eligible room period to catch up after
         * missed or failed scheduled runs. Existing activity and
         * violations are handled idempotently by the processing function.
         */
        v_end_date := LEAST(
            v_record.end_date,
            v_today - 1
        );

        IF v_record.start_date IS NULL
           OR v_end_date IS NULL
           OR v_record.start_date > v_end_date
        THEN
            CONTINUE;
        END IF;

        FOR v_occurred_on IN
            SELECT generated_date::date
            FROM generate_series(
                v_record.start_date::timestamp,
                v_end_date::timestamp,
                interval '1 day'
            ) AS dates(generated_date)
            ORDER BY generated_date
        LOOP
            /*
             * Process each date chronologically.
             * The order is intentional: submissions first, then
             * partner reviews for the same date.
             */
            FOREACH v_type IN ARRAY ARRAY[
                'MISSED_SUBMISSION',
                'MISSED_PARTNER_REVIEW'
            ]
            LOOP
                v_result := public.process_missed_activity(
                    v_record.participant_id,
                    v_record.room_id,
                    v_type,
                    v_occurred_on
                );

                v_calls := v_calls + 1;

                v_counts := jsonb_set(
                    v_counts,
                    ARRAY[v_result],
                    to_jsonb(
                        COALESCE(
                            (v_counts ->> v_result)::integer,
                            0
                        ) + 1
                    ),
                    true
                );
            END LOOP;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'calls', v_calls,
        'results', v_counts,
        'completed_at', now()
    );
END;
$function$;

-- This batch function is for the trusted background worker only.
REVOKE ALL ON FUNCTION public.process_missed_activity_batch()
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.process_missed_activity_batch()
    TO service_role;
