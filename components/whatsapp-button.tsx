import { site } from "@/lib/site";

export function WhatsAppButton() {
  return <a href={site.whatsapp} className="whatsapp-float" aria-label="WhatsApp" />;
}
