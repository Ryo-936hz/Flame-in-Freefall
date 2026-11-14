import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);
gsap.defaults({ ease: "expo.out", duration: 0.6 });

export { gsap, useGSAP };

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Run an entrance animation only when motion is allowed. Content is visible by
 * default; if frames are throttled (background tab, embedded preview) the
 * timeline is forced to its end so nothing stays hidden.
 */
export function reveal(build: (tl: gsap.core.Timeline) => void, failsafeMs = 2500): (() => void) | void {
  if (prefersReducedMotion() || (typeof document !== "undefined" && document.hidden)) return;
  const tl = gsap.timeline();
  build(tl);
  const timer = window.setTimeout(() => tl.progress(1), failsafeMs);
  return () => { window.clearTimeout(timer); tl.progress(1).kill(); };
}

/** Count a number up from zero inside an element, keeping its final text exact. */
export function countUp(element: Element, to: number, digits: number, delay = 0) {
  // Only touch an existing text node's value, never replace React-owned nodes.
  const node = element.firstChild;
  if (prefersReducedMotion() || !node || node.nodeType !== Node.TEXT_NODE) return;
  const finalText = node.nodeValue ?? "";
  const state = { v: 0 };
  const tween = gsap.to(state, {
    v: to, duration: 0.9, delay, ease: "power3.out",
    onUpdate: () => { node.nodeValue = digits ? state.v.toFixed(digits) : String(Math.round(state.v)); },
    onComplete: () => { node.nodeValue = finalText; },
  });
  window.setTimeout(() => { if (tween.progress() < 1) tween.progress(1); node.nodeValue = finalText; }, 2500);
}
