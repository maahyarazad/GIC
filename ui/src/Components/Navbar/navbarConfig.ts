// Navbar geometry. Keep in sync with ui/src/styles/_navbar.scss.

/** At or below this width the hamburger shows and the dashboard sidebar is off-canvas. */
export const NAVBAR_BREAKPOINT = 1024;
export const NAVBAR_HEIGHT = 70;
/** Extra room the links need before leaving compact mode, so the bar doesn't flicker at the edge. */
export const NAVBAR_FIT_HYSTERESIS = 24;

export const isNavbarCollapsedWidth = () =>
  typeof window !== "undefined" && window.innerWidth <= NAVBAR_BREAKPOINT;
