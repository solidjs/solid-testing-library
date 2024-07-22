<h1>
  <img width="100%" src="https://assets.solidjs.com/banner?type=core&project=solid-testing-library" alt="Solid Testing Library">
</h1>
<div align="center">
<p>Simple and complete Solid DOM testing utilities that encourage good testing
practices.</p>

> Inspired completely by [preact-testing-library](https://github.com/testing-library/preact-testing-library)

[![Coverage Status](https://coveralls.io/repos/github/ryansolid/solid-testing-library/badge.svg?branch=main)](https://coveralls.io/github/ryansolid/solid-testing-library?branch=main)
[![NPM Version](https://img.shields.io/npm/v/@solidjs/testing-library.svg?style=flat)](https://www.npmjs.com/package/@solidjs/testing-library)
[![NPM Downloads](https://img.shields.io/npm/dm/solid-testing-library.svg?style=flat)](https://www.npmjs.com/package/solid-testing-library)
[![Discord](https://img.shields.io/discord/722131463138705510)](https://discord.com/invite/solidjs)

</div>

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Installation](#installation)
- [Docs](#docs)
- [Issues](#issues)
- [Acknowledgement](#acknowledgment)

---


## The Problem

You want to write tests for your Solid components so that they avoid including implementation details, and are maintainable in the long run.


## The Solution

The Solid Testing Library is a very lightweight solution for testing Solid components. Its primary guiding principle is:

> [The more your tests resemble the way your software is used, the more confidence they can give you.](https://twitter.com/kentcdodds/status/977018512689455106)

## Installation

This module is distributed via npm which is bundled with node and should be installed
as one of your project's `devDependencies`:

```sh
npm install --save-dev @solidjs/testing-library
```

If you using Jest we recommend using [solid-jest](https://github.com/solidjs/solid-jest) to properly resolve the browser version of Solid as Jest will default to the server version when run in Node.

💡 If you are using Jest or vitest, you may also be interested in installing `@testing-library/jest-dom` so you can use
[the custom jest matchers](https://github.com/testing-library/jest-dom).


## Integration with Vite

A working Vite template setup with `solid-testing-library` and TypeScript support can be found [for classic solid](https://github.com/solidjs/templates/tree/main/ts-vitest) and [for solid-start](https://github.com/solidjs/solid-start/tree/main/examples/with-vitest).


## Docs

See the [docs](https://testing-library.com/docs/preact-testing-library/intro) over at the Testing Library website.

There are several key differences, though:

⚠️ The `render` function takes in a function that returns a Solid Component, rather than simply the component itself.

```tsx
// With @testing-library/preact
const results = render(<YourComponent />, options);
```

```tsx
// With solid-testing-library
const results = render(() => <YourComponent />, options);
```

⚠️ Solid.js does *not* re-render, it merely executes side effects triggered by reactive state that change the DOM, therefore there is no `rerender` method. You can use global signals to manipulate your test component in a way that causes it to update.

Solid.js reactive changes are pretty instantaneous, so there is rarely need to use `waitFor(…)`, `await findByRole(…)` and other asynchronous queries to test the rendered result, except for transitions, suspense, resources and router navigation.

⚠️ In extension of the original API, the render function of this testing library supports a convenient `location` option that will set up an in-memory router pointing at the specified location. Since this setup is not instantaneous, you need to first use asynchronous queries (`findBy`) after employing it:

```tsx
it('uses params', async () => {
  const App = () => (
    <>
      <Route path="/ids/:id" component={() => <p>Id: {useParams()?.id}</p>} />
      <Route path="/" component={() => <p>Start</p>} />
    </>
  ); 
  const { findByText } = render(() => <App />, { location: "ids/1234" });
  expect(await findByText("Id: 1234")).not.toBeFalsy();
});
```

It uses `@solidjs/router`, so if you want to use a different router, you should consider the `wrapper` option instead. If you attempt to use this without having the package installed, you will receive an error message. At the moment, there is an issue with using `useNavigate` inside of the tests (since you cannot get into the context of a Route), but `<A href="..." noScroll>` inside a `<Route>` will work fine to switch routes during tests.

⚠️ Solid.js external reactive state does not require any DOM elements to run in, so our `renderHook` call to test hooks in the context of a component (if your hook does not require the context of a component, `createRoot` should suffice to test the reactive behavior; for convenience, we also have `testEffect`, which is described later) has no `container`, `baseElement` or queries in its options or return value. Instead, it has an `owner` to be used with [`runWithOwner`](https://www.solidjs.com/docs/latest/api#runwithowner) if required. It also exposes a `cleanup` function, though this is already automatically called after the test is finished.

```ts
function renderHook<Args extends any[], Result>(
  hook: (...args: Args) => Result,
  options: {
    initialProps?: Args,
    wrapper?: Component<{ children: JSX.Element }>
  }
) => {
  result: Result;
  owner: Owner | null;
  cleanup: () => void;
}
```

This can be used to easily test a hook / primitive:

```ts
const { result } = renderHook(createResult);
expect(result).toBe(true);
```

If you are using a `wrapper` with `renderHook`, make sure it will **always** return `props.children` - especially if you are using a context with asynchronous code together with `<Show>`, because this is required to get the value from the hook and it is only obtained synchronously once and you will otherwise only get `undefined` and wonder why this is the case.

⚠️ Solid.js supports [custom directives](https://www.solidjs.com/docs/latest/api#use___), which is a convenient pattern to tie custom behavior to elements, so we also have a `renderDirective` call, which augments `renderHook` to take a directive as first argument, accept an `initialValue` for the argument and a `targetElement` (string, HTMLElement or function returning a HTMLElement) in the `options` and also returns `arg` and `setArg` to read and manipulate the argument of the directive.

```ts
function renderDirective<
  Arg extends any,
  Elem extends HTMLElement
>(
  directive: (ref: Elem, arg: Accessor<Arg>) => void,
  options?: {
    ...renderOptions,
    initialValue: Arg,
    targetElement: 
      | Lowercase<Elem['nodeName']>
      | Elem
      | (() => Elem)
  }
): Result & { arg: Accessor<Arg>, setArg: Setter<Arg> };
```

This allows for very effective and concise testing of directives:

```ts
const { asFragment, setArg } = renderDirective(myDirective);
expect(asFragment()).toBe(
  '<div data-directive="works"></div>'
);
setArg("perfect");
expect(asFragment()).toBe(
  '<div data-directive="perfect"></div>'
);
```

Solid.js manages side effects with different variants of `createEffect`. While you can use `waitFor` to test asynchronous effects, it uses polling instead of allowing Solid's reactivity to trigger the next step. In order to simplify testing those asynchronous effects, we have a `testEffect` helper that complements the hooks for directives and hooks:

```ts
testEffect(fn: (done: (result: T) => void) => void, owner?: Owner): Promise<T>

// use it like this:
test("testEffect allows testing an effect asynchronously", () => {
  const [value, setValue] = createSignal(0);
  return testEffect(done => createEffect((run: number = 0) => {
    if (run === 0) {
      expect(value()).toBe(0);
      setValue(1);
    } else if (run === 1) {
      expect(value()).toBe(1);
      done();
    }
    return run + 1;
  }));
});
```

It allows running the effect inside a defined owner that is received as an optional second argument. This can be useful in combination with `renderHook`, which gives you an owner field in its result. The return value is a Promise with the value given to the `done()` callback. You can either await the result for further assertions or return it to your test runner.


## Issues

If you find any issues *with this library*, please [check on the issues page](https://github.com/solidjs/solid-testing-library/issues) if they are already known. If not, opening an issue will be much appreciated, even more so if it contains a

- short description
- minimal reproduction code
- list of possible workarounds, if there are any

If you think you can fix an issue yourself, feel free to [open a pull-request](https://github.com/solidjs/solid-testing-library/pulls). If functionality changes, please don't forget to add or adapt tests.

Please keep in mind that not all issues related to testing Solid.js code are directly related to this library. In some cases, the culprit might be [Solid's vite plugin](https://github.com/solidjs/vite-plugin-solid) or [Vitest](https://github.com/vitest-dev/vitest) instead. Posting the issue to the correct project will speed up fixing it; if in doubt, you can ask [on our discord](https://discord.com/invite/solidjs).


### Known issues

If you are using [`vitest`](https://vitest.dev/), then tests might fail, because the packages `solid-js`, and `@solidjs/router` (if used) need to be loaded only once, and they could be loaded both through the internal `vite` server and through node. Typical bugs that happen because of this is that dispose is supposedly undefined, or the router could not be loaded.

Since version 2.8.2, our vite plugin has gained the capability to configure everything for testing, so you should only need extra configuration for globals, coverage, etc.

## Acknowledgement

Thanks goes to [Kent C. Dodds](https://kentcdodds.com/) and his colleagues for creating testing-library and to the creators of [preact-testing-library](https://github.com/testing-library/preact-testing-library).

This library has been created by Ryan Carniato and is currently maintained by Alex Lohr.
