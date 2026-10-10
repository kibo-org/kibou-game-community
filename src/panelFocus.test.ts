import { describe, expect, it, vi } from "vitest";
import { createPanelFocus } from "./panelFocus";

function target() {
  const node = {
    isConnected: true, hidden: false, disabled: false, tabIndex: 0,
    focus: vi.fn(),
    closest: vi.fn((): unknown => node.hidden ? node : null),
    matches: vi.fn((selector: string) => selector.startsWith(":disabled") ? node.disabled : true),
    contains: vi.fn(() => false),
  };
  return node;
}
function setup() {
  const panel = target(), heading = target(), fallback = target(), trigger = target();
  let active = trigger;
  const focus = createPanelFocus({
    panel: panel as unknown as HTMLElement,
    heading: heading as unknown as HTMLElement,
    fallback: fallback as unknown as HTMLElement,
    activeElement: () => active as unknown as Element,
  });
  return { panel, heading, fallback, trigger, focus, activate: (node: typeof trigger) => { active = node; } };
}

describe("non-modal panel focus", () => {
  it("focuses the heading and restores the outside trigger", () => {
    const { focus, panel, trigger, heading } = setup();
    focus.remember(); focus.focusHeading(); focus.close();
    expect(heading.tabIndex).toBe(-1);
    expect(heading.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(panel.hidden).toBe(true);
    expect(trigger.focus).toHaveBeenCalledWith({ preventScroll: true });
  });
  it("does not replace the trigger with a panel child removed during rerender", () => {
    const { focus, panel, trigger, activate } = setup();
    focus.remember();
    const child = target(); activate(child); panel.contains.mockReturnValue(true);
    focus.remember(); child.isConnected = false; focus.close();
    expect(trigger.focus).toHaveBeenCalled();
    expect(child.focus).not.toHaveBeenCalled();
  });
  it.each(["detached", "hidden", "disabled"])("uses stable navigation if the trigger is %s", condition => {
    const { focus, trigger, fallback } = setup();
    focus.remember();
    if (condition === "detached") trigger.isConnected = false;
    if (condition === "hidden") trigger.hidden = true;
    if (condition === "disabled") trigger.disabled = true;
    focus.close();
    expect(trigger.focus).not.toHaveBeenCalled();
    expect(fallback.focus).toHaveBeenCalledWith({ preventScroll: true });
  });
  it("captures a new outside trigger even while the panel is already open", () => {
    const { focus, trigger, activate } = setup();
    focus.remember();
    const navigation = target(); activate(navigation); focus.remember(); focus.close();
    expect(navigation.focus).toHaveBeenCalled();
    expect(trigger.focus).not.toHaveBeenCalled();
  });
});
