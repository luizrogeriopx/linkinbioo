import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const settingsSchema = z.object({
  publicKey: z.string().trim().max(200),
  accessToken: z.string().trim().max(400),
  isSandbox: z.boolean(),
});

const cardPaymentSchema = z.object({
  token: z.string().trim().min(1).max(200),
  paymentMethodId: z.string().trim().min(1).max(60),
  issuerId: z.string().trim().max(60).optional(),
  installments: z.number().int().min(1).max(12),
  amount: z.number().positive().max(100000),
  description: z.string().trim().max(200),
  payerEmail: z.string().trim().email().max(255),
  identificationType: z.string().trim().max(20).optional(),
  identificationNumber: z.string().trim().max(30).optional(),
});

const pixPaymentSchema = z.object({
  amount: z.number().positive().max(100000),
  description: z.string().trim().max(200),
  payerEmail: z.string().trim().email().max(255),
  firstName: z.string().trim().max(80).optional(),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_admin");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito ao administrador.");
}

/** Configurações visíveis apenas ao administrador (token nunca é devolvido inteiro). */
export const getPaymentSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { loadMpSettings, maskToken } = await import("./mercadopago.server");
    const settings = await loadMpSettings();
    return {
      publicKey: settings.publicKey,
      isSandbox: settings.isSandbox,
      hasAccessToken: settings.accessToken.length > 0,
      accessTokenPreview: maskToken(settings.accessToken),
    };
  });

export const savePaymentSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const update: { public_key: string; is_sandbox: boolean; access_token?: string } = {
      public_key: data.publicKey,
      is_sandbox: data.isSandbox,
    };
    // Campo em branco = manter o token atual.
    if (data.accessToken) update["access_token"] = data.accessToken;

    const { error } = await supabaseAdmin
      .from("payment_settings")
      .update(update)
      .eq("singleton", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Public key usada pelo SDK do checkout transparente no navegador. */
export const getCheckoutPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const { loadMpSettings } = await import("./mercadopago.server");
  const settings = await loadMpSettings();
  return { publicKey: settings.publicKey, isSandbox: settings.isSandbox };
});

export const createCardPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => cardPaymentSchema.parse(input))
  .handler(async ({ data }) => {
    const { loadMpSettings, mpRequest } = await import("./mercadopago.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const settings = await loadMpSettings();
    if (!settings.accessToken) throw new Error("Pagamentos ainda não configurados.");

    const payment = await mpRequest<{
      id: number;
      status: string;
      status_detail: string;
      payment_method_id: string;
    }>("/v1/payments", settings.accessToken, {
      method: "POST",
      idempotencyKey: crypto.randomUUID(),
      body: {
        transaction_amount: data.amount,
        token: data.token,
        description: data.description,
        installments: data.installments,
        payment_method_id: data.paymentMethodId,
        ...(data.issuerId ? { issuer_id: data.issuerId } : {}),
        payer: {
          email: data.payerEmail,
          ...(data.identificationNumber
            ? {
                identification: {
                  type: data.identificationType || "CPF",
                  number: data.identificationNumber,
                },
              }
            : {}),
        },
      },
    });

    await supabaseAdmin.from("payments").insert({
      mp_payment_id: String(payment.id),
      status: payment.status,
      status_detail: payment.status_detail,
      amount: data.amount,
      payer_email: data.payerEmail,
      payment_method: payment.payment_method_id,
    });

    return {
      id: String(payment.id),
      status: payment.status,
      statusDetail: payment.status_detail,
    };
  });

export const createPixPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => pixPaymentSchema.parse(input))
  .handler(async ({ data }) => {
    const { loadMpSettings, mpRequest } = await import("./mercadopago.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const settings = await loadMpSettings();
    if (!settings.accessToken) throw new Error("Pagamentos ainda não configurados.");

    const payment = await mpRequest<{
      id: number;
      status: string;
      status_detail: string;
      point_of_interaction?: {
        transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string };
      };
    }>("/v1/payments", settings.accessToken, {
      method: "POST",
      idempotencyKey: crypto.randomUUID(),
      body: {
        transaction_amount: data.amount,
        description: data.description,
        payment_method_id: "pix",
        payer: { email: data.payerEmail, first_name: data.firstName || "Cliente" },
      },
    });

    await supabaseAdmin.from("payments").insert({
      mp_payment_id: String(payment.id),
      status: payment.status,
      status_detail: payment.status_detail,
      amount: data.amount,
      payer_email: data.payerEmail,
      payment_method: "pix",
    });

    const tx = payment.point_of_interaction?.transaction_data;
    return {
      id: String(payment.id),
      status: payment.status,
      qrCode: tx?.qr_code ?? "",
      qrCodeBase64: tx?.qr_code_base64 ?? "",
      ticketUrl: tx?.ticket_url ?? "",
    };
  });
