import { getQueriesForElement, prettyDOM } from "@testing-library/dom";
import { Accessor, ComponentProps, createComponent, createRoot, createSignal, getOwner, JSX, onMount, Setter } from "solid-js";
import { hydrate as solidHydrate, render as solidRender } from "solid-js/web";

import type { Ui, Result, Options, Ref, RenderHookResult, RenderHookOptions, RenderDirectiveOptions, RenderDirectiveResult } from "./types";

/* istanbul ignore next */
if (!process.env.STL_SKIP_AUTO_CLEANUP) {
  if (typeof afterEach === "function") {
    afterEach(async () => {
      await cleanup();
    });
  }
}

const mountedContainers = new Set<Ref>();

function render(ui: Ui, options: Options = {}): Result {
  let { container, baseElement = container, queries, hydrate = false, wrapper } = options;

  if (!baseElement) {
    // Default to document.body instead of documentElement to avoid output of potentially-large
    // head elements (such as JSS style blocks) in debug output.
    baseElement = document.body;
  }

  if (!container) {
    container = baseElement.appendChild(document.createElement("div"));
  }

  const wrappedUi: Ui = typeof wrapper === 'function'
    ? () => createComponent(wrapper!, { get children() { return createComponent(ui, {}); } })
    : ui;

  const dispose = hydrate
    ? ((solidHydrate(wrappedUi, container) as unknown) as () => void)
    : solidRender(wrappedUi, container);

  // We'll add it to the mounted containers regardless of whether it's actually
  // added to document.body so the cleanup method works regardless of whether
  // they're passing us a custom container or not.
  mountedContainers.add({ container, dispose });

  const queryHelpers = getQueriesForElement(container, queries)

  return {
    asFragment: () => container?.innerHTML as string,
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

export function renderHook<A extends any[], R>(
  hook: (...args: A) => R,
  options?: RenderHookOptions<A>
): RenderHookResult<R> {
  const initialProps: A | [] = Array.isArray(options) ? options : options?.initialProps || [];
  const [dispose, owner, result] = createRoot((dispose) => {
    if (typeof options === 'object' && 'wrapper' in options && typeof options.wrapper === "function") {
      let result: ReturnType<typeof hook>;
      options.wrapper({ get children() {
        return createComponent(() => {
          result = hook(...initialProps as A);
          return null;
        }, {});
      } });
      return [dispose, getOwner(), result!]
    }
    return [dispose, getOwner(), hook(...initialProps as A)]
  });

  mountedContainers.add({ dispose });

  return { result, cleanup: dispose, owner };
}

export function renderDirective<A extends any, U extends A, E extends HTMLElement>(
  directive: (ref: E, arg: Accessor<U>) => void,
  options?: RenderDirectiveOptions<U, E>
): RenderDirectiveResult<U> {
  const [arg, setArg] = createSignal(options?.initialValue as U);
  return Object.assign(render(() => {
    const targetElement = options?.targetElement &&
      (options.targetElement instanceof HTMLElement
        ? options.targetElement
        : typeof options.targetElement === 'string'
        ? document.createElement(options.targetElement)
        : typeof options.targetElement === 'function'
        ? options.targetElement()
        : undefined) ||
      document.createElement('div');
    onMount(() => directive(targetElement as E, arg as Accessor<U>));
    return targetElement;
  }, options), { arg, setArg });
}

function cleanupAtContainer(ref: Ref) {
  const { container, dispose } = ref;
  dispose();

  if (container?.parentNode === document.body) {
    document.body.removeChild(container);
  }

  mountedContainers.delete(ref);
}

function cleanup() {
  mountedContainers.forEach(cleanupAtContainer);
}

export * from "@testing-library/dom";
export { render, cleanup };
