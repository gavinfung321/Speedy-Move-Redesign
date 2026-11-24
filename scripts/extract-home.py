"""Write the full simplified English homepage body."""

import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", Path(__file__).with_name("extract-bodies.py"))
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)

blocks, items = extract_bodies.load_blocks()
html = extract_bodies.to_html(items["4993"]["content"], blocks)
out = Path(__file__).resolve().parents[1] / "content" / "bodies" / "4993.html"
out.write_text(html, encoding="utf-8")
print(len(html), html.count("<a "), html.count("<img"))
