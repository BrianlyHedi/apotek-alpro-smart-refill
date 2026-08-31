"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Phone, Send, CheckCircle, HelpCircle, Clock, ExternalLink } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";

interface ChatCSModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatCSModal({ isOpen, onOpenChange }: ChatCSModalProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { addToast } = useToast();

  const handleSendMessage = () => {
    if (!message.trim()) {
      addToast("error", "Silakan ketik pertanyaan atau pesan Anda.");
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setMessage("");
      addToast("success", "Pesan Anda telah diteruskan ke Customer Support Apotek Alpro.");
      onOpenChange(false);
    }, 600);
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent("Halo Customer Support Apotek Alpro, saya butuh bantuan mengenai layanan resep/obat.");
    window.open(`https://wa.me/6281234567890?text=${text}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className="bg-green-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl text-white font-bold">Layanan Pelanggan (CS)</DialogTitle>
              <DialogDescription className="text-green-100 text-xs mt-0.5">
                Tim Apotek Alpro siap membantu konsultasi & pertanyaan Anda
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* WhatsApp Direct Option */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm text-emerald-950 flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-emerald-600" />
                Respon Cepat via WhatsApp
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Senin - Minggu: 08:00 - 21:00 WIB
              </p>
            </div>
            <Button
              onClick={openWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs"
              size="sm"
            >
              Buka WhatsApp <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Direct Message in App */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">
              Kirim Pesan Langsung
            </label>
            <Textarea
              placeholder="Tuliskan kendala atau pertanyaan Anda di sini..."
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending}
              className="w-full bg-green-600 hover:bg-green-700 text-sm"
            >
              <Send className="mr-2 h-4 w-4" />
              {isSending ? "Mengirim..." : "Kirim Pesan ke Tim Support"}
            </Button>
          </div>

          {/* Quick FAQ */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" /> Pertanyaan Populer:
            </p>
            <ul className="text-xs text-zinc-600 space-y-1.5 list-disc list-inside">
              <li>Verifikasi resep rata-rata memakan waktu 15–30 menit.</li>
              <li>Obat resep dapat diambil langsung di cabang atau dikirim.</li>
              <li>Pengingat refill dikirim otomatis H-2 sebelum obat habis.</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
