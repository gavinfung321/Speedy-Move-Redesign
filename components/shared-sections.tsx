import { readFileSync } from "node:fs";
import path from "node:path";

const directory = path.join(process.cwd(), "content", "sections");

function sectionHtml(name: string): string {
  return readFileSync(path.join(directory, `${name}.html`), "utf8").replaceAll("\u00a0", " ");
}

export function SharedSection({ name, className }: { name: string; className: string }) {
  return (
    <section
      className={className}
      data-shared={name}
      dangerouslySetInnerHTML={{ __html: sectionHtml(name) }}
    />
  );
}
