import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase service-role configuration.");
}

const admin = createClient(
    supabaseUrl ?? "",
    serviceRoleKey ?? ""
);

function getValue(body: any, paths: string[]) {
    for (const path of paths) {
        const parts = path.split(".");
        let value = body;

        for (const part of parts) {
            value = value?.[part];
        }

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            return value;
        }
    }

    return null;
}

function normalizeStatus(body: any): string {
    const rawStatus = getValue(body, [
        "status",
        "data.status",
        "transaction.status",
        "payment.status",
        "result.status",
        "data.transaction.status",
        "data.payment.status",
    ]);

    if (rawStatus) {
        return String(rawStatus).trim().toUpperCase();
    }

    if (
        body?.success === true ||
        body?.data?.success === true ||
        body?.result?.success === true
    ) {
        return "SUCCESS";
    }

    return "UNKNOWN";
}

function isSuccessful(status: string, body: any): boolean {
    return (
        [
            "SUCCESS",
            "SUCCESSFUL",
            "COMPLETED",
            "COMPLETE",
            "PAID",
            "PAYMENT_SUCCESS",
            "SUCCESSFULL",
        ].includes(status) ||
        body?.success === true ||
        body?.data?.success === true ||
        body?.result?.success === true
    );
}

function isFailed(status: string): boolean {
    return [
        "FAILED",
        "FAILURE",
        "CANCELLED",
        "CANCELED",
        "REJECTED",
        "DECLINED",
        "EXPIRED",
        "PAYMENT_FAILED",
    ].includes(status);
}

