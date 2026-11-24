"""Show why the blog page has headings and no posts."""

import importlib.util
import re

spec = importlib.util.spec_from_file_location("extract_bodies", "scripts/extract-bodies.py")
extract_bodies = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extract_bodies)
blocks, items = extract_bodies.load_blocks()
source = extract_bodies.expand_refs(items["3518"]["content"], blocks)
names = re.findall(r"<!--\s*wp:([\w/-]+)", source)
from collections import Counter
print(Counter(names).most_common(12))
for match in re.finditer(r"<!--\s*wp:kadence/posts\s+(\{.*?\})\s*/-->", source, re.S):
    print(match.group(1)[:400])
    print("---")
