import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, CreditCard, QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SAAS_CONFIG } from "@/lib/bio";
import { createCardPayment, createPixPayment, getCheckoutPublicKey } from "@/lib/mercadopago.functions";

const title = "Checkout Seguro — LinkBio SaaS";
const description = `Assine o plano Pro do LinkBio por ${SAAS_CONFIG.formattedPrice}/mês com cartão de crédito ou Pix.`;

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: Record<string, unknown>) => any;
  }
}

function loadMpSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-mp-sdk]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar o SDK")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.dataset["mpSdk"] = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar o SDK do Mercado Pago"));
    document.body.appendChild(script);
  });
}

const AMOUNT = SAAS_CONFIG.monthlyPrice;

function CheckoutPage() {
  const fetchKey = useServerFn(getCheckoutPublicKey);
  const payWithCard = useServerFn(createCardPayment);
  const payWithPix = useServerFn(createPixPayment);

  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ status: string; detail?: string } | null>(null);
  const [pix, setPix] = useState<{ qrCodeBase64: string; qrCode: string } | null>(null);
  const [pixEmail, setPixEmail] = useState("");
  const cardFormRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { publicKey: key } = await fetchKey();
      if (cancelled) return;
      setPublicKey(key);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;

    void (async () => {
      try {
        await loadMpSdk();
        if (cancelled || !window.MercadoPago) return;
        const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        cardFormRef.current = mp.cardForm({
          amount: AMOUNT.toFixed(2),
          iframe: false,
          form: {
            id: "form-checkout",
            cardNumber: { id: "form-checkout__cardNumber", placeholder: "0000 0000 0000 0000" },
            expirationDate: { id: "form-checkout__expirationDate", placeholder: "MM/AA" },
            securityCode: { id: "form-checkout__securityCode", placeholder: "CVV" },
            cardholderName: { id: "form-checkout__cardholderName", placeholder: "Nome impresso no cartão" },
            issuer: { id: "form-checkout__issuer" },
            installments: { id: "form-checkout__installments" },
            identificationType: { id: "form-checkout__identificationType" },
            identificationNumber: { id: "form-checkout__identificationNumber", placeholder: "CPF" },
            cardholderEmail: { id: "form-checkout__cardholderEmail", placeholder: "seu@email.com" },
          },
          callbacks: {
            onFormMounted: (error: unknown) => {
              if (error) {
                toast.error("Não foi possível iniciar o formulário de cartão.");
                return;
              }
              setReady(true);
            },
            onSubmit: async (event: Event) => {
              event.preventDefault();
              setProcessing(true);
              try {
                const formData = cardFormRef.current.getCardFormData();
                const payment = await payWithCard({
                  data: {
                    token: formData.token,
                    paymentMethodId: formData.paymentMethodId,
                    issuerId: formData.issuerId || undefined,
                    installments: Number(formData.installments || 1),
                    amount: AMOUNT,
                    description: `Assinatura ${SAAS_CONFIG.name} — Plano Pro`,
                    payerEmail: formData.cardholderEmail,
                    identificationType: formData.identificationType || undefined,
                    identificationNumber: formData.identificationNumber || undefined,
                  },
                });
                setResult({ status: payment.status, detail: payment.statusDetail });
                if (payment.status === "approved") toast.success("Pagamento aprovado!");
                else toast.info(`Pagamento ${payment.status}.`);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Falha no pagamento.");
              } finally {
                setProcessing(false);
              }
            },
          },
        });
      } catch {
        toast.error("Não foi possível carregar o Mercado Pago.");
      }
    })();

    return () => {
      cancelled = true;
      try {
        cardFormRef.current?.unmount?.();
      } catch {
        /* noop */
      }
    };
  }, [publicKey, payWithCard]);

  const generatePix = async () => {
    setProcessing(true);
    try {
      const payment = await payWithPix({
        data: {
          amount: AMOUNT,
          description: `Assinatura ${SAAS_CONFIG.name} — Plano Pro`,
          payerEmail: pixEmail.trim(),
        },
      });
      setPix({ qrCodeBase64: payment.qrCodeBase64, qrCode: payment.qrCode });
      toast.success("Pix gerado! Escaneie ou copie o código.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar o Pix.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <RouterLink to="/" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1.5 size-3.5" /> Voltar
      </RouterLink>

      <div className="glass mt-4 rounded-3xl p-6 shadow-2xl">
        <h1 className="text-2xl font-bold">Checkout Seguro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plano Pro Ilimitado — <span className="font-semibold text-primary">{SAAS_CONFIG.formattedPrice}/mês</span>
        </p>

        {publicKey === null ? (
          <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" />
        ) : publicKey === "" ? (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-400">
            Pagamentos ainda não configurados. O administrador precisa cadastrar as chaves do Mercado Pago no painel.
          </div>
        ) : result ? (
          <div className="mt-6 rounded-2xl border border-glass-border bg-card/40 p-6 text-center">
            <CheckCircle2 className="mx-auto size-10 text-emerald-400" />
            <p className="mt-3 text-lg font-semibold">Status: {result.status}</p>
            <p className="text-xs text-muted-foreground">{result.detail}</p>
            <Button className="mt-4 rounded-xl" onClick={() => setResult(null)}>
              Fazer outro pagamento
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="card" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="card">
                <CreditCard className="mr-1.5 size-4" /> Cartão
              </TabsTrigger>
              <TabsTrigger value="pix">
                <QrCode className="mr-1.5 size-4" /> Pix
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="pt-4">
              <form id="form-checkout" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-checkout__cardholderEmail">E-mail</Label>
                  <Input id="form-checkout__cardholderEmail" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-checkout__cardNumber">Número do cartão</Label>
                  <div id="form-checkout__cardNumber" className="mp-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="form-checkout__expirationDate">Validade</Label>
                    <div id="form-checkout__expirationDate" className="mp-field" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="form-checkout__securityCode">CVV</Label>
                    <div id="form-checkout__securityCode" className="mp-field" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-checkout__cardholderName">Nome no cartão</Label>
                  <Input id="form-checkout__cardholderName" type="text" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="form-checkout__identificationType">Doc.</Label>
                    <select
                      id="form-checkout__identificationType"
                      className="h-10 w-full rounded-xl border border-glass-border bg-secondary/50 px-3 text-sm"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="form-checkout__identificationNumber">Número do documento</Label>
                    <Input id="form-checkout__identificationNumber" type="text" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-checkout__issuer">Banco emissor</Label>
                  <select
                    id="form-checkout__issuer"
                    className="h-10 w-full rounded-xl border border-glass-border bg-secondary/50 px-3 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-checkout__installments">Parcelas</Label>
                  <select
                    id="form-checkout__installments"
                    className="h-10 w-full rounded-xl border border-glass-border bg-secondary/50 px-3 text-sm"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full rounded-xl" disabled={!ready || processing}>
                  {processing ? "Processando..." : `Pagar ${SAAS_CONFIG.formattedPrice}`}
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                  <ShieldCheck className="size-3 text-emerald-400" /> Dados do cartão criptografados pelo Mercado Pago.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="pix" className="space-y-4 pt-4">
              {pix ? (
                <div className="space-y-3 text-center">
                  {pix.qrCodeBase64 ? (
                    <img
                      src={`data:image/png;base64,${pix.qrCodeBase64}`}
                      alt="QR Code Pix para pagamento da assinatura"
                      className="mx-auto size-56 rounded-2xl bg-white p-2"
                    />
                  ) : null}
                  <textarea
                    readOnly
                    value={pix.qrCode}
                    className="h-24 w-full rounded-2xl border border-glass-border bg-secondary/50 p-3 text-xs"
                  />
                  <Button
                    variant="secondary"
                    className="rounded-xl"
                    onClick={() => {
                      void navigator.clipboard.writeText(pix.qrCode);
                      toast.success("Código Pix copiado!");
                    }}
                  >
                    Copiar código Pix
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pix-email">E-mail</Label>
                    <Input
                      id="pix-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={pixEmail}
                      onChange={(e) => setPixEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    size="lg"
                    className="w-full rounded-xl"
                    disabled={processing || !pixEmail.includes("@")}
                    onClick={generatePix}
                  >
                    {processing ? "Gerando..." : `Gerar Pix de ${SAAS_CONFIG.formattedPrice}`}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
