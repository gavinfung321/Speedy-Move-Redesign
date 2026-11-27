"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import { chineseMenu, mainMenu, type MenuItem } from "@/lib/menus";
import { site } from "@/lib/site";

function HongKongFlag() {
  return (
    <svg viewBox="0 0 60 40" className="h-5 w-8" aria-hidden="true">
      <rect width="60" height="40" fill="#DE2910" />
      <g fill="#fff" transform="translate(30 20)">
        <path d="M0 1.8c1.8 0 3.4-1.6 4.4-4.6 1.2-3.8-.6-8.4-4.4-10.2-3.8 1.8-5.6 6.4-4.4 10.2 1 3 2.6 4.6 4.4 4.6z" />
        <path d="M0 1.8c1.8 0 3.4-1.6 4.4-4.6 1.2-3.8-.6-8.4-4.4-10.2-3.8 1.8-5.6 6.4-4.4 10.2 1 3 2.6 4.6 4.4 4.6z" transform="rotate(72)" />
        <path d="M0 1.8c1.8 0 3.4-1.6 4.4-4.6 1.2-3.8-.6-8.4-4.4-10.2-3.8 1.8-5.6 6.4-4.4 10.2 1 3 2.6 4.6 4.4 4.6z" transform="rotate(144)" />
        <path d="M0 1.8c1.8 0 3.4-1.6 4.4-4.6 1.2-3.8-.6-8.4-4.4-10.2-3.8 1.8-5.6 6.4-4.4 10.2 1 3 2.6 4.6 4.4 4.6z" transform="rotate(216)" />
        <path d="M0 1.8c1.8 0 3.4-1.6 4.4-4.6 1.2-3.8-.6-8.4-4.4-10.2-3.8 1.8-5.6 6.4-4.4 10.2 1 3 2.6 4.6 4.4 4.6z" transform="rotate(288)" />
        <circle r="2.4" fill="#DE2910" />
        <circle r="1.15" />
      </g>
    </svg>
  );
}

function UkFlag() {
  return (
    <svg viewBox="0 0 60 30" className="h-5 w-8" aria-hidden="true">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" strokeWidth="8" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0 V30 M0 15 H60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="7" />
    </svg>
  );
}

function LanguageSwitch({ chinese }: { chinese: boolean }) {
  return (
    <Link
      href={chinese ? "/" : "/zh/首頁/"}
      aria-label={chinese ? "English" : "中文"}
      className="inline-flex overflow-hidden rounded-[2px] ring-1 ring-black/20"
    >
      {chinese ? <UkFlag /> : <HongKongFlag />}
    </Link>
  );
}

function DesktopItems({ items, linkClass, dark }: { items: MenuItem[]; linkClass: string; dark: boolean }) {
  return items.map((item) =>
    item.children.length > 0 ? (
      <div
        key={item.label}
        className="group relative"
        onPointerEnter={(event) => event.currentTarget.classList.remove("menu-shut")}
        onPointerLeave={(event) => {
          event.currentTarget.classList.add("menu-shut");
          const active = document.activeElement;
          if (active instanceof HTMLElement && event.currentTarget.contains(active)) active.blur();
        }}
        onFocus={() => {
          const node = document.activeElement?.closest("header.site-nav .group");
          node?.classList.remove("menu-shut");
        }}
      >
        {item.href ? (
          <Link href={item.href} className={linkClass}>
            {item.label}
          </Link>
        ) : (
          <span className="cursor-default">{item.label}</span>
        )}
        <Flyout items={item.children} depth={0} dark={dark} />
      </div>
    ) : (
      <Link key={item.href} href={item.href ?? "/"} className={linkClass}>
        {item.label}
      </Link>
    ),
  );
}

