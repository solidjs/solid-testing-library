import { getQueriesForElement, prettyDOM } from "@testing-library/dom";
import {
  createComponent,
  createErrorBoundary,
  createRoot,
  flush,
  getOwner,
  onSettled,
  runWithOwner,
  type Owner,
} from "solid-js";
import { hydrate as solidHydrate, render as solidRender } from "@solidjs/web";

import type {
  Ui,
  Result,
  Options,
  Ref,
  RenderHookResult,
  RenderHookOptions,
  RenderRefOptions,
} from "./types";

/* type extension for hydration context */
declare global {
  var _$HY: object;
}

/**
 * Solid.js 2.0 no longer supports directives, so this function has been replaced with renderRef
 * @deprecated
 *
 * ```ts
 * // before
 * const directive = (ref, arg) => ...;
 * const { arg, setArg } = renderDirective(directive, { targetElement });
 *
 * // after
 * const [arg, setArg] = createSignal();
 * const refHandler = (arg) => (ref) => ...;
 * renderRef(ref(arg), { targetElement });
 * ```
 */
export function renderDirective(...args: any[]) { throw new Error('Solid-2.0 no longer supports directives. Use ref instead.'); }

/* istanbul ignore next */
if (typeof process === 'undefined' || !process.env.STL_SKIP_AUTO_CLEANUP) {
  //@ts-ignore
  if (typeof afterEach === "function") { afterEach(cleanup); }
}

const mountedContainers = new Set<Ref>();

/**
 * Renders a component to test it
 * @param ui {Ui} a function calling the component
 * @param options {Options} test options
 * @returns {Result} references and tools to test the component
 *
 * ```ts
 * const { getByText } = render(() => <App />, { wrapper: I18nProvider });
 * const button = getByText('Accept');
 * ```
 * ### Options
 * - `options.container` - the HTML element which the UI will be rendered into; otherwise a `<div>` will be created
 * - `options.baseElement` - the parent of the container, the default will be `<body>`
 * - `options.queries` - custom queries (see https://testing-library.com/docs/queries/about)
 * - `options.hydrate` - `true` if you want to test hydration
 * - `options.wrapper` - a component that applies a context provider and returns `props.children`
 * - `options.location` - wraps the component in a solid-router with memory integration pointing at the given path
 *
 * ### Result
 * - `result.asFragment()` - returns the HTML fragment as string
 * - `result.container` - the container in which the component is rendered
 * - `result.baseElement` - the parent of the component
 * - `result.debug()` - returns helpful debug output on the console
 * - `result.unmount()` - unmounts the component, usually automatically called in cleanup
 * - `result.`[queries] - testing library queries, see https://testing-library.com/docs/queries/about)
 */
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

  const wrappedUi: Ui =
    typeof wrapper === "function"
      ? () =>
          createComponent(wrapper!, {
            get children() {
              return createComponent(ui, {});
            }
          })
      : ui;

  const dispose = hydrate
    ? solidHydrate(wrappedUi, container)
    : solidRender(wrappedUi, container);

  // We'll add it to the mounted containers regardless of whether it's actually
  // added to document.body so the cleanup method works regardless of whether
  // they're passing us a custom container or not.
  mountedContainers.add({ container, dispose });

  const queryHelpers = getQueriesForElement(container, queries);

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

const hasInitialProps = <A>(options: RenderHookOptions<A> | A | {}): options is RenderHookOptions<A> => 
  Array.isArray((options as RenderHookOptions<A>)?.initialProps);

/**
 * "Renders" a hook to test it
 * @param hook {() => unknown)} a hook or primitive
 * @param options {RenderHookOptions} test options
 * @returns {RenderHookResult} references and tools to test the hook/primitive
 *
 * ```ts
 * const { result } = render(useI18n, { wrapper: I18nProvider });
 * expect(result.t('test')).toBe('works');
 * ```
 * ### Options
 * - `options.initialProps` - an array with the props that the hook will be provided with.
 * - `options.wrapper` - a component that applies a context provider and **always** returns `props.children`
 *
 * ### Result
 * - `result.result` - the return value of the hook/primitive
 * - `result.owner` - the reactive owner in which the hook is run (in order to run other reactive code in the same context with [`runWithOwner`](https://www.solidjs.com/docs/latest/api#runwithowner))
 * - `result.cleanup()` - calls the cleanup function of the hook/primitive
 */
