"""Replace identical repeated sections with one shared marker."""

import importlib.util
import sys
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", Path(__file__).with_name("extract-bodies.py"))
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

SECTIONS = {
    "8198": "how-it-works",
    "8809": "how-it-works-zh",
    "8203": "all-kinds",
    "8825": "all-kinds-zh",
    "8200": "contact-info",
    "8858": "contact-info-zh",
    "8212": "faq",
    "10654": "faq-zh",
    "8213": "pricing",
    "10650": "pricing-zh",
    "8197": "fast-and-easy",
    "10445": "fast-and-easy-zh",
    "8209": "near-you",
    "8998": "near-you-zh",
}

ROOT = Path(__file__).resolve().parents[1]
SECTION_DIR = ROOT / "content" / "sections"
BODY_DIR = ROOT / "content" / "bodies"


def main() -> None:
    selected = set(sys.argv[1:])
    blocks, _items = extract_bodies.load_blocks()
    SECTION_DIR.mkdir(parents=True, exist_ok=True)
    rendered = {}
    for block_id, name in SECTIONS.items():
        if selected and name not in selected:
            continue
        html = extract_bodies.to_html(blocks[block_id], blocks).strip()
        (SECTION_DIR / f"{name}.html").write_text(html + "\n", encoding="utf-8")
        rendered[name] = html
        print(name, len(html))

    ordered = sorted(rendered.items(), key=lambda item: len(item[1]), reverse=True)
    for path in sorted(BODY_DIR.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        updated = text
        used = []
        for name, html in ordered:
            marker = f'<div data-shared="{name}"></div>'
            if html and html in updated:
                updated = updated.replace(html, marker)
                used.append(name)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            print(path.name, ", ".join(used))


if __name__ == "__main__":
    main()
