import "@testing-library/jest-dom";

/**
 * jsdom has no ResizeObserver. This stub prevents mount errors only — it does **not** invoke
 * callbacks, so components that depend on RO for layout (e.g. `PipelineFlowPreview`) will not
 * re-measure in unit tests unless a test file replaces `globalThis.ResizeObserver` temporarily.
 */
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}