function renderHook<A extends [] | [any, ...any[]], R>(
  hook: (...args: A) => R,
  options: A | RenderHookOptions<A> = [] as A,
): RenderHookResult<R> {
  const initialProps: A = Array.isArray(options as A) 
    ? options as A
    : hasInitialProps(options) 
    ? options.initialProps as A
    : [] as A;
  const wrapper = Object.hasOwn(options, 'wrapper') && (options as RenderHookOptions<A>).wrapper!;
  
  const container = document.createElement('div');
  document.body.appendChild(container);
  let result;
  let owner: Owner | null = null;
  const Comp = () => {
    flush();
    result = hook(...initialProps);
    owner = getOwner();
    return null;
  }
  const wrapped = wrapper
    ? () => createComponent(wrapper, { get children() { return createComponent(Comp, {}); } })
    : () => createComponent(Comp, {});
  const dispose = solidRender(wrapped, container);
  mountedContainers.add({ container, dispose });
  flush();
  return { result: result!, cleanup: dispose, owner };
}

/**
 * Applies ref(s) to a test container
 * @param directive {(ref, value: () => unknown)} a reusable custom directive
 * @param options {RenderRefOptions} test options
 * @returns {RenderDirectiveResult} references and tools to test the directive
 *
 * ```ts
 * const called = vi.fn()
 * const { getByText, baseContainer } = render(onClickOutside, { initialValue: called });
 * expect(called).not.toBeCalled();
 * fireEvent.click(baseContainer);
 * expect(called).toBeCalled();
 * ```
 * ### Options
 * - `options.targetElement` - the name of a HTML element as a string or a HTMLElement or a function returning a HTMLElement
 * - `options.container` - the HTML element which the UI will be rendered into; otherwise a `<div>` will be created
 * - `options.baseElement` - the parent of the container, the default will be `<body>`
 * - `options.queries` - custom queries (see https://testing-library.com/docs/queries/about)
 * - `options.hydrate` - `true` if you want to test hydration
 * - `options.wrapper` - a component that applies a context provider and returns `props.children`
 *
 * ### Result
 * - `result.arg()` - the accessor for the value that the directive receives
 * - `result.setArg()` - the setter for the value that the directive receives
 * - `result.asFragment()` - returns the HTML fragment as string
 * - `result.container` - the container in which the component is rendered
 * - `result.baseElement` - the parent of the component
 * - `result.debug()` - returns helpful debug output on the console
 * - `result.unmount()` - unmounts the component, usually automatically called in cleanup
 * - `result.`[queries] - testing library queries, see https://testing-library.com/docs/queries/about)
 */
function renderRef<A extends any, U extends A, E extends HTMLElement>(
  ref: (ref: E) => void,
  options: RenderRefOptions<U, E> = {}
): Result {
  return render(() => {
    const targetElement =
      (options?.targetElement &&
        (options.targetElement instanceof HTMLElement
          ? options.targetElement
          : typeof options.targetElement === "string"
          ? document.createElement(options.targetElement)
          : typeof options.targetElement === "function"
          ? options.targetElement()
          : undefined)) ||
      document.createElement("div");
    onSettled(() => Array.isArray(ref) ? ref.forEach(r => r(targetElement as E)) : ref(targetElement as E));
    return targetElement;
  });
}

const rootOrOwner = (owner?: Owner, fn: (dispose?: () => void) => void) =>
  owner ? runWithOwner(owner, fn) : createRoot(fn);

/**
 * testEffect - provides an asynchronous scaffold to test effects in unit tests
 *
 * @param {(done: () => void) => void} testee - test function, calling done() ends the test
 * @param {Owner | null | undefined} owner - the reactive context that should own the test function
 *
 * ```ts
 * it("tests an effect", () => testEffect((done) => {
 *   const [item, setItem] = createSignal(0);
 *   createEffect(() => item(), (item) => {
 *     if (item === 0) { setItem(1); }
       else if (item === 1) { done(); }
       else { throw new Error('item is !== 0/1: ' + item); }
 *   });
 * });
 * ```
 */
function testEffect<T>(
  testee: (done: undefined extends T ? ((result?: T) => void) : ((result: T) => void)) => void,
  owner: Owner | null = null
): Promise<T> {
  return new Promise((done, fail) => rootOrOwner(owner, (dispose) => createErrorBoundary(
    () => testee((result: any) => (done(result), dispose?.())),
    (err: unknown) => (fail(err), queueMicrotask(() => dispose?.())),
  )()));
}

function cleanupAtContainer(ref: Ref) {
  const { container, dispose } = ref;
  if (typeof dispose === 'function') {
    dispose();
  } else {
    console.warn('solid-testing-library: dispose is not a function - maybe your tests include multiple solid versions!');
  }

  if (container?.parentNode === document.body) {
    document.body.removeChild(container);
  }

  mountedContainers.delete(ref);
}

function cleanup() {
  mountedContainers.forEach(cleanupAtContainer);
}

export * from "@testing-library/dom";
export { render, renderHook, renderRef, testEffect, cleanup };
