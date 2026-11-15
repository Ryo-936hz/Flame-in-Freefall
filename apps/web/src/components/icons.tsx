/* Small stroke icons for navigation. Decorative: every use sits next to a text label. */
const paths = {
  "ai-research": <><circle cx="12" cy="12" r="3" /><circle cx="5" cy="5" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="m7 7 3 3m4 4 3 3M7 17l3-3m4-4 3-3" /></>,
  investigate: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /><path d="M8.5 11h5M11 8.5v5" /></>,
  lab: <><path d="M9 3h6M10 3v6.2L4.8 18.4A1.7 1.7 0 0 0 6.3 21h11.4a1.7 1.7 0 0 0 1.5-2.6L14 9.2V3" /><path d="M7.5 15h9" /></>,
  report: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  catalog: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /><path d="M9 8h6" /></>,
  overview: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  saffire: <><circle cx="12" cy="12" r="7" /><path d="M12 2v5M12 17v5M2 12h5M17 12h5" /></>,
  /*
   * Earth globe, "Earth Globe Line" from Liny Tiny Line Icons by Raminrzdh, CC Attribution
   * License, via SVG Repo (https://www.svgrepo.com/svg/430293/earth-globe-line). Path
   * data unchanged; it is drawn on the same 24-unit grid as the other icons.
   */
  chat: <><circle cx="12" cy="12" r="9" /><path d="M8 4V6C8 7.10457 8.89543 8 10 8H11C12.1046 8 13 8.89543 13 10V10C13 11.1046 13.8954 12 15 12V12C16.1046 12 17 11.1046 17 10V10C17 8.89543 17.8954 8 19 8H20M20 16H17C15.8954 16 15 16.8954 15 18V20M11 20V18C11 16.8954 10.1046 16 9 16V16C7.89543 16 7 15.1046 7 14V14C7 12.8954 6.10457 12 5 12H3" /></>,
  home: <><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v10h12V10" /></>,
  panel: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
  reset: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export type IconName = keyof typeof paths;

export function Icon({ name }: { name: IconName }) {
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}
