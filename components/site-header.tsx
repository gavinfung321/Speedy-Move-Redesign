"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import languagePairs from "@/content/language-pairs.json";
import { chineseMenu, mainMenu, type MenuItem } from "@/lib/menus";
import { site } from "@/lib/site";

const pairs = languagePairs as Record<string, string>;

const SECTION_KEY = "speedy-lang-section";
const SECTION_MARK = "speedy-lang-mark";

const LANDMARKS =
  "main .page-hero, main .home-hero, main .post-banner, main .post-article, main [data-section], main [data-shared], main .blog-index, main .service-faq, main .feature-row, main .home-donate, main .price-layout, main .service-detail, main .near-band, main .demo-approved, main .move-steps, main .why-move-block, main .service-split.why-move, main .donate-talk";

const SECTION_ALIASES: Record<string, string> = {
  faq: "faq",
  "contact-info": "contact",
  "fast-and-easy": "features",
  "how-it-works": "how",
  "all-kinds": "kinds",
  "near-you": "near",
  "blog-teaser": "blog",
  pricing: "pricing",
};

const SECTION_TARGETS: Record<string, string[]> = {
  faq: ["main .service-faq", "main [data-shared='faq']", "main [data-shared='faq-zh']"],
  contact: ["main [data-section='talk']", "main [data-shared='contact-info']", "main [data-shared='contact-info-zh']"],
  how: ["main [data-shared='how-it-works']", "main [data-shared='how-it-works-zh']"],
  kinds: ["main [data-shared='all-kinds']", "main [data-shared='all-kinds-zh']"],
  near: ["main [data-section='near']", "main [data-shared='near-you']", "main [data-shared='near-you-zh']", "main .near-band", "main .service-faq", "main [data-shared='faq']", "main [data-shared='faq-zh']"],
  blog: ["main [data-shared='blog-teaser']", "main [data-shared='blog-teaser-zh']"],
  pricing: ["main [data-section='pricing']", "main [data-shared='pricing']", "main [data-shared='pricing-zh']", "main .price-layout"],
  talk: ["main [data-section='talk']", "main [data-shared='contact-info']", "main [data-shared='contact-info-zh']"],
  features: ["main .feature-row", "main [data-shared='fast-and-easy']", "main [data-shared='fast-and-easy-zh']", "main [data-section='services']"],
  why: ["main [data-section='why']", "main .why-move-block", "main .service-split.why-move", "main .service-detail"],
  donate: ["main [data-section='donate']", "main .home-donate", "main [data-section='pricing']", "main .price-layout"],
  process: ["main [data-section='process']", "main .move-steps"],
  approved: ["main .demo-approved"],
  close: ["main .donate-talk", "main [data-shared='contact-info']", "main [data-shared='contact-info-zh']"],
  lead: ["main .donate-lead"],
  offers: ["main .donate-offers"],
  steps: ["main .donate-steps"],
  intro: ["main .item-open"],
  article: ["main .post-article"],
};

function visibleLandmark(node: Element): boolean {
  const box = node.getBoundingClientRect();
  return box.width > 0 && box.height > 0;
}

function sectionKey(node: Element): string {
  const named = node.getAttribute("data-section");
  if (named) return named;
  const shared = (node.getAttribute("data-shared") ?? "").replace(/-zh$/, "");
  if (SECTION_ALIASES[shared]) return SECTION_ALIASES[shared];
  if (node.classList.contains("service-faq")) return "faq";
  if (node.classList.contains("feature-row")) return "features";
  if (node.classList.contains("price-layout")) return "pricing";
  if (node.classList.contains("near-band")) return "near";
  if (node.classList.contains("demo-approved")) return "approved";
  if (node.classList.contains("move-steps")) return "process";
  if (node.classList.contains("why-move") || node.classList.contains("why-move-block")) return "why";
  if (node.classList.contains("donate-talk")) return "close";
  if (node.classList.contains("donate-lead")) return "lead";
  if (node.classList.contains("donate-offers")) return "offers";
  if (node.classList.contains("donate-steps")) return "steps";
  if (node.classList.contains("item-open")) return "intro";
  if (node.classList.contains("post-article")) {
    const header = document.querySelector("header.site-nav")?.getBoundingClientRect().height ?? 76;
    const line = header + Math.min(220, (window.innerHeight - header) * 0.34);
    const heads = [...node.querySelectorAll("h2")];
    let index = -1;
    heads.forEach((head, headIndex) => {
      if (head.getBoundingClientRect().top <= line) index = headIndex;
    });
    return index >= 0 ? `heading:${index}` : "article";
  }
  if (node.matches(".page-hero, .home-hero, .post-banner")) return "top";
  const type = ["blog-index", "home-donate", "service-detail"].find((name) => node.classList.contains(name));
  if (!type) return "top";
  const index = [...document.querySelectorAll(`main .${type}`)].indexOf(node);
  return `${type}:${index}`;
}

