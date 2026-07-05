import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { WHATSAPP_NUMBER, PHONE_DISPLAY, BUSINESS_ADDRESS } from "@/lib/format";

const EMAILS = [
  "info@zanniescollection.co.uk",
  "support@zanniescollection.co.uk",
  "payments@zanniescollection.co.uk",
];

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Zannies Collections" },
      { name: "description", content: "Get in touch with Zannies Collections — we'd love to hear from you." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    toast.success("Message received — we'll be in touch shortly.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="bg-background pt-28">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-20 lg:grid-cols-2 lg:px-12">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">Get in touch</p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl">
            We'd love to hear from you.
          </h1>
          <p className="mt-6 text-muted-foreground">
            For custom orders, sizing, or authentication questions — reach out any way you like.
          </p>

          <ul className="mt-10 space-y-5 text-sm">
            <li className="flex items-start gap-4">
              <WhatsAppIcon size={22} className="mt-0.5 shrink-0" />
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-gold"
              >
                WhatsApp: {PHONE_DISPLAY}
              </a>
            </li>
            <li className="flex items-start gap-4">
              <Phone className="mt-1 h-5 w-5 text-gold" />
              <a href={`tel:${PHONE_DISPLAY.replace(/\s/g, "")}`} className="hover:text-gold">
                {PHONE_DISPLAY}
              </a>
            </li>
            {EMAILS.map((e) => (
              <li key={e} className="flex items-start gap-4">
                <Mail className="mt-1 h-5 w-5 text-gold" />
                <a href={`mailto:${e}`} className="hover:text-gold">
                  {e}
                </a>
              </li>
            ))}
            <li className="flex items-start gap-4">
              <MapPin className="mt-1 h-5 w-5 text-gold" />
              <span>{BUSINESS_ADDRESS} · Worldwide shipping</span>
            </li>
          </ul>
        </div>

        <form onSubmit={submit} className="space-y-5 border border-border p-8">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Your name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-border bg-background px-4 py-3 focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Email
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-border bg-background px-4 py-3 focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Message
            </label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full border border-border bg-background px-4 py-3 focus:border-gold focus:outline-none"
            />
          </div>
          <button type="submit" className="btn-gold w-full">
            Send message
          </button>
        </form>
      </div>
    </div>
  );
}
