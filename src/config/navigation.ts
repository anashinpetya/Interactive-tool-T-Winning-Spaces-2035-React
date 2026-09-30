import { IMPACTS_PAGE } from "./impacts";
import { MAP_PAGES } from "./mapPages";

export interface NavLink {
  path: string;
  label: string;
}

export interface NavGroup {
  heading: string;
  links: NavLink[];
}

// Sidebar groups
export const NAVIGATION: NavGroup[] = [
  { heading: "Home", links: [{ path: "/", label: "About the tool" }] },
  {
    heading: "Grid maps",
    links: MAP_PAGES.filter((p) => p.group === "Grid maps").map((p) => ({ path: p.path, label: p.navLabel })),
  },
  {
    heading: "Traffic changes",
    links: MAP_PAGES.filter((p) => p.group === "Traffic changes").map((p) => ({ path: p.path, label: p.navLabel })),
  },
  { heading: IMPACTS_PAGE.group, links: [{ path: IMPACTS_PAGE.path, label: IMPACTS_PAGE.navLabel }] },
];
