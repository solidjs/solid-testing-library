import "@testing-library/jest-dom/extend-expect";
import { screen, render } from "..";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  // @ts-ignore
  console.log.mockRestore();
});

test("debug pretty prints the container", () => {
  const HelloWorld = () => <h1>Hello World</h1>;

  render(() => <HelloWorld />);

  screen.debug();

  expect(console.log).toHaveBeenCalledTimes(1);
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Hello World"));
});

test("debug pretty prints multiple containers", () => {
  const HelloWorld = () => (
    <>
      <h1 data-testid="testId">Hello World</h1>
      <h1 data-testid="testId">Hello World</h1>
    </>
  );

  const { debug, getAllByTestId } = render(() => <HelloWorld />);
  const multipleElements = getAllByTestId("testId");
  debug(multipleElements);
  expect(console.log).toHaveBeenCalledTimes(2);
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Hello World"));
});

test("allows same arguments as prettyDOM", () => {
  const HelloWorld = () => <h1>Hello World</h1>;
  const { debug, container } = render(() => <HelloWorld />);
  debug(container, 6, { highlight: false });
  expect(console.log).toHaveBeenCalledTimes(1);
  // @ts-ignore
  expect(console.log.mock.calls[0]).toMatchInlineSnapshot(`
    [
      "<div>
    ...",
    ]
  `);
});
