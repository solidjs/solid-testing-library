import { getQueriesForElement, prettyDOM } from "@testing-library/dom";
import { hydrate as solidHydrate, render as solidRender } from "solid-js/web";

import type { Ui, Result, Options, Ref } from "./types";

/**
 * Shim for the teardown function
 */
declare var teardown: Function | undefined;

/* istanbul ignore next */
if (!process.env.STL_SKIP_AUTO_CLEANUP) {
  if (typeof afterEach === "function") {
    afterEach(async () => {
      await cleanup();
    });
  } else if (typeof teardown === "function") {
    teardown(async () => {
      await cleanup();
    });
  }
}

const mountedContainers = new Set<Ref>();

function render(ui: Ui, options: Options = {}): Result {
  let { container, baseElement = container, queries, hydrate = false } = options;

  if (!baseElement) {
    // Default to document.body instead of documentElement to avoid output of potentially-large
    // head elements (such as JSS style blocks) in debug output.
    baseElement = document.body;
  }

  if (!container) {
    container = baseElement.appendChild(document.createElement("div"));
  }

  const dispose = hydrate
    ? ((solidHydrate(ui, container) as unknown) as () => void)
    : solidRender(ui, container);

  // We'll add it to the mounted containers regardless of whether it's actually
  // added to document.body so the cleanup method works regardless of whether
  // they're passing us a custom container or not.
  mountedContainers.add({ container, dispose });

  const queryHelpers = getQueriesForElement(container, queries)

  return {
    container,
    baseElement,
    debug: (el = baseElement, maxLength, options) =>
      Array.isArray(el)
        ? el.forEach(e => console.log(prettyDOM(e, maxLength, options)))
        : console.log(prettyDOM(el, maxLength, options)),
    unmount: dispose,
    ...queryHelpers
  } as Result;
}

function cleanupAtContainer(ref: Ref) {
  const { container, dispose } = ref;
  dispose();

  if (container.parentNode === document.body) {
    document.body.removeChild(container);
  }

  mountedContainers.delete(ref);
}

function cleanup() {
  mountedContainers.forEach(cleanupAtContainer);
}

export * from "@testing-library/dom";
export { render, cleanup };
