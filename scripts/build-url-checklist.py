"""Build a URL checklist from the WordPress export.

Reads WordPress.2026-11-24.xml and writes content/url-checklist.csv.
The first migration uses the published pages and posts at their current paths.
"""

from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path
from urllib.parse import unquote, urlparse
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
EXPORT = ROOT / "WordPress.2026-11-24.xml"
OUT_CSV = ROOT / "content" / "url-checklist.csv"
OUT_SUMMARY = ROOT / "content" / "url-checklist-summary.json"

WP = "{http://wordpress.org/export/1.2/}"

CORE_SERVICE_SLUGS = {
    "junk-removal",
    "furniture-disposal",
    "moving",
    "demolition-and-restoration",
}

MOVING_SLUGS = {
    "moving-process",
}

COMPANY_SLUGS = {
    "contact",
    "our-story",
    "faq",
    "pricing",
    "blog",
    "donation",
    "locations",
}

LEGAL_SLUGS = {
    "terms-conditions",
}

ITEM_SUFFIXES = (
    "-removal",
    "-disposal",
    "-recycling",
)

SITEMAP_CATEGORIES = {
    "furniture-disposal",
    "junk-removal",
    "recycling",
    "home-moving",
    "office-moving",
}


def text(element: ET.Element | None) -> str:
    if element is None or element.text is None:
        return ""
    return element.text.strip()


def path_from_link(link: str) -> str:
    parsed = urlparse(link)
    path = unquote(parsed.path or "/")
    if not path.startswith("/"):
        path = "/" + path
    if path != "/" and not path.endswith("/"):
        path = path + "/"
    return path


def classify_english(path: str, slug: str, post_type: str) -> str:
    if post_type == "post":
        return "article"
    if path in {"/", "/zh/", "/zh/首頁/"}:
        return "homepage"
    if path.startswith("/locations/") and path != "/locations/":
        return "location"
    if slug in CORE_SERVICE_SLUGS:
        if slug == "moving":
            return "moving"
        if slug == "demolition-and-restoration":
            return "demolition"
        return "core-service"
    if slug in MOVING_SLUGS:
        return "moving"
    if slug in COMPANY_SLUGS:
        return "company"
    if slug in LEGAL_SLUGS:
        return "legal"
    if slug.endswith(ITEM_SUFFIXES):
        return "item-service"
    return "unclassified"


def classify_chinese(path: str) -> str:
    if path in {"/", "/zh/", "/zh/首頁/"}:
        return "homepage"
    if "工程案例" in path:
        return "company"
    if "常見問題" in path:
        return "company"
    if any(word in path for word in ("搬屋", "搬遷", "搬運", "搬別墅")):
        return "moving"
    if "清拆" in path:
        return "demolition"
    if any(word in path for word in ("棄置", "回收", "清理")):
        return "item-service"
    return "unclassified"


