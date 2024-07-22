import { createSignal, catchError } from "solid-js";
import { render, fireEvent } from "..";
import { A, Route, Router, useParams } from "@solidjs/router";

describe("location option", () => {
  const Ids = () => (
    <>
      <p>Id: {useParams()?.id}</p>
      <p>
        <A href="/ids/9999" noScroll>
          navigate
        </A>
      </p>
    </>
  );
  const App = () => (
    <>
      <Route path="/ids/:id" component={Ids} />
      <Route path="/" component={() => <p>Start</p>} />
    </>
  );

  it("can render the main route", async () => {
    const { findByText } = render(() => <App />, { location: "/" });
    expect(await findByText("Start")).not.toBeFalsy();
  });

  it("can render a route with the id", async () => {
    const { findByText } = render(() => <App />, { location: "/ids/1234" });
    expect(await findByText("Id: 1234")).not.toBeFalsy();
  });

  it("can switch between routes", async () => {
    const { findByText } = render(() => <App />, { location: "/ids/4321" });
    await findByText("Id: 4321");
    fireEvent.click(await findByText("navigate"));
    expect(await findByText("Id: 9999")).not.toBeFalsy();
  });

  it("does not use a router without the location option", async () => {
    const NoRouter = () => {
      const [state, setState] = createSignal("loading");
      catchError(
        () => {
          useParams();
          setState("router present");
        },
        () => setState("no router present")
      );
      return <p>{state()}</p>;
    };
    const { findByText } = render(() => <NoRouter />);
    expect(await findByText("no router present")).not.toBeFalsy();
  });

  it("does not work with a wrapped router", async () => {
    const { findByText } = render(() => <Router><App /></Router>, { location: "/ids/1111" });
    expect(await findByText("Id: 1111").catch(() => false)).toBeFalsy();
  });
});
