import "@testing-library/jest-dom/extend-expect";
import { createSignal, createEffect } from "solid-js";
import { fireEvent, render, screen } from "..";

declare global {
  var _$HYDRATION: Record<string, any>;
}

globalThis._$HYDRATION = {};

test("render calls createEffect immediately", () => {
  const cb = jest.fn();

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

test("fireEvent triggers createEffect calls", () => {
  const cb = jest.fn();

  function Counter() {
    createEffect(() => (count(), cb()));

    const [count, setCount] = createSignal(0);

    return <button onClick={() => setCount(count() + 1)}>{count()}</button>;
  }

  const {
    container: { firstChild: buttonNode }
  } = render(() => <Counter />);

  cb.mockClear();
  fireEvent.click(buttonNode!);
  expect(buttonNode).toHaveTextContent("1");
  expect(cb).toHaveBeenCalledTimes(1);
});

test("calls to hydrate will run createEffects", () => {
  const cb = jest.fn();

  function Comp() {
    createEffect(cb);
    return null;
  }

  render(() => <Comp />, { hydrate: true });

  expect(cb).toHaveBeenCalledTimes(1);
});
