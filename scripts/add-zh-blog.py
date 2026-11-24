"""Add the Chinese blog index and point 更多網誌 at it."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = "/zh/網誌/"
POSTS = [
    "/zh/五大香港舊傢俬回收的最佳方法/",
    "/zh/香港十大傢俬回收服務/",
    "/zh/香港十大傢俬棄置公司/",
    "/zh/香港十大最大垃圾處理場/",
    "/zh/香港最佳傢俬棄置收費指南/",
    "/zh/香港最佳處理舊傢俬的7種方法/",
]

pages_path = ROOT / "content" / "pages.json"
pages = json.loads(pages_path.read_text(encoding="utf-8"))
if not any(page["path"] == PATH for page in pages):
    pages.append(
        {
            "path": PATH,
            "title": "網誌",
            "description": "",
            "seoTitle": "%title% %sitename%",
            "language": "zh",
            "template": "company",
            "postType": "page",
        }
    )
    pages_path.write_text(json.dumps(pages, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

index_path = ROOT / "content" / "body-index.json"
index = json.loads(index_path.read_text(encoding="utf-8"))
index[PATH] = {"id": "zh-blog", "words": 6, "kind": "page"}
index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

items = "".join(f'<li><a href="{href}">{href.removeprefix("/zh/").strip("/")}</a></li>' for href in POSTS)
body = f"<ul>{items}</ul>\n<div data-shared=\"contact-info-zh\"></div>\n"
(ROOT / "content" / "bodies" / "zh-blog.html").write_text(body, encoding="utf-8")

menus_path = ROOT / "content" / "menus.json"
menus = json.loads(menus_path.read_text(encoding="utf-8"))
if not any(item.get("url") == PATH for item in menus):
    menus.append(
        {
            "menu": "menu-hk",
            "id": "zh-blog",
            "order": 19,
            "parent": "0",
            "title": "網誌",
            "type": "post_type",
            "object": "page",
            "objectId": "zh-blog",
            "url": PATH,
        }
    )
    menus_path.write_text(json.dumps(menus, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

replaced = 0
for path in (ROOT / "content" / "bodies").glob("*.html"):
    text = path.read_text(encoding="utf-8")
    updated = text.replace('href="/blog/">更多網誌', 'href="/zh/網誌/">更多網誌')
    if updated != text:
        path.write_text(updated, encoding="utf-8")
        replaced += 1
print("more-blog links", replaced)
