"use client";

import { useEffect, useRef, useState, type TransitionEvent } from "react";
import type { PostLink } from "@/lib/company-layout";

function columnsFor(width: number) {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  const path = direction === "left" ? "M10 3 L5 8 L10 13" : "M6 3 L11 8 L6 13";
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PostFooter({
  previous,
  next,
  similar,
  language = "en",
}: {
  previous: PostLink | null;
  next: PostLink | null;
  similar: PostLink[];
  language?: "en" | "zh";
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const count = similar.length;
  const [columns, setColumns] = useState(3);
  const [cardWidth, setCardWidth] = useState(0);
  const [gap, setGap] = useState(20);
  const [offset, setOffset] = useState(count);
  const [animate, setAnimate] = useState(true);
  const reduced = useRef(false);
  const looping = count > columns;
  const slides = looping ? [...similar, ...similar, ...similar] : similar;

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setAnimate(false);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const width = stage.clientWidth;
      const nextColumns = Math.min(columnsFor(width), Math.max(count, 1));
      const styles = getComputedStyle(stage);
      const nextGap = Number.parseFloat(styles.getPropertyValue("--similar-gap")) || 20;
      setColumns(nextColumns);
      setGap(nextGap);
      setCardWidth((width - nextGap * Math.max(nextColumns - 1, 0)) / nextColumns);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [count]);

  useEffect(() => {
    setOffset(looping ? count : 0);
  }, [columns, count, looping]);

  useEffect(() => {
    if (animate || reduced.current) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  function go(delta: number) {
    if (!looping) return;
    if (!reduced.current) setAnimate(true);
    setOffset((value) => {
      const max = count * 3 - columns;
      return Math.min(Math.max(value + delta, 0), Math.max(max, 0));
    });
  }

  function settle(event: TransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.propertyName !== "transform" || !looping) return;
    if (offset >= count * 2 || offset < count) {
      setAnimate(false);
      setOffset((value) => {
        const normalized = ((value % count) + count) % count;
        return normalized + count;
      });
    }
  }

  function show(index: number) {
    if (!looping) return;
    if (!reduced.current) setAnimate(true);
    setOffset(count + index);
  }

  if (!previous && !next && count === 0) return null;
  const active = looping ? ((offset % count) + count) % count : 0;
  const zh = language === "zh";

  return (
    <div className="post-footer">
      {previous || next ? (
        <nav className="post-pager" aria-label={zh ? "文章" : "Posts"}>
          <div>
            {previous ? (
              <a className="post-pager-prev" href={previous.path}>
                <span>{zh ? "← 上一篇" : "← Previous"}</span>
                {previous.title}
              </a>
            ) : null}
          </div>
          <span className="post-pager-rule" aria-hidden="true" />
          <div>
            {next ? (
              <a className="post-pager-next" href={next.path}>
                <span>{zh ? "下一篇 →" : "Next →"}</span>
                {next.title}
              </a>
            ) : null}
          </div>
        </nav>
      ) : null}
      {count > 0 ? (
        <section className="post-similar" aria-roledescription="carousel" aria-label={zh ? "相關文章" : "Similar posts"}>
          <h2>{zh ? "相關文章" : "Similar Posts"}</h2>
          <div className="post-similar-stage" ref={stageRef}>
            <div className="post-similar-window">
              <div
                className="post-similar-track"
                onTransitionEnd={settle}
                style={{
                  gap,
                  transform: cardWidth ? `translate3d(-${offset * (cardWidth + gap)}px, 0, 0)` : undefined,
                  transition: animate ? "transform 420ms var(--ease-out)" : "none",
                }}
              >
                {slides.map((post, index) => (
                  <a className="post-similar-card" href={post.path} key={`${post.path}-${index}`} style={cardWidth ? { width: cardWidth } : undefined}>
                    {post.image ? <img src={post.image} alt="" /> : <span className="post-similar-fallback" />}
                    <span>{post.title}</span>
                  </a>
                ))}
              </div>
            </div>
            {looping && cardWidth > 0 ? (
              <div className="post-similar-arrows" style={{ height: (cardWidth * 2) / 3 }}>
                <button type="button" aria-label={zh ? "上一組文章" : "Previous posts"} onClick={() => go(-1)}>
                  <Arrow direction="left" />
                </button>
                <button type="button" aria-label={zh ? "下一組文章" : "Next posts"} onClick={() => go(1)}>
                  <Arrow direction="right" />
                </button>
              </div>
            ) : null}
          </div>
          {looping ? (
            <div className="post-similar-dots">
              {similar.map((post, index) => (
                <button
                  key={post.path}
                  type="button"
                  aria-label={post.title}
                  aria-current={index === active ? "true" : undefined}
                  onClick={() => show(index)}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
