"""List Kadence buttons on the English homepage, including reusable blocks."""

import importlib.util
import json
import re
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", Path(__file__).with_name("extract-bodies.py"))
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)
BUTTON_REF = extract_bodies.BUTTON_REF
expand_refs = extract_bodies.expand_refs
load_blocks = extract_bodies.load_blocks

blocks, items = load_blocks()
source = expand_refs(items["4993"]["content"], blocks)
buttons = []
for match in BUTTON_REF.finditer(source):
    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError:
        continue
    buttons.append((data.get("text", ""), data.get("link", "")))

for index, match in enumerate(BUTTON_REF.finditer(source), 1):
    data = json.loads(match.group(1))
    before = re.sub(r"<[^>]+>", " ", source[max(0, match.start() - 400) : match.start()])
    before = re.sub(r"\s+", " ", before).strip()[-120:]
    print(f"{index}. {data.get('text')} -> {data.get('link')}")
    print(f"   ...{before}")
