"""Show the content inside the first row of a few item pages."""

import json
import re
import importlib.util

spec = importlib.util.spec_from_file_location("extract_bodies", "scripts/extract-bodies.py")
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)
index = json.load(open("content/body-index.json", encoding="utf-8"))
blocks, items = extract_bodies.load_blocks()


def first_row(source: str) -> tuple[str, str]:
    start = source.find("<!-- wp:kadence/rowlayout")
    brace = source.find("{", start)
    depth = 0
    end_brace = brace
    for index, char in enumerate(source[brace:], brace):
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end_brace = index
                break
    data = json.loads(source[brace : end_brace + 1])
    close = source.find("<!-- /wp:kadence/rowlayout -->", end_brace)
    inner = source[end_brace + 1 : close]
    return data.get("bgImg", ""), inner


for path in ("/air-conditioner-removal/", "/bed-removal/", "/sofa-removal/"):
    source = extract_bodies.expand_refs(items[index[path]["id"]]["content"], blocks)
    image, inner = first_row(source)
    html = extract_bodies.to_html(inner, blocks)
    print("\n==", path)
    print("bg", image.rsplit("/", 1)[-1])
    print(html[:900])
