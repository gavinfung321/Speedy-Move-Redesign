import importlib.util
import re
from pathlib import Path

spec = importlib.util.spec_from_file_location("extract_bodies", "scripts/extract-bodies.py")
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)
blocks, items = extract_bodies.load_blocks()
source = extract_bodies.expand_refs(items["6796"]["content"], blocks)
source = extract_bodies.materialize_comments(source)
for match in re.finditer(r"<a\b[^>]*>.*?</a>", source, re.S):
    snippet = match.group(0)
    if "<img" in snippet:
        print(snippet[:500])
        print("---")
