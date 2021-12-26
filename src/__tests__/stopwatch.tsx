import { createSignal, onCleanup } from "solid-js";
import { fireEvent, screen, render } from "..";

function StopWatch() {
  const [lapse, setLapse] = createSignal(0);
  const [running, setRunning] = createSignal(false);
  let timer: number;

  const handleRunClick = () => {
    if (running()) {
      clearInterval(timer);
    } else {
      const startTime = Date.now() - lapse();
      timer = setInterval(() => setLapse(Date.now() - startTime));
    }
    return setRunning(!running());
  };

  const handleClearClick = () => {
    clearInterval(timer);
    setLapse(0);
    setRunning(false);
  };

  onCleanup(() => clearInterval(timer));

  return (
    <div>
      <span>{lapse()}ms</span>
      <button onClick={handleRunClick}>{running() ? "Stop" : "Start"}</button>
      <button onClick={handleClearClick}>Clear</button>
    </div>
  );
}

const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time));

test("unmounts a component", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});

  const { unmount, container } = render(() => <StopWatch />);

  fireEvent.click(screen.getByText("Start") as Element);

  unmount();

  // Hey there reader! You don't need to have an assertion like this one
  // this is just me making sure that the unmount function works.
  // You don't need to do this in your apps. Just rely on the fact that this works.
  expect(container.innerHTML).toBe("");

  // Just wait to see if the interval is cleared or not.
  // If it's not, then we'll call setState on an unmounted component and get an error.
  await wait((() => expect(console.error).not.toHaveBeenCalled()) as any);
});
