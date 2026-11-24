"use client";

import { useState, type FormEvent } from "react";
import { site } from "@/lib/site";

const copy = {
  en: {
    name: "Your Name",
    email: "Email Address",
    message: "Tell Us About Your Junk Removal or Moving Inquiry",
    send: "Send Message",
    sending: "Sending…",
    sent: `Your message has been sent to ${site.email}.`,
    error: "The message could not be sent. Please WhatsApp us instead.",
    subject: "Speedy Move website enquiry",
  },
  zh: {
    name: "你的名字",
    email: "電郵",
    message: "告訴我們您的清除垃圾或搬屋問題",
    send: "發送",
    sending: "發送中…",
    sent: `訊息已送往 ${site.email}。`,
    error: "訊息未能送出，請改用 WhatsApp。",
    subject: "Speedy Move 網站查詢",
  },
} as const;

const fieldClass =
  "w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-normal text-[var(--ink)]";

export function ContactForm({ language }: { language: "en" | "zh" }) {
  const text = copy[language];
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (String(data.get("_honey") || "").trim()) {
      setStatus("sent");
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${site.email}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      const payload = (await response.json()) as { success?: string | boolean };
      if (!response.ok || payload.success === false || payload.success === "false") {
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <p role="status">{text.sent}</p>;
  }

  return (
    <form
      className="grid max-w-xl gap-4"
      action={`https://formsubmit.co/${site.email}`}
      method="POST"
      onSubmit={onSubmit}
    >
      <input type="hidden" name="_subject" value={text.subject} />
      <input type="hidden" name="_captcha" value="false" />
      <input type="hidden" name="_template" value="table" />
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="grid gap-1 font-bold">
        <span>
          {text.name}
          <span aria-hidden="true"> *</span>
        </span>
        <input className={fieldClass} name={text.name} type="text" autoComplete="name" required />
      </label>
      <label className="grid gap-1 font-bold">
        <span>
          {text.email}
          <span aria-hidden="true"> *</span>
        </span>
        <input className={fieldClass} name="email" type="email" autoComplete="email" required />
      </label>
      <label className="grid gap-1 font-bold">
        <span>
          {text.message}
          <span aria-hidden="true"> *</span>
        </span>
        <textarea className={fieldClass} name={text.message} rows={4} required />
      </label>
      <button
        className="site-button justify-self-start rounded-[var(--radius-button)] bg-[var(--orange)] px-5 py-3 font-bold text-[var(--ink)] disabled:opacity-60"
        type="submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? text.sending : text.send}
      </button>
      {status === "error" ? (
        <p role="alert">
          {text.error}{" "}
          <a href={site.whatsapp}>WhatsApp</a>
        </p>
      ) : null}
    </form>
  );
}
