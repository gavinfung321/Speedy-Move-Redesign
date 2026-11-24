"""Point every Blog and 網誌 teaser at the shared three-post lists."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BODY = ROOT / "content" / "bodies"
SECTIONS = ROOT / "content" / "sections"

PAIRS = (
    ("blog-teaser", (SECTIONS / "blog-teaser.html").read_text(encoding="utf-8").strip()),
    ("blog-teaser-zh", (SECTIONS / "blog-teaser-zh.html").read_text(encoding="utf-8").strip()),
)
EMPTY = {
    "blog-teaser": "<h2>Blog</h2>\n<p><a href=\"/blog/\">More Blog</a></p>",
    "blog-teaser-zh": "<h2>網誌</h2>\n<p><a href=\"/zh/網誌/\">更多網誌</a></p>",
}

counts = {name: 0 for name, _html in PAIRS}
for path in BODY.glob("*.html"):
    text = path.read_text(encoding="utf-8")
    updated = text
    for name, html in PAIRS:
        marker = f'<div data-shared="{name}"></div>'
        if marker in updated:
            continue
        if html in updated:
            updated = updated.replace(html, marker)
            counts[name] += 1
        elif EMPTY[name] in updated:
            updated = updated.replace(EMPTY[name], marker)
            counts[name] += 1
    if updated != text:
        path.write_text(updated, encoding="utf-8")

print(counts)
