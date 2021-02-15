import { Queries, BoundFunction } from "@testing-library/dom";
import { JSX } from "solid-js";
import type { OptionsReceived } from "pretty-format";
declare function render(ui: () => JSX.Element, { container, baseElement, queries, hydrate }?: {
    container?: HTMLElement;
    baseElement?: HTMLElement;
    queries?: Queries;
    hydrate?: boolean;
}): {
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: (baseElement?: HTMLElement | HTMLElement[], maxLength?: number, options?: OptionsReceived) => void;
    unmount: () => void;
    asFragment: () => DocumentFragment;
} & {
    [P in keyof Queries]: BoundFunction<Queries[P]>;
};
declare function cleanup(): void;
export * from "@testing-library/dom";
export { render, cleanup };
