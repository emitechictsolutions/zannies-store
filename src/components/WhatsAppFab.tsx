import { WhatsAppIcon } from "./WhatsAppIcon";
import { WHATSAPP_NUMBER } from "@/lib/format";

export function WhatsAppFab() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full shadow-luxe transition-transform hover:scale-110"
    >
      <WhatsAppIcon size={56} />
    </a>
  );
}
