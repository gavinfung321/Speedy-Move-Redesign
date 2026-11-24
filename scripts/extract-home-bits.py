import html
import re
from pathlib import Path

raw = Path("content/raw-home-4993.html").read_text(encoding="utf-8")
for match in re.finditer(r"<h2[^>]*>(.*?)</h2>", raw, flags=re.S):
    text = re.sub(r"<[^>]+>", "", match.group(1))
    text = html.unescape(text).replace("\xa0", " ").strip()
    print("H2:", " ".join(text.split())[:120])

paragraphs = []
for match in re.finditer(r"<p[^>]*>(.*?)</p>", raw, flags=re.S):
    text = re.sub(r"<[^>]+>", "", match.group(1))
    text = html.unescape(text).replace("\xa0", " ")
    text = " ".join(text.split())
    if len(text) > 80:
        paragraphs.append(text)
Path("content/home-paragraphs.json").write_text(
    __import__("json").dumps(paragraphs, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
print("wrote", len(paragraphs), "paragraphs")
print("--- items ---")
for match in re.finditer(r'<h2 class="wp-block-heading[^"]*">([^<]+)</h2>', raw):
    start = max(0, match.start() - 800)
    chunk = raw[start : match.end() + 400]
    hrefs = re.findall(r'href="(https://speedy-move.com[^"]+)"', chunk)
    images = re.findall(r'src="(https://speedy-move.com[^"]+)"', chunk)
    print(match.group(1))
    print(" ", hrefs[-1] if hrefs else "")
    print(" ", images[-1] if images else "")
