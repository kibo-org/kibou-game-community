export function required<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Community UI element missing: ${id}`);
  return node as T;
}

export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createAction(
  label: string,
  run: () => void | Promise<void>,
  reportError: (message: string) => void,
  primary = false,
): HTMLButtonElement {
  const button = element("button", label);
  button.type = "button";
  if (primary) button.className = "primary";
  button.onclick = async () => {
    button.disabled = true;
    try {
      await run();
    } catch (error) {
      reportError(error instanceof Error ? error.message : "The local demo could not complete this action.");
    } finally { button.disabled = false; }
  };
  return button;
}