function pageMark(): string {
  const main = document.querySelector("main");
  if (!main) return "";
  const h1 = main.querySelector("h1")?.textContent?.trim() ?? "";
  const h2 = [...main.querySelectorAll("h2")]
    .slice(0, 4)
    .map((node) => node.textContent?.trim() ?? "")
    .join("|");
  return `${h1}::${h2}`;
}

function currentSectionKey(): string {
  const header = document.querySelector("header.site-nav")?.getBoundingClientRect().height ?? 76;
  const line = header + Math.min(220, (window.innerHeight - header) * 0.34);
  let current: Element | null = null;
  for (const node of document.querySelectorAll(LANDMARKS)) {
    if (!visibleLandmark(node) || node.matches(".page-hero, .home-hero, .post-banner")) continue;
    if (node.getBoundingClientRect().top <= line) current = node;
  }
  return current ? sectionKey(current) : "top";
}

function sectionTarget(key: string): Element | null {
  if (key === "top") return null;
  const heading = /^heading:(\d+)$/.exec(key);
  if (heading) {
    return (
      document.querySelectorAll("main .post-article h2")[Number(heading[1])] ??
      document.querySelector("main .post-article")
    );
  }
  const named = document.querySelector(`main [data-section="${CSS.escape(key)}"]`);
  if (named) return named;
  for (const selector of SECTION_TARGETS[key] ?? []) {
    const node = document.querySelector(selector);
    if (node) return node;
  }
  const match = /^([\w-]+):(\d+)$/.exec(key);
  if (!match) return null;
  return document.querySelectorAll(`main .${match[1]}`)[Number(match[2])] ?? null;
}

function scrollToStoredSection(key: string) {
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  if (key === "top") {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  } else {
    const target = sectionTarget(key);
    if (target) {
      const header = document.querySelector("header.site-nav")?.getBoundingClientRect().height ?? 76;
      const top = target.getBoundingClientRect().top + window.scrollY - header - 12;
      window.scrollTo({ top: Math.max(0, top), left: 0, behavior: "instant" });
    }
  }
  root.style.scrollBehavior = previous;
}

function languageHref(pathname: string): string {
  const candidates = new Set<string>();
  const add = (value: string) => {
    candidates.add(value.endsWith("/") ? value : `${value}/`);
  };
  add(pathname);
  try {
    add(decodeURI(pathname));
  } catch {
    // The path is not encoded.
  }
  for (const path of candidates) {
    const pair = pairs[path];
    if (pair) return pair;
  }
  return [...candidates][0] ?? pathname;
}

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

function LanguageSwitch({ pathname, chinese }: { pathname: string; chinese: boolean }) {
  return (
    <Link
      href={languageHref(pathname)}
      scroll={false}
      aria-label={chinese ? "English" : "中文"}
      className="inline-flex overflow-hidden rounded-[2px] ring-1 ring-black/20"
      onClick={() => {
        const next = languageHref(pathname);
        const here = pathname.endsWith("/") ? pathname : `${pathname}/`;
        if (next === here) return;
        document.documentElement.style.scrollBehavior = "auto";
        sessionStorage.setItem(SECTION_KEY, currentSectionKey());
        sessionStorage.setItem(SECTION_MARK, pageMark());
      }}
    >
      {chinese ? <UkFlag /> : <HongKongFlag />}
    </Link>
  );
}

