"use client";

import { useEffect } from "react";

const tracks = [
  { selector: ".move-reviews", label: "review" },
  { selector: "article.service-page .blog-grid", label: "post" },
];

function arrow(direction: "left" | "right") {
  const path = direction === "left" ? "M10 3 L5 8 L10 13" : "M6 3 L11 8 L6 13";
  return `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export function CarouselControls() {
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)");
    const cleanups: Array<() => void> = [];

    function mount() {
      cleanups.splice(0).forEach((remove) => remove());
      if (!narrow.matches) return;

      for (const { selector, label } of tracks) {
        const track = document.querySelector(selector);
        if (!(track instanceof HTMLElement)) continue;
        if (track.scrollWidth <= track.clientWidth + 2) continue;

        const nav = document.createElement("div");
        nav.className = "carousel-nav";
        const previous = document.createElement("button");
        const next = document.createElement("button");
        previous.type = "button";
        next.type = "button";
        previous.setAttribute("aria-label", `Previous ${label}`);
        next.setAttribute("aria-label", `Next ${label}`);
        previous.innerHTML = arrow("left");
        next.innerHTML = arrow("right");
        nav.append(previous, next);
        const frame = document.createElement("div");
        frame.className = "carousel-frame";
        track.before(frame);
        frame.append(track, nav);

        const distance = () => {
          const card = track.querySelector(":scope > *");
          const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
          const width = card instanceof HTMLElement ? card.getBoundingClientRect().width : track.clientWidth;
          return width + gap;
        };
        const update = () => {
          previous.disabled = track.scrollLeft <= 2;
          next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
        };
        const go = (sign: number) => () => {
          track.scrollBy({ left: sign * distance(), behavior: "smooth" });
        };
        const back = go(-1);
        const forward = go(1);
        previous.addEventListener("click", back);
        next.addEventListener("click", forward);
        track.addEventListener("scroll", update, { passive: true });
        update();

        cleanups.push(() => {
          previous.removeEventListener("click", back);
          next.removeEventListener("click", forward);
          track.removeEventListener("scroll", update);
          if (frame.parentNode) frame.replaceWith(track);
          nav.remove();
        });
      }
    }

    mount();
    narrow.addEventListener("change", mount);
    return () => {
      narrow.removeEventListener("change", mount);
      cleanups.forEach((remove) => remove());
    };
  }, []);

  return null;
}
