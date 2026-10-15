import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const BASE = "https://www.pay.cloud.or.ke/sandbox/api";

const KEY = (process.env.CLOUDPAY_CONSUMER_KEY ?? "").trim();
const SECRET = (process.env.CLOUDPAY_CONSUMER_SECRET ?? "").trim();

async function getToken(): Promise<string> {
    const res = await fetch(`${BASE}/oauth/token`, {
        method: "POST",
        headers: {
            Authorization:
                "Basic " +
                Buffer.from(`${KEY}:${SECRET}`).toString("base64"),
        },
        cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    const token =
        json?.access_token ??
        json?.data?.access_token;

    if (!res.ok || !token) {
        throw new Error(
            json?.message ||
            `CloudPay token request failed (HTTP ${res.status})`
        );
    }

    return token;
}

export async function POST(req: Request) {
    try {
        // --------------------------------------------------
        // 1. CloudPay configuration
        // --------------------------------------------------

        if (!KEY || !SECRET) {
            return NextResponse.json(
                {
                    error:
                        "CloudPay credentials are not configured.",
                },
                { status: 500 }
            );
        }

        // --------------------------------------------------
        // 2. Get authenticated Supabase server client
        // --------------------------------------------------

        const supabase = await createServerSupabaseClient();

        // --------------------------------------------------
        // 3. Get logged-in user from server session
        // --------------------------------------------------

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            console.error("Supabase auth error:", userError);
        }

        if (!user) {
            return NextResponse.json(
                {
                    error:
                        "You must be logged in to make a deposit.",
                },
                { status: 401 }
            );
        }

        // --------------------------------------------------
        // 4. Read request body
        // --------------------------------------------------

        const body = await req.json();

        const phone = body?.phone;
        const amount = body?.amount;

        if (!phone || amount === undefined || amount === null) {
            return NextResponse.json(
                {
                    error:
                        "Phone number and amount are required.",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // 5. Validate amount
        // --------------------------------------------------

        const numericAmount = Number(amount);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            return NextResponse.json(
                {
                    error: "Enter a valid deposit amount.",
                },
                { status: 400 }
            );
        }

        const finalAmount = Math.round(numericAmount);

        // Minimum deposit is KES 10
        if (finalAmount < 10) {
            return NextResponse.json(
                {
                    error: "Minimum deposit amount is KES 10.",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // 6. Format Kenyan phone number
        // --------------------------------------------------

        let formattedPhone = String(phone)
            .trim()
            .replace(/\s+/g, "")
            .replace(/^\+/, "");

        if (formattedPhone.startsWith("0")) {
            formattedPhone =
                "254" + formattedPhone.slice(1);
        }

        if (!/^254\d{9}$/.test(formattedPhone)) {
            return NextResponse.json(
                {
                    error:
                        "Enter a valid Kenyan phone number, e.g. 0712345678.",
                },
                { status: 400 }
            );
        }

        // --------------------------------------------------
        // 7. Generate transaction reference
        // --------------------------------------------------

        const transactionReference =
            `DEP-${Date.now()}-${crypto
                .randomUUID()
                .slice(0, 8)
                .toUpperCase()}`;

        // --------------------------------------------------
        // 8. Create pending deposit
        // --------------------------------------------------

        const {
            data: deposit,
            error: depositError,
        } = await supabase
            .from("deposits")
            .insert({
                user_id: user.id,
                amount: finalAmount,
                phone: formattedPhone,
                transaction_reference:
                    transactionReference,
                provider: "CLOUDPAY",
                status: "PENDING",
            })
            .select()
            .single();

        if (depositError || !deposit) {
            console.error(
                "Deposit creation error:",
                depositError
            );

            return NextResponse.json(
                {
                    error:
                        "Unable to create deposit request. Please try again.",
                },
                { status: 500 }
            );
        }

        // --------------------------------------------------
        // 9. Get CloudPay access token
        // --------------------------------------------------

        const token = await getToken();

        // --------------------------------------------------
        // 10. Send STK Push
        // --------------------------------------------------

        const response = await fetch(
            `${BASE}/payments/mpesa/stkpush`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization:
                        `Bearer ${token}`,
                },
                body: JSON.stringify({
                    phone: formattedPhone,
                    amount: finalAmount,
                    transactionReference,
                    description:
                        "FX Trades Deposit",
                }),
                cache: "no-store",
            }
        );

        const data = await response
            .json()
            .catch(() => null);

        console.log(
            "CloudPay STK response:",
            data
        );

        // --------------------------------------------------
        // 11. CloudPay rejected request
        // --------------------------------------------------

        if (!response.ok) {
            await supabase
                .from("deposits")
                .update({
                    status: "FAILED",
                })
                .eq("id", deposit.id);

            return NextResponse.json(
                {
                    error:
                        data?.message ||
                        "CloudPay STK push request failed.",
                },
                {
                    status:
                        response.status || 500,
                }
            );
        }

        // --------------------------------------------------
        // 12. Save provider reference if returned
        // --------------------------------------------------

        const providerReference =
            data?.provider_reference ??
            data?.providerReference ??
            data?.transaction_id ??
            data?.transactionId ??
            data?.checkout_request_id ??
            data?.checkoutRequestId ??
            null;

        if (providerReference) {
            await supabase
                .from("deposits")
                .update({
                    provider_reference:
                        String(providerReference),
                })
                .eq("id", deposit.id);
        }

        // --------------------------------------------------
        // 13. Success
        // --------------------------------------------------

        return NextResponse.json({
            success: true,
            message:
                "STK push sent. Check your phone and enter your M-Pesa PIN.",
            transactionReference,
            depositId: deposit.id,
            data,
        });
    } catch (error: any) {
        console.error(
            "CloudPay STK Push Error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error?.message ||
                    "Failed to initiate payment.",
            },
            { status: 500 }
        );
    }
}