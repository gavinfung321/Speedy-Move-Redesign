import type { ReactNode } from "react";
import { ContactForm } from "@/components/contact-form";
import { SharedSection } from "@/components/shared-sections";
import { applyChineseShared } from "@/lib/home-layout";

const MARKER = /<div data-shared="([\w-]+)"><\/div>/g;

export function ImportedBody({ html, variant }: { html: string; variant: "home" | "page" }) {
  const className = variant === "home" ? "home-copy" : "imported-body";
  const parts = applyChineseShared(html).replaceAll("\u00a0", " ").split(MARKER);
  const nodes: ReactNode[] = [];

  for (let index = 0; index < parts.length; index += 1) {
    if (index % 2 === 1) {
      const name = parts[index];
      if (name === "fast-and-easy" || name === "fast-and-easy-zh") continue;
      if (name === "contact-form" || name === "contact-form-zh") {
        nodes.push(
          <div key={name + index} className={className}>
            <ContactForm language={name === "contact-form-zh" ? "zh" : "en"} />
          </div>,
        );
        continue;
      }
      nodes.push(<SharedSection key={name + index} name={name} className={className} />);
      continue;
    }
    if (!parts[index].trim()) continue;
    nodes.push(<div key={index} className={className} dangerouslySetInnerHTML={{ __html: parts[index] }} />);
  }

  return <div className="imported-stack">{nodes}</div>;
}
