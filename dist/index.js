import { getQueriesForElement, prettyDOM } from "@testing-library/dom";
import { hydrate as solidHydrate, render as solidRender } from "solid-js/web";
if (!process.env.STL_SKIP_AUTO_CLEANUP) {
    if (typeof afterEach === 'function') {
        afterEach(async () => {
            await cleanup();
        });
        // @ts-ignore
    }
    else if (typeof teardown === 'function') {
        // @ts-ignore
        teardown(async () => {
            await cleanup();
        });
    }
}
const mountedContainers = new Set();
function render(ui, { container, baseElement = container, queries, hydrate = false } = {}) {
    if (!baseElement) {
        // Default to document.body instead of documentElement to avoid output of potentially-large
        // head elements (such as JSS style blocks) in debug output.
        baseElement = document.body;
    }
    if (!container) {
        container = baseElement.appendChild(document.createElement("div"));
    }
    const dispose = hydrate
        ? solidHydrate(ui, container)
        : solidRender(ui, container);
    // We'll add it to the mounted containers regardless of whether it's actually
    // added to document.body so the cleanup method works regardless of whether
    // they're passing us a custom container or not.
    mountedContainers.add({ container, dispose });
    return {
        container,
        baseElement,
        debug: (el = baseElement, maxLength, options) => Array.isArray(el)
            ? el.forEach(e => console.log(prettyDOM(e, maxLength, options)))
            : console.log(prettyDOM(el, maxLength, options)),
        unmount: dispose,
        asFragment: () => {
            if (typeof document.createRange === "function") {
                return document.createRange().createContextualFragment(container.innerHTML);
            }
            else {
                const template = document.createElement("template");
                template.innerHTML = container.innerHTML;
                return template.content;
            }
        },
        ...getQueriesForElement(baseElement, queries)
    };
}
function cleanupAtContainer(ref) {
    const { container, dispose } = ref;
    dispose();
    if (container.parentNode === document.body) {
        document.body.removeChild(container);
    }
    mountedContainers.delete(ref);
}
function cleanup() {
    mountedContainers.forEach(cleanupAtContainer);
}
export * from "@testing-library/dom";
export { render, cleanup };
