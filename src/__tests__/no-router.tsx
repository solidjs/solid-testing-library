import { render } from "..";

describe("router functionality without a router", () => { 
  it("emits a helpful console.error message if you attempt to use the router without having it installed", async () => {
    vi.mock('@solidjs/router', () => ({ default: {} }));
    const errorMock = vi.spyOn(console, "error");
    let errorMessage = "";
    errorMock.mockImplementation((message) => { errorMessage = message; });
    const { findByText } = render(() => <p>Anyhoo</p>, { location: "/" });
    await findByText("Anyhoo");
    expect(errorMessage).toMatch("@solidjs/router");
  }); 
});