export async function POST(req: Request) {
    try {
        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Supabase service-role configuration is missing.",
                },
                { status: 500 }
            );
        }

        const body = await req.json();

        console.log(
            "CloudPay webhook received:",
            JSON.stringify(body, null, 2)
        );

        /*
         * CloudPay may use slightly different names depending
         * on the callback response. We support the common forms.
         */
        const transactionReference = getValue(body, [
            "transactionReference",
            "transaction_reference",
            "merchantTransactionReference",
            "merchant_transaction_reference",
            "reference",
            "data.transactionReference",
            "data.transaction_reference",
            "data.merchantTransactionReference",
            "data.reference",
            "transaction.reference",
            "payment.reference",
        ]);

        const providerReference = getValue(body, [
            "providerReference",
            "provider_reference",
            "transactionId",
            "transaction_id",
            "checkoutRequestId",
            "checkout_request_id",
            "receiptNumber",
            "receipt_number",
            "data.providerReference",
            "data.provider_reference",
            "data.transactionId",
            "data.transaction_id",
            "data.checkoutRequestId",
            "data.checkout_request_id",
            "data.receiptNumber",
            "data.receipt_number",
            "transaction.id",
            "payment.id",
        ]);

        const amount = getValue(body, [
            "amount",
            "data.amount",
            "transaction.amount",
            "payment.amount",
        ]);

        const status = normalizeStatus(body);

        console.log("CloudPay webhook parsed:", {
            transactionReference,
            providerReference,
            amount,
            status,
        });

        /*
         * We cannot process a callback without our own
         * transaction reference.
         */
        if (!transactionReference) {
            console.error(
                "CloudPay webhook missing transaction reference."
            );

            return NextResponse.json(
                {
                    success: false,
                    error: "Missing transaction reference.",
                },
                { status: 400 }
            );
        }

        /*
         * Find the original pending deposit.
         */
        const { data: deposit, error: depositError } =
            await admin
                .from("deposits")
                .select(
                    "id, user_id, amount, status, transaction_reference, provider_reference"
                )
                .eq(
                    "transaction_reference",
                    String(transactionReference)
                )
                .maybeSingle();

        if (depositError) {
            console.error(
                "Deposit lookup error:",
                depositError
            );

            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to find deposit.",
                },
                { status: 500 }
            );
        }

        if (!deposit) {
            console.error(
                "Deposit not found:",
                transactionReference
            );

            /*
             * Return 200 so CloudPay does not endlessly retry
             * a callback for a transaction that does not belong
             * to this application.
             */
            return NextResponse.json({
                success: false,
                message: "Deposit not found.",
            });
        }

        /*
         * Safety check:
         * If CloudPay sends the amount, make sure it matches
         * the amount we originally requested.
         */
        if (amount !== null) {
            const callbackAmount = Number(amount);
            const depositAmount = Number(deposit.amount);

            if (
                Number.isFinite(callbackAmount) &&
                callbackAmount !== depositAmount
            ) {
                console.error("Deposit amount mismatch:", {
                    transactionReference,
                    callbackAmount,
                    depositAmount,
                });

                await admin
                    .from("deposits")
                    .update({
                        status: "FAILED",
                        provider_reference:
                            providerReference
                                ? String(providerReference)
                                : deposit.provider_reference,
                    })
                    .eq("id", deposit.id);

                return NextResponse.json(
                    {
                        success: false,
                        error: "Payment amount mismatch.",
                    },
                    { status: 400 }
                );
            }
        }

        /*
         * Already paid?
         *
         * complete_deposit() is also idempotent, but this
         * prevents unnecessary processing immediately.
         */
        if (deposit.status === "PAID") {
            console.log(
                "Deposit already paid:",
                transactionReference
            );

            return NextResponse.json({
                success: true,
                message: "Deposit already processed.",
            });
        }

        /*
         * SUCCESSFUL PAYMENT
         */
        if (isSuccessful(status, body)) {
            const { data: newBalance, error: completeError } =
                await admin.rpc("complete_deposit", {
                    p_transaction_reference:
                        String(transactionReference),

                    p_provider_reference:
                        providerReference
                            ? String(providerReference)
                            : null,
                });

            if (completeError) {
                console.error(
                    "complete_deposit RPC error:",
                    completeError
                );

                return NextResponse.json(
                    {
                        success: false,
                        error: "Failed to complete deposit.",
                    },
                    { status: 500 }
                );
            }

            console.log("Deposit completed successfully:", {
                transactionReference,
                providerReference,
                newBalance,
            });

            return NextResponse.json({
                success: true,
                message: "Deposit completed successfully.",
                transactionReference,
                providerReference,
                newBalance,
            });
        }

        /*
         * FAILED PAYMENT
         */
        if (isFailed(status)) {
            const { error: updateError } = await admin
                .from("deposits")
                .update({
                    status: "FAILED",
                    provider_reference:
                        providerReference
                            ? String(providerReference)
                            : deposit.provider_reference,
                })
                .eq("id", deposit.id);

            if (updateError) {
                console.error(
                    "Failed to update failed deposit:",
                    updateError
                );

                return NextResponse.json(
                    {
                        success: false,
                        error: "Failed to update deposit status.",
                    },
                    { status: 500 }
                );
            }

            console.log(
                "CloudPay payment failed:",
                transactionReference
            );

            return NextResponse.json({
                success: true,
                message: "Payment failure recorded.",
            });
        }

        /*
         * UNKNOWN / PROCESSING STATUS
         *
         * Do NOT credit the user's account.
         */
        await admin
            .from("deposits")
            .update({
                status: "PROCESSING",
                provider_reference:
                    providerReference
                        ? String(providerReference)
                        : deposit.provider_reference,
            })
            .eq("id", deposit.id);

        console.log(
            "CloudPay payment still processing:",
            transactionReference,
            status
        );

        return NextResponse.json({
            success: true,
            message: "Payment status received.",
            status,
        });
    } catch (error: any) {
        console.error(
            "CloudPay webhook error:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error?.message ||
                    "Webhook processing failed.",
            },
            { status: 500 }
        );
    }
}

/*
 * Optional GET endpoint for checking that the webhook URL
 * is reachable from CloudPay / browser.
 */
export async function GET() {
    return NextResponse.json({
        success: true,
        message: "CloudPay webhook is active.",
    });
}