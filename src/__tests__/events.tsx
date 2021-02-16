import { Dynamic } from "solid-js/web";
import { fireEvent, render } from "..";

const eventTypes = [
  {
    type: "Clipboard",
    events: ["copy", "paste"],
    elementType: "input"
  },
  {
    type: "Composition",
    events: ["compositionEnd", "compositionStart", "compositionUpdate"],
    elementType: "input"
  },
  {
    type: "Keyboard",
    events: ["keyDown", "keyPress", "keyUp"],
    elementType: "input",
    init: { keyCode: 13 }
  },
  {
    type: "Focus",
    events: ["focus", "blur"],
    elementType: "input"
  },
  {
    type: "Form",
    events: ["focus", "blur"],
    elementType: "input"
  },
  {
    type: "Focus",
    events: ["input", "invalid"],
    elementType: "input"
  },
  {
    type: "Focus",
    events: ["submit"],
    elementType: "form"
  },
  {
    type: "Mouse",
    events: [
      "click",
      "contextMenu",
      "dblClick",
      "drag",
      "dragEnd",
      "dragEnter",
      "dragExit",
      "dragLeave",
      "dragOver",
      "dragStart",
      "drop",
      "mouseDown",
      "mouseEnter",
      "mouseLeave",
      "mouseMove",
      "mouseOut",
      "mouseOver",
      "mouseUp"
    ],
    elementType: "button"
  },
  {
    type: "Selection",
    events: ["select"],
    elementType: "input"
  },
  {
    type: "Touch",
    events: ["touchCancel", "touchEnd", "touchMove", "touchStart"],
    elementType: "button"
  },
  {
    type: "UI",
    events: ["scroll"],
    elementType: "div"
  },
  {
    type: "Wheel",
    events: ["wheel"],
    elementType: "div"
  },
  {
    type: "Media",
    events: [
      "abort",
      "canPlay",
      "canPlayThrough",
      "durationChange",
      "emptied",
      "encrypted",
      "ended",
      "error",
      "loadedData",
      "loadedMetadata",
      "loadStart",
      "pause",
      "play",
      "playing",
      "progress",
      "rateChange",
      "seeked",
      "seeking",
      "stalled",
      "suspend",
      "timeUpdate",
      "volumeChange",
      "waiting"
    ],
    elementType: "video"
  },
  {
    type: "Image",
    events: ["load", "error"],
    elementType: "img"
  },
  {
    type: "Animation",
    events: ["animationStart", "animationEnd", "animationIteration"],
    elementType: "div"
  },
  {
    type: "Transition",
    events: ["transitionEnd"],
    elementType: "div"
  }
];

eventTypes.forEach(({ type, events, elementType, init }) => {
  describe(`${type} Events`, () => {
    events.forEach(eventName => {
      const eventProp = eventName.toLowerCase();

      it(`triggers ${eventProp}`, () => {
        let ref!: HTMLElement;
        const spy = jest.fn();

        render(() => <Dynamic component={elementType} ref={ref} on={{ [eventProp]: spy }} />);

        // @ts-ignore
        fireEvent[eventName](ref, init);

        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });
});

test("onInput works", () => {
  const handler = jest.fn();

  const {
    container: { firstChild: input }
  } = render(() => <input type="text" onInput={handler} />);

  fireEvent.input(input!, { target: { value: "a" } });

  expect(handler).toHaveBeenCalledTimes(1);
});

test("calling `fireEvent` directly works too", () => {
  const handleEvent = jest.fn();

  const {
    container: { firstChild: button }
  } = render(() => <button onClick={handleEvent} />);

  fireEvent(
    button!,
    new Event("MouseEvent", {
      bubbles: true,
      cancelable: true,
      button: 0
    } as any)
  );
});
