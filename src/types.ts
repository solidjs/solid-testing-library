import type { Component, JSX, Owner } from "solid-js";
import { queries } from "@testing-library/dom";
import type { Queries, BoundFunctions, prettyFormat } from "@testing-library/dom";

export interface Ref {
  container?: HTMLElement;
  dispose: () => void;
}

export type Ui = () => JSX.Element;

export interface Options {
  container?: HTMLElement;
  baseElement?: HTMLElement;
  queries?: Queries & typeof queries;
  hydrate?: boolean;
  wrapper?: Component<{ children: JSX.Element }>;
}

export type DebugFn = (
  baseElement?: HTMLElement | HTMLElement[],
  maxLength?: number,
  options?: prettyFormat.OptionsReceived
) => void;

export type Result = BoundFunctions<typeof queries> & {
  asFragment: () => string;
  container: HTMLElement;
  baseElement: HTMLElement;
  debug: DebugFn;
  unmount: () => void;
};

export type RenderHookOptions<A extends any[]> = {
  initialProps?: A
} | A;

export type RenderHookResult<R> = {
  result: R;
  owner: Owner | null;
  cleanup: () => void;
};