function Flyout({ items, depth, dark }: { items: MenuItem[]; depth: number; dark: boolean }) {
  return (
    <div
      className={
        depth === 0
          ? "menu-flyout invisible absolute left-0 top-full z-50 min-w-56 pt-2 opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
          : "invisible absolute left-full top-0 z-50 min-w-52 pl-2 opacity-0 group-hover/sub:visible group-hover/sub:opacity-100 group-focus-within/sub:visible group-focus-within/sub:opacity-100"
      }
    >
      <div
        className={
          dark
            ? "rounded-xl border border-white/10 bg-[var(--ink)] py-2 text-white shadow"
            : "rounded-xl border border-[var(--line)] bg-[var(--paper)] py-2 text-[var(--ink)] shadow"
        }
      >
        {items.map((item) => (
          <div
            key={`${item.label}-${item.href ?? "group"}`}
            className={depth === 0 ? "group/sub relative" : "group/deep relative"}
          >
            {item.href ? (
              <Link
                href={item.href}
                className={dark ? "block px-4 py-2 hover:text-[var(--orange)]" : "block px-4 py-2 hover:bg-[var(--sand)]"}
              >
                {item.label}
              </Link>
            ) : (
              <span className="block px-4 py-2">{item.label}</span>
            )}
            {item.children.length > 0 ? <Flyout items={item.children} depth={depth + 1} dark={dark} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileItems({ items, onNavigate }: { items: MenuItem[]; onNavigate: () => void }) {
  return items.map((item) => (
    <div key={`${item.label}-${item.href ?? "group"}`} className="flex flex-col gap-3">
      {item.href ? (
        <Link href={item.href} onClick={onNavigate}>
          {item.label}
        </Link>
      ) : (
        <span>{item.label}</span>
      )}
      {item.children.length > 0 ? (
        <div className="flex flex-col gap-3 border-l border-white/25 pl-3">
          <MobileItems items={item.children} onNavigate={onNavigate} />
        </div>
      ) : null}
    </div>
  ));
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      {open ? (
        <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" />
      ) : (
        <path d="M4 7h16 M4 12h16 M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const chinese = pathname.startsWith("/zh/") || pathname === "/zh";
  const items = chinese ? chineseMenu : mainMenu;
  const linkClass = "text-white hover:text-[var(--orange)]";
  const [open, setOpen] = useState(false);
  const [bar, setBar] = useState<"top" | "hidden" | "shown">("top");
  const [overPhoto, setOverPhoto] = useState(true);

  useEffect(() => {
    setOpen(false);
    setBar("top");
    document.querySelectorAll("header.site-nav .group").forEach((node) => {
      node.classList.add("menu-shut");
    });
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest("header.site-nav .group")) active.blur();
  }, [pathname]);

  useEffect(() => {
    const shut = (target: EventTarget | null) => {
      const nodeTarget = target instanceof Node ? target : null;
      document.querySelectorAll("header.site-nav .group").forEach((node) => {
        if (nodeTarget && node.contains(nodeTarget)) return;
        node.classList.add("menu-shut");
      });
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return;
      const group = active.closest("header.site-nav .group");
      if (group && !(nodeTarget && group.contains(nodeTarget))) active.blur();
    };
    const onPointerDown = (event: PointerEvent) => shut(event.target);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") shut(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const sync = () => {
      const half = (window.innerWidth - document.documentElement.clientWidth) / 2;
      document.documentElement.style.setProperty("--scrollbar-half", `${half}px`);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useLayoutEffect(() => {
    const photo = Boolean(document.querySelector("main .home-hero, main .page-hero"));
    setOverPhoto(photo);
    document.documentElement.classList.toggle("nav-on-paper", !photo);
  }, [pathname]);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const delta = y - last;
        last = y;
        setBar((current) => {
          const next = y <= 8 ? "top" : delta < -2 ? "shown" : delta > 2 ? "hidden" : current;
          return next === current ? current : next;
        });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <header
        className={
          open
            ? "site-nav sticky top-0 z-[70] bg-[var(--ink)] text-white"
            : `site-nav fixed inset-x-0 top-0 z-40 text-white${bar === "shown" || (bar === "top" && !overPhoto) ? " is-raised" : ""}${bar === "hidden" ? " is-away" : ""}`
        }
    >
      <div className={`header-bar relative z-[80] mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3${open ? " bg-[var(--ink)]" : ""}`}>
        <Link href={chinese ? "/zh/首頁/" : "/"} className="shrink-0">
          <img
            src="https://speedy-move.com/wp-content/uploads/2023/10/Junk-removal-Hong-Kong-2.png"
            alt="Speedy Move"
            className="site-logo h-11 w-auto lg:h-12"
          />
        </Link>
        <div className="header-tools contents lg:flex">
        <nav className="hidden flex-wrap items-center gap-x-4 gap-y-2 text-[length:var(--text-small)] font-semibold lg:flex" aria-label="Primary">
          <DesktopItems items={items} linkClass={linkClass} dark />
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitch chinese={chinese} />
          <a
            href={site.whatsapp}
            className="site-button hidden rounded-[var(--radius-button)] bg-[var(--orange)] px-4 py-2 text-[length:var(--text-small)] font-bold text-[var(--ink)] lg:inline-flex"
            aria-label="WhatsApp 9847-7838"
          >
            9847-7838
          </a>
          <button
            type="button"
            className="text-white lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
        </div>
      </div>
      {open ? (
        <nav
          className="absolute inset-x-0 top-full z-[60] max-h-[calc(100svh-4.5rem)] overflow-auto bg-[var(--ink)] px-6 pt-6 pb-6 text-base font-semibold text-white lg:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-4">
            <MobileItems items={items} onNavigate={() => setOpen(false)} />
            <a
              href={site.whatsapp}
              className="site-button mt-2 inline-flex w-fit rounded-[var(--radius-button)] bg-[var(--orange)] px-4 py-2 text-[var(--ink)]"
              aria-label="WhatsApp 9847-7838"
            >
              9847-7838
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
