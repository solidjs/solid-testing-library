import type { BoundFunction, prettyFormat, Queries, queries } from "@testing-library/dom";
import type { JSX } from "solid-js";

export interface Ref {
  container: HTMLElement;
  dispose: () => void;
}

export type Ui = () => JSX.Element;

export interface Options {
  container?: HTMLElement;
  baseElement?: HTMLElement;
  queries?: Queries;
  hydrate?: boolean;
}

export type Extra<Q extends Queries = typeof queries> = { [P in keyof Q]: BoundFunction<Q[P]> };

export type DebugFn = (
  baseElement?: HTMLElement | HTMLElement[],
  maxLength?: number,
  options?: prettyFormat.OptionsReceived
) => void;

export type Result = {
  container: HTMLElement;
  baseElement: HTMLElement;
  debug: DebugFn;
  unmount: () => void;
} & Extra;
