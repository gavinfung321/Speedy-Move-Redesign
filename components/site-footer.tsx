"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { footerMenu } from "@/lib/menus";
import { site } from "@/lib/site";

const chineseFooterMenu = [
  { label: "首頁", href: "/zh/首頁/" },
  { label: "清理垃圾", href: "/zh/清理垃圾/" },
  { label: "棄置傢俬", href: "/zh/棄置傢俬/" },
  { label: "清拆服務", href: "/zh/清拆服務/" },
  { label: "條款及細則", href: "/terms-conditions/" },
  { label: "聯絡我們", href: "/zh/聯絡我們/" },
];

export function SiteFooter() {
  const pathname = usePathname();
  const chinese = pathname.startsWith("/zh/") || pathname === "/zh";
  const menu = chinese ? chineseFooterMenu : footerMenu.map((item) => ({ label: item.label, href: item.href ?? "/" }));

  return (
    <footer className="bg-[var(--moss)] text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold">Speedy Move</p>
          <p className="mt-3 text-sm leading-6 text-white/80">
            {chinese
              ? "香港清理垃圾、棄置傢俬、搬屋及清拆服務。"
              : "Junk removal, furniture disposal, moving, and demolition across Hong Kong."}
          </p>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white/70">{chinese ? "選單" : "Menu"}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {menu.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors duration-150 hover:text-[var(--orange)]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white/70">{chinese ? "聯絡" : "Contact"}</p>
          <ul className="mt-3 space-y-2 text-sm leading-6">
            <li>
              <a href={site.whatsapp} className="transition-colors duration-150 hover:text-[var(--orange)]">
                {chinese ? `WhatsApp 或 致電 ${site.phoneDisplay}` : `WhatsApp or call ${site.phoneDisplay}`}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="transition-colors duration-150 hover:text-[var(--orange)]">
                {site.email}
              </a>
            </li>
            <li>{chinese ? "香港觀塘觀塘道觀塘工業中心第二期9樓N室" : site.address}</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
