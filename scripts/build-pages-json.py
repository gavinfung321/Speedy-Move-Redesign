"""Write content/pages.json from the URL checklist for the Next.js routes."""

import csv
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "content" / "url-checklist.csv"
pages = []
with source.open(encoding="utf-8-sig", newline="") as handle:
    for row in csv.DictReader(handle):
        if row["status"] != "publish":
            continue
        pages.append(
            {
                "path": row["path"],
                "title": row["title"],
                "description": html.unescape(row["rank_math_description"]),
                "seoTitle": html.unescape(row["rank_math_title"]) or row["title"],
                "language": row["language"],
                "template": row["template"],
                "postType": row["post_type"],
            }
        )

target = ROOT / "content" / "pages.json"
target.write_text(json.dumps(pages, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"wrote {len(pages)} pages to {target.name}")
