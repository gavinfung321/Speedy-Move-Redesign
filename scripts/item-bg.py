"""Print image-related keys on the first two item-page rows."""

import json
import re
import importlib.util

spec = importlib.util.spec_from_file_location("extract_bodies", "scripts/extract-bodies.py")
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)
index = json.load(open("content/body-index.json", encoding="utf-8"))
blocks, items = extract_bodies.load_blocks()
source = extract_bodies.expand_refs(items[index["/air-conditioner-removal/"]["id"]]["content"], blocks)


def image_keys(value, trail=""):
    found = []
    if isinstance(value, dict):
        for key, child in value.items():
            found.extend(image_keys(child, f"{trail}.{key}"))
    elif isinstance(value, list):
        for child in value[:4]:
            found.extend(image_keys(child, trail + "[]"))
    elif isinstance(value, str) and "/uploads/" in value:
        found.append((trail, value.rsplit("/", 1)[-1][:80]))
    return found


position = 0
for number in range(2):
    start = source.find("<!-- wp:kadence/rowlayout", position)
    brace = source.find("{", start)
    depth = 0
    for index, char in enumerate(source[brace:], brace):
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                data = json.loads(source[brace : index + 1])
                print("\nROW", number + 1, "align", data.get("align"), "minHeight", data.get("minHeight"), data.get("minHeightUnit"))
                for key, name in image_keys(data):
                    print(" ", key, name)
                # nearby text
                text = extract_bodies.plain(re.sub(r"<[^>]+>", " ", source[index : index + 1500]))[:180]
                print(" text:", text)
                position = index
                break
