"""List each English article once under one blog category."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BODY = ROOT / "content" / "bodies"
LINK = re.compile(r'<a href="([^"]+)">([^<]+)</a>')
CATEGORIES = {
    "junk-removal": "Junk Removal",
    "furniture-disposal": "Furniture Disposal",
    "home-moving": "Home Moving",
    "office-moving": "Office Moving",
    "recycling": "Recycling",
}
KEEP = {
    "/how-to-dispose-of-an-old-mattress-in-hong-kong-a-comprehensive-guide/": "furniture-disposal",
    "/10-eco-friendly-ways-to-junk-removal-in-hong-kong/": "junk-removal",
    "/what-is-the-meaning-of-junk-removal-in-hong-kong/": "junk-removal",
    "/how-do-i-get-rid-of-a-lot-of-junk-in-hong-kong/": "junk-removal",
    "/top-10-eco-friendly-ways-for-disposing-furniture-in-hong-kong/": "furniture-disposal",
    "/best-guide-to-recycle-furniture-in-hong-kong/": "recycling",
}


def links(slug: str) -> list[tuple[str, str]]:
    html = (BODY / f"category-{slug}.html").read_text(encoding="utf-8")
    return LINK.findall(html)


def main() -> None:
    membership = {slug: links(slug) for slug in CATEGORIES}
    homes: dict[str, list[str]] = {}
    for slug, items in membership.items():
        for href, _title in items:
            homes.setdefault(href, []).append(slug)
    owner: dict[str, str] = {}
    for href, slugs in homes.items():
        if len(slugs) == 1:
            owner[href] = slugs[0]
            continue
        if href not in KEEP:
            raise SystemExit(f"post is in more than one category: {href} {slugs}")
        owner[href] = KEEP[href]

    grouped: dict[str, list[tuple[str, str]]] = {slug: [] for slug in CATEGORIES}
    seen: dict[str, str] = {}
    for slug, items in membership.items():
        for href, title in items:
            if owner[href] != slug or href in seen:
                continue
            seen[href] = slug
            grouped[slug].append((href, title))

    pages = json.loads((ROOT / "content" / "pages.json").read_text(encoding="utf-8"))
    english_posts = {page["path"] for page in pages if page["postType"] == "post" and page["language"] == "en"}
    missing = sorted(english_posts - set(seen))
    extra = sorted(set(seen) - english_posts)
    print("missing", missing)
    print("extra", extra)

    for slug, items in grouped.items():
        ul = "<ul>" + "".join(f'<li><a href="{href}">{title}</a></li>' for href, title in items) + "</ul>"
        (BODY / f"category-{slug}.html").write_text(ul + "\n", encoding="utf-8")
        print(slug, len(items))

    blog_path = BODY / "3518.html"
    blog = blog_path.read_text(encoding="utf-8")
    for slug, heading in CATEGORIES.items():
        ul = (BODY / f"category-{slug}.html").read_text(encoding="utf-8").strip()
        needle = f"<h2>{heading}</h2>"
        if f"{needle}\n<ul>" in blog:
            continue
        blog = blog.replace(needle, f"{needle}\n{ul}", 1)
    blog_path.write_text(blog, encoding="utf-8")
    print("blog links", len(LINK.findall(blog)))


if __name__ == "__main__":
    main()