function MenuCaret() {
  return (
    <svg viewBox="0 0 12 8" className="ml-1 h-2 w-2.5" aria-hidden="true">
      <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SubmenuCaret() {
  return (
    <svg viewBox="0 0 8 12" className="ml-3 h-2.5 w-2 shrink-0" aria-hidden="true">
      <path d="M1.5 1 6.5 6 1.5 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
          <Link href={item.href} className={`${linkClass} inline-flex items-center`}>
            {item.label}
            <MenuCaret />
          </Link>
        ) : (
          <span className="inline-flex cursor-default items-center">
            {item.label}
            <MenuCaret />
          </span>
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
                className={
                  item.children.length > 0
                    ? dark
                      ? "flex items-center justify-between px-4 py-2 hover:text-[var(--orange)]"
                      : "flex items-center justify-between px-4 py-2 hover:bg-[var(--sand)]"
                    : dark
                      ? "block px-4 py-2 hover:text-[var(--orange)]"
                      : "block px-4 py-2 hover:bg-[var(--sand)]"
                }
              >
                {item.label}
                {item.children.length > 0 ? <SubmenuCaret /> : null}
              </Link>
            ) : (
              <span className={item.children.length > 0 ? "flex items-center justify-between px-4 py-2" : "block px-4 py-2"}>
                {item.label}
                {item.children.length > 0 ? <SubmenuCaret /> : null}
              </span>
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

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);

  useLayoutEffect(() => {
    const key = sessionStorage.getItem(SECTION_KEY);
    const previous = sessionStorage.getItem(SECTION_MARK);
    if (!key || !previous) return;
    let alive = true;
    let landed = false;
    const finish = (next: string) => {
      scrollToStoredSection(next);
      landed = true;
      sessionStorage.removeItem(SECTION_KEY);
      sessionStorage.removeItem(SECTION_MARK);
      document.documentElement.style.scrollBehavior = "";
    };
    const run = () => {
      if (!alive || landed || pageMark() === previous) return;
      const target = key === "top" ? null : sectionTarget(key);
      if (key !== "top" && !target) return;
      finish(key);
    };
    run();
    const main = document.querySelector("main");
    const observer = main ? new MutationObserver(run) : null;
    observer?.observe(main as Node, { childList: true, subtree: true });
    const followUp = window.setTimeout(() => {
      if (!alive || landed || pageMark() === previous) return;
      finish(sectionTarget(key) ? key : "top");
    }, 250);
    const stop = window.setTimeout(() => {
      if (alive && !landed && pageMark() !== previous) finish(sectionTarget(key) ? key : "top");
      alive = false;
      observer?.disconnect();
      document.documentElement.style.scrollBehavior = "";
    }, 1500);
    return () => {
      alive = false;
      observer?.disconnect();
      window.clearTimeout(followUp);
      window.clearTimeout(stop);
    };
  }, [pathname]);
  const items = chinese ? chineseMenu : mainMenu;
  const linkClass = "text-white hover:text-[var(--orange)]";
  const [open, setOpen] = useState(false);
  const [bar, setBar] = useState<"top" | "hidden" | "shown">("top");
  const menuOpen = useRef(false);
  menuOpen.current = open;
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

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const header = document.querySelector("header.site-nav");
      if (!(event.target instanceof Node) || header?.contains(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  useLayoutEffect(() => {
    const sync = () => {
      const photo = Boolean(document.querySelector("main .home-hero, main .page-hero, main .post-banner"));
      setOverPhoto((current) => (current === photo ? current : photo));
      document.documentElement.classList.toggle("nav-on-paper", !photo);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    let last = window.scrollY;
    let carry = 0;
    let frame = 0;
    let touchY = 0;
    const place = (next: "top" | "hidden" | "shown") => {
      setBar((current) => (current === next ? current : next));
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        if (menuOpen.current) return;
        const y = window.scrollY;
        carry += y - last;
        last = y;
        if (y <= 8) {
          carry = 0;
          place("top");
          return;
        }
        if (carry <= -8) {
          carry = 0;
          place("shown");
        } else if (carry >= 8) {
          carry = 0;
          place("hidden");
        }
      });
    };
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? touchY;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (y == null || menuOpen.current) return;
      const delta = y - touchY;
      touchY = y;
      if (Math.abs(delta) < 4) return;
      if (window.scrollY <= 8) {
        place("top");
        return;
      }
      place(delta > 0 ? "shown" : "hidden");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
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
      <div className={`header-bar relative z-[80] mx-auto flex w-full items-center justify-between gap-4 px-4 py-3${open ? " bg-[var(--ink)]" : ""}`}>
        <Link href={chinese ? "/zh/首頁/" : "/"} className="shrink-0">
          <img
            src="https://speedy-move.com/wp-content/uploads/2023/10/Junk-removal-Hong-Kong-2.png"
            alt="Speedy Move"
            className="site-logo h-9 w-auto lg:h-12"
          />
        </Link>
        <div className="header-tools contents lg:flex">
        <nav className="hidden flex-wrap items-center gap-x-4 gap-y-2 text-[length:var(--text-small)] font-semibold lg:flex" aria-label="Primary">
          <DesktopItems items={items} linkClass={linkClass} dark />
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitch pathname={pathname} chinese={chinese} />
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
