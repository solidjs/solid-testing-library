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
import { render, renderDirective, renderHook, screen, testEffect } from "..";
import userEvent from "@testing-library/user-event";

declare global {
  var _$HY: Record<string, any>;
}

globalThis._$HY = {};

test.only("render calls createEffect immediately (after flushing)", () => {
  const cb = vi.fn();

  function Comp() {
    createEffect(() => true, cb);
    return null;
  }

  render(() => <Comp />);
  
  flush();
  
  expect(cb).toHaveBeenCalledTimes(1);
});

test.only("findByTestId returns the element", async () => {
  let ref!: HTMLDivElement;

  render(() => <div ref={ref} data-testid="foo" />);

  expect(await screen.findByTestId("foo")).toBe(ref);
});

test.only("userEvent triggers createEffect calls (after flushing)", async () => {
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

test.skip("calls to hydrate will run createEffects (after flushing)", () => {
  const cb = vi.fn();

  function Comp() {
    createEffect(() => true, cb);
    return null;
  }

  render(() => <Comp />, { hydrate: true });

  flush();
  
  expect(cb).toHaveBeenCalledTimes(1);
});

test.only("queries should not return elements outside of the container", () => {
  const { container, getAllByText } = render(() => <div>Some text...</div>);
  const falseContainer = document.createElement("p");
  falseContainer.textContent = "Some text...";
  container.parentNode!.insertBefore(falseContainer, getAllByText("Some text...")[0].parentNode);
  expect(getAllByText("Some text...")[0] === container.childNodes[0]).toBe(true);
});

test.only("wrapper option works correctly", () => {
  const { asFragment } = render(() => <div>Component</div>, {
    wrapper: props => <div>Wrapper {props.children}</div>
  });
  expect(asFragment()).toBe("<div>Wrapper <div>Component</div></div>");
});

test.only("wrapper option includes context", async () => {
  const Context = createContext<string>("test");
  const Wrapper: ParentComponent = props => (
    <Context value="works">{props.children}</Context>
  );
  const { asFragment } = render(() => <div>{useContext(Context)}</div>, { wrapper: Wrapper });
  expect(asFragment()).toBe("<div>works</div>");
});

test.only("For does not need a parent wrapper", () => {
  const { getByText } = render(() => <For each={['a', 'b', 'c']}>{(i) => <span>{i()}</span>}</For>);
  expect(getByText('b')).toBeInTheDocument();
});

test.only("renderHook works correctly", () => {
  const getTruth = () => 42
  const { result } = renderHook(getTruth);
  expect(result).toBe(42);
});

test.only("renderHook accepts hook props as array parameter", () => {
  const { result } = renderHook(opts => opts, ["option value"]);
  expect(result).toBe("option value");
});

test.only("renderHook accepts hook props as option value", () => {
  const { result } = renderHook(opts => opts, { initialProps: ["option value"] });
  expect(result).toBe("option value");
});

test.skip("wrapper context is available in renderHook", () => {
  const Context = createContext("initial value");
  const testHook = () => useContext(Context);
  const Wrapper: ParentComponent = props => (
    <Context value="context value">{props.children}</Context>
  );
  const { result } = renderHook(testHook, { wrapper: Wrapper });
  expect(result).toBe("context value");
});

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      noArgDirective: boolean;
      argDirective: string;
    }
  }
}

type NoArgDirectiveArg = Accessor<JSX.Directives["noArgDirective"]>;

test.skip("renderDirective works for directives without an argument", () => {
  const noArgDirective: (ref: HTMLElement, arg: NoArgDirectiveArg) => void = (ref: HTMLElement) => {
    ref.dataset.directive = "works";
  };
  const { asFragment } = renderDirective(noArgDirective);
  expect(asFragment()).toBe('<div data-directive="works"></div>');
});

test.skip("renderDirective accepts different targetElement types", () => {
  const noArgDirective: (ref: HTMLElement, arg: NoArgDirectiveArg) => void = (ref: HTMLElement) => {
    ref.dataset.directive = "works";
  };
  const { asFragment: getHtml1 } = renderDirective(noArgDirective, { targetElement: "span" });
  expect(getHtml1()).toBe('<span data-directive="works"></span>');
  const button = document.createElement("button");
  const { asFragment: getHtml2 } = renderDirective(noArgDirective, { targetElement: button });
  expect(getHtml2()).toBe('<button data-directive="works"></button>');
  const getH3 = () => document.createElement("h3");
  const { asFragment: getHtml3 } = renderDirective(noArgDirective, { targetElement: getH3 });
  expect(getHtml3()).toBe('<h3 data-directive="works"></h3>');
  const { asFragment: getHtml4 } = renderDirective(noArgDirective, { targetElement: {} as unknown as HTMLElement });
  expect(getHtml4()).toBe('<div data-directive="works"></div>');
});

test.skip("renderDirective works for directives with argument", () => {
  const argDirective = (ref: HTMLSpanElement, arg: Accessor<string>) => {
    createEffect(() => {}, () => {
      ref.dataset.directive = arg();
    });
  };
  const { asFragment, setArg } = renderDirective(argDirective, {
    initialValue: "initial value",
    targetElement: "span"
  });
  expect(asFragment()).toBe('<span data-directive="initial value"></span>');
  setArg("updated value");
  expect(asFragment()).toBe('<span data-directive="updated value"></span>');
});

test.only("testEffect allows testing an effect asynchronously", () => {
  const [value, setValue] = createSignal(0);
  return testEffect(done =>
    createEffect<[run: number, value: number]>(
      ([run]) => [run + 1, value()],
      ([run, value]) => {
        if (run === 0) {
          expect(value).toBe(0);
          setValue(1);
        } else if (run === 1) {
          expect(value).toBe(1);
          done();
        }
      },
      [-1, 0]
    )
  );
});

test.only("testEffect catches errors", () => {
  const [value, setValue] = createSignal<{ error: string }>({ error: "not yet" });
  return testEffect(done =>
    createEffect<[run: number, value: { error: string }]>(
      ([run]) => [run + 1, value()], 
      ([run, value]) => {
        console.log(run, value);
        if (!value) { throw new Error('works'); }
        if (run === 0) {
          setValue(null as any);
        }
        if (run === 1) {
          done();
        }
      },  
      [-1, value()]
    ))
    .then(() => {
      throw new Error("Error swallowed by testEffect!");
    })
    .catch((e: Error) => expect(e.message).toBe("works"));
});

test.only("testEffect runs with owner", () => {
  const [owner, dispose] = createRoot(dispose => [getOwner(), dispose]);
  return testEffect(
    done =>
      createEffect(
        () => 1, 
        (_value) => {
          expect(getOwner()).toBe(owner);
          dispose();
          done();
        }
      ),
    owner!
  );
});

