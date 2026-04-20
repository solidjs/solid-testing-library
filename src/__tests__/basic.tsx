import "@testing-library/jest-dom/vitest";
import {
  createSignal,
  createEffect,
  createContext,
  flush,
  useContext,
  ParentComponent,
  Accessor,
  getOwner,
  createRoot,
} from "solid-js";
import { For } from "@solidjs/web";
import type { JSX } from "solid-js";
import { render, renderRef, renderHook, screen, testEffect } from "..";
import userEvent from "@testing-library/user-event";
/*
declare global {
  var _$HY: object;
}*/

test("render calls createEffect immediately (after flushing)", () => {
  const cb = vi.fn();

  function Comp() {
    createEffect(() => true, cb);
    return null;
  }

  render(() => <Comp />);
  
  flush();
  
  expect(cb).toHaveBeenCalledTimes(1);
});

test("findByTestId returns the element", async () => {
  let ref!: HTMLDivElement;

  render(() => <div ref={ref} data-testid="foo" />);

  expect(await screen.findByTestId("foo")).toBe(ref);
});

test("userEvent triggers createEffect calls (after flushing)", async () => {
  const cb = vi.fn();

  function Counter() {
    const [count, setCount] = createSignal(0);

    createEffect(count, cb);
    
    flush();

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

test("calls to hydrate will run effects", () => new Promise<void>((resolve) => {
  globalThis._$HY ??= { events: [], completed: new WeakSet(), r: {} };
  
  function Comp() {
    createEffect(() => true, () => resolve());
    return [];
  }

  render(() => <Comp />, { hydrate: true });
}));

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
  const Context = createContext<string>("test");
  const Wrapper: ParentComponent = props => (
    <Context value="works">{props.children}</Context>
  );
  const { asFragment } = render(() => <div>{useContext(Context)}</div>, { wrapper: Wrapper });
  expect(asFragment()).toBe("<div>works</div>");
});

test("For does not need a parent wrapper", () => {
  const { getByText } = render(() => <For each={['a', 'b', 'c']}>{(i) => <span>{i()}</span>}</For>);
  expect(getByText('b')).toBeInTheDocument();
});

test("renderHook works correctly", () => {
  const getTruth = () => 42
  const { result } = renderHook(getTruth);
  expect(result).toBe(42);
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
  const Context = createContext("initial value");
  const testHook = () => useContext(Context);
  const Wrapper: ParentComponent = props => (
    <Context value="context value">{props.children}</Context>
  );
  const { result } = renderHook(testHook, { wrapper: Wrapper });
  
  expect(result).toBe("context value");
});

test("renderRef works for single ref handlers", () => {
  const refHandler = (ref: HTMLElement) => { ref.dataset.handler = "works"; };
  const { asFragment } = renderRef(refHandler);
  flush();
  expect(asFragment()).toBe('<div data-handler="works"></div>');
});

test("renderRef works for multiple ref handlers", () => {
  const refHandlers = [
    (ref: HTMLElement) => { ref.dataset.handler1 = "works"; },
    (ref: HTMLElement) => { ref.dataset.handler2 = "works"; },
  ];
  const { asFragment } = renderRef(refHandlers);
  flush();
  expect(asFragment()).toBe('<div data-handler1="works" data-handler2="works"></div>');
});

test("testEffect allows testing an effect asynchronously", () => {
  const [value, setValue] = createSignal(0);
  return testEffect(done =>
    createEffect(
      value,
      (v) => {
        if (v === 0) {
          setValue(1);
        } else {
          expect(v).toBe(1);
          done();
        }
      },
    )
  );
}, 1000);

test("testEffect catches errors", () => {
  const [value, setValue] = createSignal("no error");
  return testEffect(done =>
    createEffect(
      value, 
      (v) => {
        if (v === "no error") { setValue("Oh, an error!"); }
        if (v === "error") { throw new Error('works'); }
        if (v === "done") { done(); }
      }
    ))
    .then(() => {
      throw new Error("Error swallowed by testEffect!");
    })
    .catch((e: Error) => (console.trace(e), expect(e?.message).toBe("works")));
}, 1000);

test("testEffect runs with owner", () => {
  const [owner, dispose] = createRoot(dispose => [getOwner(), dispose]);
  return testEffect(
    done => {
      const [runOwner, setRunOwner] = createSignal(owner);
      createEffect(
        runOwner,
        (runOwner) => {
          expect(runOwner).toBe(owner);
          done();
          dispose();
        }
      )
    },
    owner!
  );
}, 1000);

test("testEffect catches errors when running with owner", async () => {
  const [owner, dispose] = createRoot(dispose => [getOwner(), dispose]);
  const [value, setValue] = createSignal("no error");
  return testEffect(done =>
    createEffect(
      value, 
      (v) => {
        if (v === "no error") { setValue("Oh, an error!"); }
        if (v === "error") { throw new Error('works'); }
        if (v === "done") { done(); }
      }
    ), owner)
    .then(() => {
      dispose()
      throw new Error("Error swallowed by testEffect!");
    })
    .catch((e: Error) => (dispose(), console.trace(e), expect(e?.message).toBe("works")));
}, 1000);
