import "@testing-library/jest-dom/extend-expect";
import { createSignal, createEffect, createContext, useContext, ParentComponent } from "solid-js";
import { render, renderHook, screen } from "..";
import userEvent from "@testing-library/user-event";
import { m } from "vitest/dist/index-2f5b6168";

declare global {
  var _$HY: Record<string, any>;
}

globalThis._$HY = {};

test("render calls createEffect immediately", () => {
  const cb = vi.fn();

  function Comp() {
    createEffect(cb);
    return null;
  }

  render(() => <Comp />);

  expect(cb).toHaveBeenCalledTimes(1);
});

test("findByTestId returns the element", async () => {
  let ref!: HTMLDivElement;

  render(() => <div ref={ref} data-testid="foo" />);

  expect(await screen.findByTestId("foo")).toBe(ref);
});

test("userEvent triggers createEffect calls", async () => {
  const cb = vi.fn();

  function Counter() {
    createEffect(() => (count(), cb()));

    const [count, setCount] = createSignal(0);

    return <button onClick={() => setCount(count() + 1)}>{count()}</button>;
  }

  const {
    container: { firstChild: buttonNode }
  } = render(() => <Counter />);

  cb.mockClear();
  await userEvent.click(buttonNode! as Element);
  expect(buttonNode).toHaveTextContent("1");
  expect(cb).toHaveBeenCalledTimes(1);
});

test("calls to hydrate will run createEffects", () => {
  const cb = vi.fn();

  function Comp() {
    createEffect(cb);
    return null;
  }

  render(() => <Comp />, { hydrate: true });

  expect(cb).toHaveBeenCalledTimes(1);
});

test("queries should not return elements outside of the container", () => {
  const { container, getAllByText } = render(() => <div>Some text...</div>);
  const falseContainer = document.createElement("p");
  falseContainer.textContent = "Some text...";
  container.parentNode!.insertBefore(falseContainer, getAllByText("Some text...")[0].parentNode);
  expect(getAllByText("Some text...")[0] === container.childNodes[0]).toBe(true);
});

test("wrapper option works correctly", () => {
  const { asFragment } = render(() => <div>Component</div>, {
    wrapper: props => <div>Wrapper {props.children}</div>
  });
  expect(asFragment()).toBe("<div>Wrapper <div>Component</div></div>");
});

test("wrapper option includes context", async () => {
  const context = createContext<string>("test");
  const Wrapper: ParentComponent = props => (
    <context.Provider value="works">{props.children}</context.Provider>
  );
  const { asFragment } = render(() => <div>{useContext(context)}</div>, { wrapper: Wrapper });
  expect(asFragment()).toBe("<div>works</div>");
});

test("renderHook works correctly", () => {
  const createDate = () => {
    const [date, setDate] = createSignal(new Date());
    return [date, (d: Date) => (d ? setDate(d) : setDate(new Date()))] as const;
  };
  const {
    result: [date, setDate]
  } = renderHook(createDate);
  expect(date()).toBeInstanceOf(Date);
  const newDate = new Date();
  setDate(newDate);
  expect(date()).toBe(newDate);
});

test("renderHook accepts hook props as array parameter", () => {
  const { result } = renderHook(opts => opts, ["option value"]);
  expect(result).toBe("option value");
});

test("renderHook accepts hook props as option value", () => {
  const { result } = renderHook(opts => opts, { initialProps: ["option value"] });
  expect(result).toBe("option value");
});

test("wrapper context is available in renderHook", () => {
  const context = createContext("initial value");
  const testHook = () => useContext(context);
  const Wrapper: ParentComponent = props => (
    <context.Provider value="context value">{props.children}</context.Provider>
  );
  const { result } = renderHook(testHook, { wrapper: Wrapper });
  expect(result).toBe("context value");
});
