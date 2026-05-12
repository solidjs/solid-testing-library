import "@testing-library/jest-dom/vitest";
import { onCleanup } from "solid-js";
import { cleanup, render } from "..";
import { render as solidRender } from "@solidjs/web";

vi.mock(import("@solidjs/web"), async (importOriginal) => {
  const solidWeb = await importOriginal();
  const renderFn = vi.fn(solidWeb.render);
  return { ...solidWeb, render: renderFn };
});

test("cleans up the document", () => {
  const spy = vi.fn();
  const divId = "my-div";

  function Test() {
    onCleanup(() => {
      expect(document.getElementById(divId)).toBeInTheDocument();
      spy();
    });
    return <div id={divId} />;
  }

  render(() => <Test />);
  cleanup();
  expect(document.body.innerHTML).toBe("");
  expect(spy).toHaveBeenCalledTimes(1);
});

test("cleanup does not error when an element is not a child", () => {
  render(() => <div />, { container: document.createElement("div") });
  cleanup();
});

test("cleanup warns if dispose is not a function", () => {
  (solidRender as unknown as { mockReturnValueOnce: (r: any) => void }).mockReturnValueOnce(null);
  const warn = console.warn;
  console.warn = vi.fn();
  render(() => <div />);
  cleanup();
  expect(console.warn).toHaveBeenCalledWith(
    "solid-testing-library: dispose is not a function - maybe your tests include multiple solid versions!"
  );
  console.warn = warn;
})

