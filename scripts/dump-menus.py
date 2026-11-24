"""Print published WordPress nav menus with labels and paths."""

from __future__ import annotations

import csv
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
EXPORT = ROOT / "WordPress.2026-11-24.xml"
CHECKLIST = ROOT / "content" / "url-checklist.csv"
WP = "{http://wordpress.org/export/1.2/}"

pages: dict[str, dict[str, str]] = {}
with CHECKLIST.open(encoding="utf-8", newline="") as handle:
    for row in csv.DictReader(handle):
        if row["id"]:
            pages[row["id"]] = row

tree = ET.parse(EXPORT)
items = []
for item in tree.getroot().find("channel").findall("item"):
    if (item.findtext(f"{WP}post_type") or "") != "nav_menu_item":
        continue
    if (item.findtext(f"{WP}status") or "") != "publish":
        continue
    meta = {}
    for postmeta in item.findall(f"{WP}postmeta"):
        key = postmeta.findtext(f"{WP}meta_key") or ""
        if key.startswith("_menu_item_") and key not in meta:
            meta[key] = postmeta.findtext(f"{WP}meta_value") or ""
    menu = ""
    for category in item.findall("category"):
        if category.get("domain") == "nav_menu":
            menu = category.get("nicename") or ""
    object_id = meta.get("_menu_item_object_id", "")
    linked = pages.get(object_id, {})
    items.append(
        {
            "menu": menu,
            "id": item.findtext(f"{WP}post_id"),
            "order": int(item.findtext(f"{WP}menu_order") or 0),
            "parent": meta.get("_menu_item_menu_item_parent", "0"),
            "title": (item.findtext("title") or "").strip() or linked.get("title", ""),
            "type": meta.get("_menu_item_type", ""),
            "object": meta.get("_menu_item_object", ""),
            "objectId": object_id,
            "url": meta.get("_menu_item_url", "") or linked.get("path", ""),
        }
    )

by_menu: dict[str, list[dict]] = {}
for item in items:
    by_menu.setdefault(item["menu"], []).append(item)

for menu, rows in by_menu.items():
    print(f"== {menu}")
    children: dict[str, list[dict]] = {}
    for row in rows:
        children.setdefault(row["parent"], []).append(row)

    def walk(parent: str, depth: int) -> None:
        for row in sorted(children.get(parent, []), key=lambda entry: entry["order"]):
            print(f"{'  ' * depth}{row['title']} -> {row['url']}")
            walk(row["id"], depth + 1)

    walk("0", 0)
