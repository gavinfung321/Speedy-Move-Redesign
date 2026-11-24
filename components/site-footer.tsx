import Link from "next/link";
import { footerMenu } from "@/lib/menus";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-[var(--moss)] text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold">Speedy Move</p>
          <p className="mt-3 text-sm leading-6 text-white/80">
            Junk removal, furniture disposal, moving, and demolition across Hong Kong.
          </p>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white/70">Menu</p>
          <ul className="mt-3 space-y-2 text-sm">
            {footerMenu.map((item) => (
              <li key={item.href}>
                <Link href={item.href ?? "/"} className="hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-white/70">Contact</p>
          <ul className="mt-3 space-y-2 text-sm leading-6">
            <li>
              <a href={site.whatsapp} className="hover:underline">
                WhatsApp or call {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:underline">
                {site.email}
              </a>
            </li>
            <li>{site.address}</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
