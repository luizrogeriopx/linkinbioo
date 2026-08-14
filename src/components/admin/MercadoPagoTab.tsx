import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreditCard, ExternalLink, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getPaymentSettings, savePaymentSettings } from "@/lib/mercadopago.functions";

export function MercadoPagoTab() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getPaymentSettings);
  const saveSettings = useServerFn(savePaymentSettings);

  const { data, isLoading } = useQuery({
    queryKey: ["mp-settings"],
    queryFn: () => fetchSettings(),
  });

  const [publicKey, setPublicKey] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isSandbox, setIsSandbox] = useState(true);

  useEffect(() => {
    if (!data) return;
    setPublicKey(data.publicKey);
    setIsSandbox(data.isSandbox);
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      saveSettings({ data: { publicKey: publicKey.trim(), accessToken: accessToken.trim(), isSandbox } }),
    onSuccess: () => {
      setAccessToken("");
      toast.success("Chaves do Mercado Pago salvas com segurança.");
      void queryClient.invalidateQueries({ queryKey: ["mp-settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return <div className="h-56 animate-pulse rounded-3xl bg-muted" />;
  }

  return (
    <div className="space-y-6">
      <Card className="glass border-glass-border">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <CreditCard className="size-5 text-primary" /> Mercado Pago — Checkout Transparente
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Cobre cartão de crédito e Pix direto na sua página, sem redirecionar o cliente.
              </p>
            </div>
            <Badge
              className={
                data?.hasAccessToken
                  ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/20 text-amber-400"
              }
            >
              {data?.hasAccessToken ? "● Configurado" : "● Pendente"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="mp-public-key">Public Key</Label>
            <Input
              id="mp-public-key"
              placeholder="APP_USR-xxxxxxxx-xxxx-xxxx"
              value={publicKey}
              maxLength={200}
              onChange={(e) => setPublicKey(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Chave pública usada pelo formulário de cartão no navegador.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mp-access-token">Access Token (secreto)</Label>
            <Input
              id="mp-access-token"
              type="password"
              autoComplete="off"
              maxLength={400}
              placeholder={
                data?.hasAccessToken
                  ? `Salvo: ${data.accessTokenPreview} — preencha só para substituir`
                  : "APP_USR-0000000000000000-000000-xxxxxxxxxxxx"
              }
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3 text-emerald-400" />
              Guardado no servidor e nunca exibido de volta no navegador.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-glass-border bg-card/40 p-4">
            <div>
              <p className="text-sm font-medium">Modo de testes (sandbox)</p>
              <p className="text-xs text-muted-foreground">
                Use credenciais de teste enquanto valida o fluxo de pagamento.
              </p>
            </div>
            <Switch checked={isSandbox} onCheckedChange={setIsSandbox} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-xl"
              disabled={mutation.isPending || !publicKey.trim()}
              onClick={() => mutation.mutate()}
            >
              <KeyRound className="mr-2 size-4" />
              {mutation.isPending ? "Salvando..." : "Salvar chaves"}
            </Button>
            <Button variant="outline" className="rounded-xl" asChild>
              <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 size-4" />
                Obter minhas credenciais
              </a>
            </Button>
            <Button variant="secondary" className="rounded-xl" asChild>
              <a href="/checkout" target="_blank" rel="noreferrer">
                Testar checkout
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
