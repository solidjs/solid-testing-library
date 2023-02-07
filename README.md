<h1>
  <img width="100%" src="https://assets.solidjs.com/banner?type=core&project=solid-testing-library" alt="Solid Testing Library">
</h1>
<div align="center">
<p>Simple and complete Solid DOM testing utilities that encourage good testing
practices.</p>

> Inspired completely by [preact-testing-library](https://github.com/testing-library/preact-testing-library)

[![Coverage Status](https://coveralls.io/repos/github/ryansolid/solid-testing-library/badge.svg?branch=main)](https://coveralls.io/github/ryansolid/solid-testing-library?branch=main)
[![NPM Version](https://img.shields.io/npm/v/@solidjs/testing-library.svg?style=flat)](https://www.npmjs.com/package/@solidjs/testing-library)
[![](https://img.shields.io/npm/dm/solid-testing-library.svg?style=flat)](https://www.npmjs.com/package/solid-testing-library)
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

You want to write tests for your Solid components so that they avoid including implementation
details, and are maintainable in the long run.

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

A working Vite template setup with `solid-testing-library` and TypeScript support can be found [here](https://github.com/solidjs/solid-start/tree/main/examples/with-vitest).

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

⚠️ Solid.js does *not* rerender, it merely executes side effects triggered by reactive state that change the DOM, therefore there is no rerender method. You can use global signals to manipulate your test component in a way that causes it to update.

Solid.js' reactive changes are pretty instantaneous, so there is rarely need to use `waitFor(…)` or `await findByRole(…)` - with the exception of transitions and Suspense.

⚠️ Solid.js external reactive state does not require any DOM elements to run in, so our `renderHook` call has no `container`, `baseElement` or queries in its options or return value. Instead, it has an `owner` to be used with [`runWithOwner`](https://www.solidjs.com/docs/latest/api#runwithowner) if required. It also exposes a `cleanup` function, though this is already automatically called after the test is finished.

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

## Issues

If you find any issues, please [check on the issues page](https://github.com/solidjs/solid-testing-library/issues) if they are already known. If not, opening an issue will be much appreciated, even more so if it contains a

- short description
- minimal reproduction code
- list of possible workarounds, if there are any

If you think you can fix an issue yourself, feel free to [open a pull-request](https://github.com/solidjs/solid-testing-library/pulls). If functionality changes, please don't forget to add or adapt tests.

## Acknowledgment

Thanks goes to [Kent C. Dodds](https://kentcdodds.com/) and his colleagues for creating testing-library and to the creators of [preact-testing-library](https://github.com/testing-library/preact-testing-library).

This library has been created by Ryan Carniato and is currently maintained by Alex Lohr.
