import menuItems from "@/content/menus.json";

type FlatMenuItem = {
  menu: string;
  id: string;
  order: number;
  parent: string;
  title: string;
  url: string;
};

export type MenuItem = {
  label: string;
  href?: string;
  children: MenuItem[];
};

function decodeLabel(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function menuTree(menu: string): MenuItem[] {
  const rows = (menuItems as FlatMenuItem[]).filter(
    (item) => item.menu === menu && item.url !== "#pll_switcher",
  );
  const children = new Map<string, FlatMenuItem[]>();
  for (const row of rows) {
    const list = children.get(row.parent) ?? [];
    list.push(row);
    children.set(row.parent, list);
  }

  const build = (parent: string): MenuItem[] =>
    (children.get(parent) ?? [])
      .sort((a, b) => a.order - b.order)
      .map((row) => ({
        label: decodeLabel(row.title),
        href: row.url || undefined,
        children: build(row.id),
      }));

  return build("0");
}

export const mainMenu = menuTree("main-menu");
export const chineseMenu = menuTree("menu-hk");
export const footerMenu = menuTree("footer-menu");