def fetch_xml(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": "SpeedyMoveChecklist/1.0"})
    with urlopen(request, timeout=60) as response:
        return response.read()


def live_sitemap_paths() -> set[str]:
    index = ET.fromstring(fetch_xml("https://speedy-move.com/sitemap_index.xml"))
    namespaces = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    paths: set[str] = set()
    for loc in index.findall("sm:sitemap/sm:loc", namespaces):
        sitemap_url = loc.text or ""
        if not any(name in sitemap_url for name in ("page-sitemap", "post-sitemap", "category-sitemap")):
            continue
        sitemap = ET.fromstring(fetch_xml(sitemap_url))
        for page_loc in sitemap.findall("sm:url/sm:loc", namespaces):
            paths.add(path_from_link(page_loc.text or ""))
    return paths


def main() -> None:
    items: list[dict[str, str]] = []
    for _event, elem in ET.iterparse(EXPORT, events=("end",)):
        if elem.tag != "item":
            continue
        post_type = text(elem.find(f"{WP}post_type"))
        if post_type not in {"page", "post"}:
            elem.clear()
            continue

        languages = [
            category.get("nicename", "")
            for category in elem.findall("category")
            if category.get("domain") == "language"
        ]
        categories = [
            category.get("nicename", "")
            for category in elem.findall("category")
            if category.get("domain") == "category"
        ]
        translation_keys = [
            category.get("nicename", "")
            for category in elem.findall("category")
            if category.get("domain") == "post_translations"
        ]
        meta: dict[str, str] = {}
        for postmeta in elem.findall(f"{WP}postmeta"):
            key = text(postmeta.find(f"{WP}meta_key"))
            if key in {"rank_math_title", "rank_math_description", "rank_math_canonical_url"}:
                meta[key] = text(postmeta.find(f"{WP}meta_value"))

        link = text(elem.find("link"))
        items.append(
            {
                "id": text(elem.find(f"{WP}post_id")),
                "post_type": post_type,
                "status": text(elem.find(f"{WP}status")),
                "language": languages[0] if languages else "",
                "path": path_from_link(link),
                "url": link,
                "title": text(elem.find("title")),
                "slug": text(elem.find(f"{WP}post_name")),
                "parent_id": text(elem.find(f"{WP}post_parent")),
                "modified": text(elem.find(f"{WP}post_modified")),
                "rank_math_title": meta.get("rank_math_title", ""),
                "rank_math_description": meta.get("rank_math_description", ""),
                "categories": "|".join(categories),
                "translation_key": translation_keys[0] if translation_keys else "",
            }
        )
        elem.clear()

    by_id = {item["id"]: item for item in items}
    template_by_translation: dict[str, str] = {}

    for item in items:
        if item["language"] == "en" and item["status"] == "publish":
            template = classify_english(item["path"], item["slug"], item["post_type"])
            item["template"] = template
            if item["translation_key"] and template != "unclassified":
                template_by_translation.setdefault(item["translation_key"], template)
        else:
            item["template"] = ""

    for item in items:
        if item["template"]:
            continue
        if item["status"] != "publish":
            item["template"] = "draft"
            continue
        if item["post_type"] == "post":
            item["template"] = "article"
            continue
        if item["path"] in {"/", "/zh/", "/zh/首頁/"}:
            item["template"] = "homepage"
            continue
        inherited = template_by_translation.get(item["translation_key"], "")
        if inherited:
            item["template"] = inherited
            continue
        if item["language"] == "zh":
            item["template"] = classify_chinese(item["path"])
            continue
        item["template"] = classify_english(item["path"], item["slug"], item["post_type"])

    for item in items:
        parent = by_id.get(item["parent_id"])
        item["parent_path"] = parent["path"] if parent and item["parent_id"] != "0" else ""

    category_rows = [
        {
            "id": "",
            "post_type": "category",
            "status": "publish",
            "language": "en",
            "path": f"/category/{slug}/",
            "url": f"https://speedy-move.com/category/{slug}/",
            "title": {
                "furniture-disposal": "Furniture Disposal",
                "home-moving": "Home Moving",
                "junk-removal": "Junk Removal",
                "office-moving": "Office Moving",
                "recycling": "Recycling",
            }[slug],
            "slug": slug,
            "parent_id": "",
            "parent_path": "",
            "modified": "",
            "rank_math_title": "",
            "rank_math_description": "",
            "categories": slug,
            "translation_key": "",
            "template": "category",
        }
        for slug in sorted(SITEMAP_CATEGORIES)
    ]

    rows = items + category_rows
    rows.sort(key=lambda row: (row["post_type"], row["language"], row["path"]))

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "post_type",
        "status",
        "language",
        "template",
        "path",
        "title",
        "slug",
        "id",
        "parent_id",
        "parent_path",
        "url",
        "rank_math_title",
        "rank_math_description",
        "categories",
        "translation_key",
        "modified",
    ]
    with OUT_CSV.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    published = [row for row in items if row["status"] == "publish"]
    published_paths = {row["path"] for row in published}
    category_paths = {row["path"] for row in category_rows}
    checklist_paths = published_paths | category_paths
    sitemap_paths = live_sitemap_paths()
    published_pages = [row for row in published if row["post_type"] == "page"]
    published_posts = [row for row in published if row["post_type"] == "post"]
    summary = {
        "export": EXPORT.name,
        "pages_and_posts": len(items),
        "published_pages": sum(1 for row in published if row["post_type"] == "page"),
        "published_posts": sum(1 for row in published if row["post_type"] == "post"),
        "category_archives": len(category_rows),
        "by_status": dict(Counter(row["status"] for row in items)),
        "published_pages_by_language": dict(
            Counter(row["language"] or "unknown" for row in published_pages)
        ),
        "published_posts_by_language": dict(
            Counter(row["language"] or "unknown" for row in published_posts)
        ),
        "published_by_template": dict(Counter(row["template"] for row in published)),
        "duplicate_published_paths": sorted(
            path
            for path, count in Counter(row["path"] for row in published).items()
            if count > 1
        ),
        "in_export_not_in_sitemap": sorted(checklist_paths - sitemap_paths),
        "in_sitemap_not_in_export": sorted(sitemap_paths - checklist_paths),
        "unclassified_published": [
            {"path": row["path"], "title": row["title"], "language": row["language"]}
            for row in published
            if row["template"] == "unclassified"
        ],
        "unpublished": [
            {
                "path": row["path"],
                "title": row["title"],
                "status": row["status"],
                "language": row["language"],
                "post_type": row["post_type"],
            }
            for row in items
            if row["status"] != "publish"
        ],
    }
    OUT_SUMMARY.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
