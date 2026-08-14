// Server-only helpers for the Mercado Pago transparent checkout.
export type MpSettings = {
  publicKey: string;
  accessToken: string;
  isSandbox: boolean;
};

export async function loadMpSettings(): Promise<MpSettings> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("payment_settings")
    .select("public_key, access_token, is_sandbox")
    .eq("singleton", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    publicKey: data?.public_key ?? "",
    accessToken: data?.access_token ?? "",
    isSandbox: data?.is_sandbox ?? true,
  };
}

export async function mpRequest<T>(
  path: string,
  accessToken: string,
  init: { method?: string; body?: unknown; idempotencyKey?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  if (init.idempotencyKey) headers["X-Idempotency-Key"] = init.idempotencyKey;

  const response = await fetch(`https://api.mercadopago.com${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message =
      (payload["message"] as string) ||
      (payload["error"] as string) ||
      `Erro do Mercado Pago (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

export function maskToken(token: string): string {
  if (!token) return "";
  return `${token.slice(0, 8)}••••${token.slice(-4)}`;
}
