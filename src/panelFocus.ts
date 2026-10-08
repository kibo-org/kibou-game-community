type PanelFocusOptions = {
  panel: HTMLElement;
  heading: HTMLElement;
  fallback: HTMLElement;
  activeElement?: () => Element | null;
};

function usable(target: HTMLElement | undefined): target is HTMLElement {
  return Boolean(target?.isConnected && !target.closest("[hidden], [inert]")
    && !target.matches(":disabled, [aria-disabled='true']")
    && target.matches("button, input, select, textarea, a[href], [tabindex]"));
}

/** The panel is non-modal: Tab may reach navigation and never gets trapped. */
export function createPanelFocus({
  panel, heading, fallback, activeElement = () => document.activeElement,
}: PanelFocusOptions) {
  let trigger: HTMLElement | undefined;
  return {
    remember() {
      const active = activeElement();
      // Preserve the outside trigger across panel rerenders and inner navigation.
      if (active && !panel.contains(active) && "focus" in active) {
        const candidate = active as HTMLElement;
        if (usable(candidate)) trigger = candidate;
      }
    },
    focusHeading() {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    },
    close() {
      panel.hidden = true;
      const target = usable(trigger) ? trigger : fallback;
      trigger = undefined;
      if (usable(target)) target.focus({ preventScroll: true });
    },
  };
}
