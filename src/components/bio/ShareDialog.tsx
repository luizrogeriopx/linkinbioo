import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ShareDialog() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: document.title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Compartilhar página">
          <Share2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Compartilhar</DialogTitle>
          <DialogDescription>Aponte a câmera ou copie o endereço da página.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {url ? (
            <div className="rounded-2xl bg-white p-4">
              <QRCodeCanvas value={url} size={180} />
            </div>
          ) : null}
          <div className="flex w-full gap-2">
            <Button variant="secondary" className="flex-1" onClick={share}>
              <Share2 className="mr-2 size-4" /> Compartilhar
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(url);
                toast.success("Link copiado!");
              }}
              aria-label="Copiar endereço"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
