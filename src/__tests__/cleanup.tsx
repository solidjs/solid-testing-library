import "@testing-library/jest-dom/extend-expect";
import { onCleanup } from "solid-js";
import { cleanup, render } from "..";

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
