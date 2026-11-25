"use client";

import { useEffect } from "react";

export function GoogleCarousel() {
  useEffect(() => {
    const track = document.querySelector<HTMLElement>(".google-track");
    const prev = document.querySelector<HTMLButtonElement>(".google-arrow-prev");
    const next = document.querySelector<HTMLButtonElement>(".google-arrow-next");
    if (!track || !prev || !next) return;

    track.querySelectorAll("[data-clone]").forEach((clone) => clone.remove());

    const cards = () => [...track.querySelectorAll<HTMLElement>("blockquote")];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const spots = () => {
      const items = cards();
      const origin = items[0]?.offsetLeft ?? 0;
      return items.map((card) => card.offsetLeft - origin);
    };
    const pageSize = () => {
      const card = cards()[0];
      if (!card) return 1;
      return Math.max(1, Math.round(track.clientWidth / card.getBoundingClientRect().width));
    };
    const lastIndex = () => Math.max(0, cards().length - pageSize());
    const nearest = () => {
      const places = spots();
      let index = 0;
      places.forEach((place, item) => {
        if (Math.abs(place - track.scrollLeft) < Math.abs(places[index] - track.scrollLeft)) index = item;
      });
      return Math.min(index, lastIndex());
    };

    const markSnaps = () => {
      const end = lastIndex();
      cards().forEach((card, index) => {
        card.style.scrollSnapAlign = index <= end ? "start" : "none";
      });
    };

    const syncEnds = (index = nearest()) => {
      prev.disabled = index <= 0;
      next.disabled = index >= lastIndex();
    };

    const move = (direction: number) => {
      const places = spots();
      const index = nearest();
      const target = Math.min(lastIndex(), Math.max(0, index + direction));
      if (target === index) return;
      syncEnds(target);
      track.scrollTo({ left: places[target] ?? 0, behavior: motion });
    };

    const settle = () => {
      const places = spots();
      const end = lastIndex();
      const max = places[end] ?? 0;
      if (track.scrollLeft > max + 1) {
        track.scrollTo({ left: max, behavior: "auto" });
        return;
      }
      syncEnds();
    };

    const onResize = () => {
      markSnaps();
      settle();
    };

    markSnaps();
    syncEnds(0);
    const onPrev = () => move(-1);
    const onNext = () => move(1);
    prev.addEventListener("click", onPrev);
    next.addEventListener("click", onNext);
    track.addEventListener("scrollend", settle);
    window.addEventListener("resize", onResize);

    return () => {
      prev.removeEventListener("click", onPrev);
      next.removeEventListener("click", onNext);
      track.removeEventListener("scrollend", settle);
      window.removeEventListener("resize", onResize);
      cards().forEach((card) => {
        card.style.scrollSnapAlign = "";
      });
    };
  }, []);

  return null;
}
