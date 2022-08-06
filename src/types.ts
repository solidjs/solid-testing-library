import type { Component } from "solid-js";
import type { Queries, BoundFunction, prettyFormat } from "@testing-library/dom";

export interface Ref {
  container: HTMLElement;
  dispose: () => void;
}

export type Ui = Component;

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
  options?: prettyFormat.OptionsReceived
) => void;

export type Result = {
  container: HTMLElement;
  baseElement: HTMLElement;
  debug: DebugFn;
  unmount: () => void;
} & Extra;
