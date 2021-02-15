import type { JSX } from "solid-js";
import type { OptionsReceived } from "pretty-format";
import type { Queries, BoundFunction } from "@testing-library/dom";

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

export type Extra = { [P in keyof Queries]: BoundFunction<Queries[P]> };

export type DebugFn = (
  baseElement?: HTMLElement | HTMLElement[],
  maxLength?: number,
  options?: OptionsReceived
) => void;

export type Result = {
  container: HTMLElement;
  baseElement: HTMLElement;
  debug: DebugFn;
  unmount: () => void;
} & Extra;
