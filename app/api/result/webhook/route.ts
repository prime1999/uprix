import crypto from "crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { grantResultRoomDriveAccess } from "@/lib/result-room/access";
import { sendResultRoomWelcomeEmail } from "@/lib/result-room/email";

export async function POST(req: Request) {
  try {
    // ============================================================
    // 1. READ THE RAW REQUEST BODY
    // ============================================================
    //
    // IMPORTANT:
    // We must use req.text() instead of req.json() here.
    //
    // Paystack signs the exact raw request body using HMAC SHA512.
    // If we parse and reconstruct the JSON first, the body could
    // change slightly and the signature verification could fail.
    //
    const body = await req.text();

    // ============================================================
    // 2. GET PAYSTACK WEBHOOK SIGNATURE
    // ============================================================
    //
    // Paystack sends the signature in:
    //
    // x-paystack-signature
    //
    // We use this signature to confirm that this request really
    // came from Paystack.
    //
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      console.error("Missing Paystack webhook signature");

      return NextResponse.json(
        {
          error: "Missing Paystack signature",
        },
        {
          status: 401,
        },
      );
    }

    // ============================================================
    // 3. GET PAYSTACK SECRET KEY
    // ============================================================
    //
    // The secret key must ONLY exist on the server.
    //
    // Never use NEXT_PUBLIC_PAYSTACK_SECRET_KEY.
    //
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY is not configured");

      return NextResponse.json(
        {
          error: "Server configuration error",
        },
        {
          status: 500,
        },
      );
    }

    // ============================================================
    // 4. VERIFY PAYSTACK WEBHOOK SIGNATURE
    // ============================================================
    //
    // Paystack creates:
    //
    // HMAC-SHA512(raw_body, secret_key)
    //
    // We generate the same hash and compare it with the signature
    // Paystack sent.
    //
    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid Paystack webhook signature");

      return NextResponse.json(
        {
          error: "Invalid signature",
        },
        {
          status: 401,
        },
      );
    }

    console.log("PAYSTACK WEBHOOK SIGNATURE VERIFIED");

    // ============================================================
    // 5. PARSE THE WEBHOOK PAYLOAD
    // ============================================================
    //
    // The signature has already been verified at this point, so
    // it is now safe to parse the body.
    //
    const event = JSON.parse(body);

    console.log("Paystack event:", {
      event: event.event,
      reference: event.data?.reference,
      amount: event.data?.amount,
    });

    // ============================================================
    // 6. ONLY PROCESS charge.success EVENTS
    // ============================================================
    //
    // Paystack can send different event types.
    //
    // We only care about:
    //
    // charge.success
    //
    // Other events are simply acknowledged so Paystack doesn't
    // continue retrying them.
    //
    if (event.event !== "charge.success") {
      console.log("Ignoring Paystack event:", event.event);

      return NextResponse.json({
        received: true,
        processed: false,
      });
    }

    // ============================================================
    // 7. EXTRACT TRANSACTION INFORMATION
    // ============================================================
    //
    const transaction = event.data;

    const { reference, amount, status, metadata, customer, paid_at } =
      transaction;

    // ============================================================
    // 8. CONFIRM THE TRANSACTION WAS SUCCESSFUL
    // ============================================================
    //
    // Even though the event is charge.success, we still verify
    // the transaction status.
    //
    if (status !== "success") {
      console.log("Transaction status is not successful:", status);

      return NextResponse.json({
        received: true,
        processed: false,
      });
    }

    // ============================================================
    // 9. VALIDATE REQUIRED METADATA
    // ============================================================
    //
    // When we initialized the Paystack payment, we attached:
    //
    // metadata: {
    //   userId,
    //   roomId,
    //   phoneNumber,
    //   goal
    // }
    //
    // userId and roomId are required for every payment.
    //
    if (!metadata?.userId || !metadata?.roomId) {
      console.error("Missing required payment metadata");

      return NextResponse.json(
        {
          error: "Invalid payment metadata",
        },
        {
          status: 400,
        },
      );
    }

    const userId = metadata.userId;
    const roomId = metadata.roomId;

    // ============================================================
    // 10. CREATE SUPABASE ADMIN CLIENT
    // ============================================================
    //
    // This webhook is called by Paystack, not by a logged-in
    // browser user.
    //
    // Therefore there is no Supabase user session available.
    //
    // The service-role client allows this server-side webhook to
    // safely update participants/payments.
    //
    const supabase = createAdminClient();

    // ============================================================
    // 11. CHECK WHETHER THIS PAYMENT WAS ALREADY RECORDED
    // ============================================================
    //
    // Paystack can retry webhooks.
    //
    // Example:
    //
    // Paystack → webhook
    //       ↓
    // payment inserted
    //       ↓
    // server crashes
    //
    // Paystack may send the webhook again.
    //
    // We don't want to insert the same payment twice.
    //
    // HOWEVER:
    //
    // We intentionally DON'T return immediately when the payment
    // already exists.
    //
    // Why?
    //
    // Imagine:
    //
    // payment inserted
    //       ↓
    // Drive access succeeds
    //       ↓
    // server crashes BEFORE drive_access_granted is updated
    //
    // On retry, we need to continue processing the benefits.
    //
    const { data: existingPayment, error: existingPaymentError } =
      await supabase
        .from("payments")
        .select("id, status")
        .eq("reference", reference)
        .maybeSingle();

    if (existingPaymentError) {
      console.error("Existing payment lookup error:", existingPaymentError);

      return NextResponse.json(
        {
          error: "Failed to check payment",
        },
        {
          status: 500,
        },
      );
    }

    const paymentAlreadyRecorded = !!existingPayment;

    if (paymentAlreadyRecorded) {
      console.log(
        "Payment already recorded. Continuing webhook processing:",
        reference,
      );
    }

    // ============================================================
    // 12. GET ROOM PAYMENT SETTINGS
    // ============================================================
    //
    // We don't hardcode the payment amount here.
    //
    // The room settings table is the source of truth.
    //
    // entry_fee       → ₦10,600
    // minimum_deposit → ₦5,000
    // capacity        → 50
    //
    const { data: roomSettings, error: settingsError } = await supabase
      .from("room_settings")
      .select("entry_fee, minimum_deposit, capacity")
      .eq("room_id", roomId)
      .single();

    if (settingsError || !roomSettings) {
      console.error("Room settings error:", settingsError);

      return NextResponse.json(
        {
          error: "Room settings not found",
        },
        {
          status: 500,
        },
      );
    }

    // ============================================================
    // 13. VALIDATE PAYMENT AMOUNT
    // ============================================================
    //
    // Paystack amounts are in kobo.
    //
    // ₦10,600 = 1,060,000 kobo
    // ₦5,000  =   500,000 kobo
    //
    // The payment cannot be:
    //
    // - zero
    // - negative
    // - greater than the room entry fee
    //
    if (
      !Number.isInteger(amount) ||
      amount <= 0 ||
      amount > roomSettings.entry_fee
    ) {
      console.error("Invalid payment amount:", amount);

      return NextResponse.json(
        {
          error: "Invalid payment amount",
        },
        {
          status: 400,
        },
      );
    }

    // ============================================================
    // 14. FIND PARTICIPANT
    // ============================================================
    //
    // We identify the participant using BOTH:
    //
    // room_id
    // user_id
    //
    // This is important because the same Uprix user could potentially
    // participate in different Result Rooms over time.
    //
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .select(
        `
          id,
          room_id,
          user_id,
          full_name,
          email,
          total_paid,
          balance,
          status,
          seat_number,
          drive_access_granted,
          welcome_email_sent
        `,
      )
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .maybeSingle();

    if (participantError) {
      console.error("Participant lookup error:", participantError);

      return NextResponse.json(
        {
          error: "Failed to check participant",
        },
        {
          status: 500,
        },
      );
    }

    // ============================================================
    // 15. VARIABLES WE WILL NEED LATER
    // ============================================================
    //
    // We create these variables because a NEW participant will not
    // exist in the database before this webhook.
    //
    // After creating the participant, the original `participant`
    // variable will still be null.
    //
    // Therefore we keep the important information separately.
    //
    let participantId: string;

    let participantEmail: string;
    let participantFullName: string;

    let driveAccessGranted = false;
    let welcomeEmailSent = false;

    let existingSeatNumber: number | null = null;

    // ============================================================
    // 16. CREATE PARTICIPANT IF THIS IS THEIR FIRST PAYMENT
    // ============================================================
    //
    // IMPORTANT BUSINESS RULE:
    //
    // We DO NOT create a participant when the payment is initialized.
    //
    // We only create the participant AFTER Paystack confirms that
    // the payment was successful through this webhook.
    //
    if (!participant) {
      console.log(
        "No participant found. Creating participant after successful payment.",
      );

      // ----------------------------------------------------------
      // 16A. GET USER PROFILE
      // ----------------------------------------------------------
      //
      // The participant's name comes from the user's Uprix profile.
      //
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("full_name")
        .eq("user_id", userId)
        .single();

      if (profileError || !profile) {
        console.error("Profile lookup error:", profileError);

        return NextResponse.json(
          {
            error: "User profile not found",
          },
          {
            status: 500,
          },
        );
      }

      // ----------------------------------------------------------
      // 16B. MAKE SURE PAYSTACK HAS THE CUSTOMER EMAIL
      // ----------------------------------------------------------
      //
      // This email will be stored in participants.email.
      //
      if (!customer?.email) {
        console.error("Paystack customer email is missing");

        return NextResponse.json(
          {
            error: "Customer email missing",
          },
          {
            status: 400,
          },
        );
      }

      // ----------------------------------------------------------
      // 16C. GET PHONE NUMBER AND GOAL
      // ----------------------------------------------------------
      //
      // These values are only required during the FIRST payment.
      //
      // They were sent in the Paystack metadata from the initialize
      // endpoint.
      //
      if (!metadata.phoneNumber || !metadata.goal) {
        console.error("Missing phone number or goal in payment metadata");

        return NextResponse.json(
          {
            error: "Required participant information is missing",
          },
          {
            status: 400,
          },
        );
      }

      // ----------------------------------------------------------
      // 16D. CREATE THE PARTICIPANT
      // ----------------------------------------------------------
      //
      // We initially set:
      //
      // total_paid = 0
      // balance    = entry_fee
      // status     = PENDING
      //
      // These values will immediately be recalculated below after
      // the payment is recorded.
      //
      const { data: newParticipant, error: createParticipantError } =
        await supabase
          .from("participants")
          .insert({
            room_id: roomId,
            user_id: userId,
            full_name: profile.full_name,
            email: customer.email,
            phone: metadata.phoneNumber,
            goal: metadata.goal,

            total_paid: 0,
            balance: roomSettings.entry_fee,
            status: "PENDING",

            // No benefits have been granted yet.
            drive_access_granted: false,
            welcome_email_sent: false,

            // A seat is NOT assigned until full payment.
            seat_number: null,
          })
          .select("id")
          .single();

      if (createParticipantError || !newParticipant) {
        console.error("Create participant error:", createParticipantError);

        return NextResponse.json(
          {
            error: "Failed to create participant",
          },
          {
            status: 500,
          },
        );
      }

      // ----------------------------------------------------------
      // 16E. SAVE NEW PARTICIPANT INFORMATION LOCALLY
      // ----------------------------------------------------------
      //
      // We need these values later when granting Drive access and
      // sending email.
      //
      participantId = newParticipant.id;

      participantEmail = customer.email;
      participantFullName = profile.full_name;

      driveAccessGranted = false;
      welcomeEmailSent = false;

      existingSeatNumber = null;

      console.log("Participant created:", participantId);
    } else {
      // ==========================================================
      // 17. CONTINUATION PAYMENT
      // ==========================================================
      //
      // The participant already exists.
      //
      // This means this payment is either:
      //
      // - another installment
      // - the final installment
      //
      participantId = participant.id;

      participantEmail = participant.email;
      participantFullName = participant.full_name;

      driveAccessGranted = participant.drive_access_granted;

      welcomeEmailSent = participant.welcome_email_sent;

      existingSeatNumber = participant.seat_number;

      // ----------------------------------------------------------
      // 17A. MAKE SURE PARTICIPANT STILL HAS A BALANCE
      // ----------------------------------------------------------
      //
      // If balance is already zero, they have already completed
      // payment.
      //
      if (participant.balance <= 0) {
        console.error(
          "Payment received for an already fully-paid participant:",
          participant.id,
        );

        return NextResponse.json(
          {
            error: "Participant payment is already complete",
          },
          {
            status: 400,
          },
        );
      }

      // ----------------------------------------------------------
      // 17B. PAYMENT MUST NOT EXCEED REMAINING BALANCE
      // ----------------------------------------------------------
      //
      // Example:
      //
      // Entry fee = ₦10,600
      // Already paid = ₦5,000
      // Remaining = ₦5,600
      //
      // A payment of ₦6,000 is invalid.
      //
      if (amount > participant.balance) {
        console.error("Payment exceeds participant balance:", {
          amount,
          balance: participant.balance,
          participantId: participant.id,
        });

        return NextResponse.json(
          {
            error: "Payment exceeds the participant's remaining balance",
          },
          {
            status: 400,
          },
        );
      }

      // ----------------------------------------------------------
      // 17C. VALIDATE INSTALLMENT AMOUNT
      // ----------------------------------------------------------
      //
      // Allowed continuation payments:
      //
      // 1. Any ₦1,000 increment
      // 2. The exact remaining balance
      //
      // Remember:
      //
      // ₦1,000 = 100,000 kobo
      //
      // Example:
      //
      // ₦2,000 → 200,000 kobo → valid
      // ₦3,000 → 300,000 kobo → valid
      // ₦5,600 → 560,000 kobo → valid if it is the exact balance
      //
      const isExactBalance = amount === participant.balance;

      const isThousandIncrement = amount % 100000 === 0;

      if (!isExactBalance && !isThousandIncrement) {
        console.error("Invalid continuation payment amount:", {
          amount,
          balance: participant.balance,
        });

        return NextResponse.json(
          {
            error:
              "Installment payments must be in ₦1,000 increments or the exact remaining balance",
          },
          {
            status: 400,
          },
        );
      }

      console.log("Continuation payment validated:", {
        participantId,
        amount,
        previousBalance: participant.balance,
        isExactBalance,
        isThousandIncrement,
      });
    }

    // ============================================================
    // 18. RECORD SUCCESSFUL PAYMENT
    // ============================================================
    //
    // If this webhook is being processed for the first time,
    // insert the payment.
    //
    // If Paystack is retrying the same webhook and the payment
    // already exists, we DO NOT insert it again.
    //
    if (!paymentAlreadyRecorded) {
      const { error: paymentError } = await supabase.from("payments").insert({
        participant_id: participantId,
        amount,
        reference,
        provider: "paystack",
        status: "SUCCESS",
        paid_at: paid_at ?? new Date().toISOString(),
      });

      if (paymentError) {
        console.error("Payment insert error:", paymentError);

        // The reference column is UNIQUE.
        //
        // If another webhook request inserted it between our
        // duplicate check and this insert, treat it as already
        // recorded.
        if (paymentError.code === "23505") {
          console.log("Payment was already inserted:", reference);
        } else {
          return NextResponse.json(
            {
              error: "Failed to record payment",
            },
            {
              status: 500,
            },
          );
        }
      } else {
        console.log("Payment recorded successfully:", reference);
      }
    }

    // ============================================================
    // 19. CALCULATE TOTAL PAYMENT FOR THIS PARTICIPANT
    // ============================================================
    //
    // VERY IMPORTANT:
    //
    // We filter by participant_id.
    //
    // We DO NOT sum all payments in the Result Room.
    //
    // Example:
    //
    // Participant A:
    // ₦5,000 + ₦3,000
    //
    // Participant B:
    // ₦5,000
    //
    // Participant A's total is ₦8,000.
    //
    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select("amount")
      .eq("participant_id", participantId)
      .eq("status", "SUCCESS");

    if (paymentsError) {
      console.error("Payment total error:", paymentsError);

      return NextResponse.json(
        {
          error: "Failed to calculate payment total",
        },
        {
          status: 500,
        },
      );
    }

    const totalPaid =
      payments?.reduce((total, payment) => total + payment.amount, 0) ?? 0;

    // ============================================================
    // 20. CALCULATE REMAINING BALANCE
    // ============================================================
    //
    // Example:
    //
    // Entry fee = ₦10,600
    // Total paid = ₦5,000
    //
    // Balance = ₦5,600
    //
    // We use Math.max() to make sure balance can never become
    // negative.
    //
    const balance = Math.max(roomSettings.entry_fee - totalPaid, 0);

    // If balance is zero, payment is completely finished.
    //
    const isFullyPaid = balance === 0;

    console.log("Payment totals:", {
      participantId,
      totalPaid,
      balance,
      isFullyPaid,
    });

    // ============================================================
    // 21. UPDATE PARTICIPANT PAYMENT STATUS
    // ============================================================
    //
    // PARTIALLY_PAID:
    // They have paid something but still have a balance.
    //
    // FULLY_PAID:
    // Their balance is zero.
    //
    await supabase
      .from("participants")
      .update({
        total_paid: totalPaid,
        balance,

        status: isFullyPaid ? "FULLY_PAID" : "PARTIALLY_PAID",

        updated_at: new Date().toISOString(),
      })
      .eq("id", participantId)
      .then(({ error }) => {
        if (error) {
          console.error("Participant update error:", error);

          throw new Error("Failed to update participant");
        }
      });

    // ============================================================
    // 22. ASSIGN OFFICIAL SEAT ONLY AFTER FULL PAYMENT
    // ============================================================
    //
    // BUSINESS RULE:
    //
    // ₦5,000 payment:
    //     No official seat.
    //
    // Full ₦10,600 payment:
    //     Assign official seat.
    //
    // If they paid installments:
    //
    // ₦5,000
    //     ↓
    // ₦5,600
    //     ↓
    // FULL PAYMENT
    //     ↓
    // Assign seat
    //
    let seatNumber: number | null = existingSeatNumber;

    if (isFullyPaid && seatNumber === null) {
      console.log("Participant is fully paid. Assigning seat...");

      const { data: assignedSeat, error: seatError } = await supabase.rpc(
        "assign_participant_seat",
        {
          p_participant_id: participantId,

          p_room_id: roomId,

          p_capacity: roomSettings.capacity,
        },
      );

      console.log({
        assignedSeat,
        seatError,
      });

      if (seatError) {
        console.error("Seat assignment error:", seatError);

        // The database RPC throws ROOM_FULL when all seats
        // have already been assigned.
        //
        if (seatError.message?.includes("ROOM_FULL")) {
          return NextResponse.json(
            {
              error: "Payment successful, but the room is full",
            },
            {
              status: 409,
            },
          );
        }

        return NextResponse.json(
          {
            error: "Failed to assign seat",
          },
          {
            status: 500,
          },
        );
      }

      seatNumber = assignedSeat;

      console.log("Seat assigned successfully:", {
        participantId,
        seatNumber,
      });
    }

    // ============================================================
    // 23. GOOGLE DRIVE ACCESS
    // ============================================================
    //
    // BUSINESS RULE:
    //
    // FIRST PAYMENT:
    //     Grant Drive access.
    //
    // LATER INSTALLMENT:
    //     Do NOT grant again.
    //
    // FINAL PAYMENT:
    //     Do NOT grant again if it was already granted.
    //
    // FULL PAYMENT UPFRONT:
    //     Grant Drive access.
    //
    // We use drive_access_granted to remember whether the access
    // has already been successfully granted.
    //
    if (!driveAccessGranted) {
      console.log(
        "Google Drive access has not been granted. Granting access...",
      );

      const folderId = process.env.RESULT_ROOM_DRIVE_FOLDER_ID;

      // ----------------------------------------------------------
      // 23A. MAKE SURE DRIVE FOLDER ID EXISTS
      // ----------------------------------------------------------
      //
      if (!folderId) {
        console.error("RESULT_ROOM_DRIVE_FOLDER_ID is not configured");

        return NextResponse.json(
          {
            error: "Drive folder is not configured",
          },
          {
            status: 500,
          },
        );
      }

      // ----------------------------------------------------------
      // 23B. GRANT DRIVE ACCESS
      // ----------------------------------------------------------
      //
      // The user's participant email is shared with the Result Room
      // Google Drive folder.
      //
      try {
        await grantResultRoomDriveAccess(folderId, participantEmail);

        console.log("Google Drive access granted:", {
          participantId,
          email: participantEmail,
        });
      } catch (error) {
        console.error("Google Drive access error:", error);

        return NextResponse.json(
          {
            error: "Failed to grant Google Drive access",
          },
          {
            status: 500,
          },
        );
      }

      // ----------------------------------------------------------
      // 23C. MARK DRIVE ACCESS AS GRANTED
      // ----------------------------------------------------------
      //
      // We only set this to true AFTER the Drive API succeeds.
      //
      // This allows a Paystack retry to try again if Drive failed.
      //
      const { error: driveFlagError } = await supabase
        .from("participants")
        .update({
          drive_access_granted: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", participantId);

      if (driveFlagError) {
        console.error("Drive access flag update failed:", driveFlagError);

        return NextResponse.json(
          {
            error:
              "Drive access was granted but the database status could not be updated",
          },
          {
            status: 500,
          },
        );
      }

      // Update our local state too.
      driveAccessGranted = true;
    } else {
      console.log("Google Drive access already granted. Skipping.");
    }

    // ============================================================
    // 24. SEND WELCOME EMAIL AFTER FULL PAYMENT
    // ============================================================
    //
    // BUSINESS RULE:
    //
    // ₦5,000 first payment:
    //     NO email.
    //
    // ₦10,600 upfront:
    //     SEND email.
    //
    // Installment:
    //     NO email.
    //
    // Final installment:
    //     SEND email.
    //
    // Therefore:
    //
    // isFullyPaid && !welcomeEmailSent
    //
    // is exactly what we need.
    //
    if (isFullyPaid && !welcomeEmailSent) {
      console.log(
        "Participant is fully paid and has not received welcome email. Sending email...",
      );

      try {
        // --------------------------------------------------------
        // 24A. SEND THE UPRIX EMAIL
        // --------------------------------------------------------
        //
        // The email contains:
        //
        // - participant's name
        // - official seat number
        //
        await sendResultRoomWelcomeEmail({
          email: participantEmail,
          fullName: participantFullName,
          seatNumber,
        });

        console.log("Result Room welcome email sent:", {
          participantId,
          email: participantEmail,
          seatNumber,
        });
      } catch (error) {
        console.error("Welcome email error:", error);

        // We return an error because the email was not successfully
        // delivered.
        //
        // IMPORTANT:
        // welcome_email_sent remains FALSE.
        //
        // This means a retry can try to send the email again.
        //
        return NextResponse.json(
          {
            error: "Failed to send welcome email",
          },
          {
            status: 500,
          },
        );
      }

      // ----------------------------------------------------------
      // 24B. MARK EMAIL AS SENT
      // ----------------------------------------------------------
      //
      // Only mark it as sent AFTER Nodemailer succeeds.
      //
      const { error: emailFlagError } = await supabase
        .from("participants")
        .update({
          welcome_email_sent: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", participantId);

      if (emailFlagError) {
        console.error("Welcome email flag update failed:", emailFlagError);

        return NextResponse.json(
          {
            error:
              "Email was sent but the database status could not be updated",
          },
          {
            status: 500,
          },
        );
      }

      // Update local state.
      welcomeEmailSent = true;
    } else if (isFullyPaid) {
      // The participant is fully paid, but the email has already
      // been sent previously.
      //
      // This is most likely a Paystack webhook retry.
      //
      console.log("Welcome email already sent. Skipping.");
    } else {
      // Participant is not fully paid yet.
      //
      // Therefore no official welcome email is sent.
      //
      console.log("Participant is not fully paid. Welcome email skipped.");
    }

    // ============================================================
    // 25. FINAL LOGGING
    // ============================================================
    //
    // This is useful when testing the webhook through your
    // Cloudflare tunnel and Paystack dashboard.
    //
    console.log("================================================");

    console.log("PAYMENT PROCESSED SUCCESSFULLY");

    console.log({
      reference,
      participantId,
      userId,
      roomId,

      // The amount of THIS particular payment.
      amount,

      // The participant's total accumulated payment.
      totalPaid,

      // Remaining amount.
      balance,

      // Current participant status.
      status: isFullyPaid ? "FULLY_PAID" : "PARTIALLY_PAID",

      // Official seat.
      seatNumber,

      // Benefit states.
      driveAccessGranted,
      welcomeEmailSent,
    });

    console.log("================================================");

    // ============================================================
    // 26. RESPOND TO PAYSTACK
    // ============================================================
    //
    // A successful 2xx response tells Paystack that we received
    // and processed the webhook.
    //
    return NextResponse.json({
      received: true,
      processed: true,

      participantId,

      totalPaid,
      balance,

      status: isFullyPaid ? "FULLY_PAID" : "PARTIALLY_PAID",

      seatNumber,

      driveAccessGranted,
      welcomeEmailSent,
    });
  } catch (error) {
    // ============================================================
    // 27. GLOBAL ERROR HANDLER
    // ============================================================
    //
    // Any unexpected error that wasn't handled above will end up
    // here.
    //
    console.error("Webhook error:", error);

    return NextResponse.json(
      {
        error: "Webhook failed",
      },
      {
        status: 500,
      },
    );
  }
}
