import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import { useEffect, useRef } from "react";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP, ScrollToPlugin);
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

/**
 * Sliding tab indicator. Moves one `.ink` element (a direct child of the
 * container) onto the item marked current (aria-current, aria-selected or
 * data-active). Pass everything that can move the items in `deps`.
 */
export function useInk(container: RefObject<HTMLElement | null>, deps: unknown[], mode: "pill" | "line" = "pill") {
  const placed = useRef(false);
  useEffect(() => {
    const box = container.current;
    const ink = box?.querySelector<HTMLElement>(":scope > .ink");
    if (!box || !ink) return;
    const place = (animate: boolean) => {
      const target = box.querySelector<HTMLElement>('[aria-current="page"], [aria-selected="true"], [data-active="true"]');
      if (!target || target.offsetParent === null) { gsap.set(ink, { opacity: 0 }); placed.current = false; return; }
      const props = mode === "line"
        ? { x: target.offsetLeft, y: target.offsetTop + target.offsetHeight - 2, width: target.offsetWidth, height: 2, opacity: 1 }
        : { x: target.offsetLeft, y: target.offsetTop, width: target.offsetWidth, height: target.offsetHeight, opacity: 1 };
      // A layout change mid-slide must win over the slide's stale end values.
      if (!animate || !placed.current || prefersReducedMotion()) { gsap.killTweensOf(ink); gsap.set(ink, props); }
      else gsap.to(ink, { ...props, duration: 0.5, ease: "expo.out", overwrite: true });
      placed.current = true;
    };
    place(true);
    const ro = new ResizeObserver(() => place(false));
    ro.observe(box);
    return () => ro.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Letter roll on hover and keyboard focus, as in the original navigation:
 * each letter slides up and out while its copy rises from below (RollText markup).
 * Delegated from one container, so links rendered later are covered too.
 */
export function useRollHover(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    const roll = (host: Element, up: boolean) => {
      const chars = host.querySelectorAll(".roll-c");
      if (!chars.length) return;
      if (prefersReducedMotion()) { gsap.set(chars, { yPercent: 0 }); return; }
      gsap.to(chars, { yPercent: up ? -100 : 0, duration: 0.55, ease: "power3.inOut", stagger: { each: 0.016, from: "start" }, overwrite: true });
    };
    const hostOf = (node: EventTarget | null) => (node instanceof Element ? node.closest(".roll-host") : null);
    const enter = (event: Event) => {
      const host = hostOf(event.target);
      const from = (event as PointerEvent | FocusEvent).relatedTarget as Node | null;
      if (host && root.contains(host) && !(from && host.contains(from))) roll(host, true);
    };
    const leave = (event: Event) => {
      const host = hostOf(event.target);
      const to = (event as PointerEvent | FocusEvent).relatedTarget as Node | null;
      if (host && !(to && host.contains(to))) roll(host, false);
    };
    root.addEventListener("pointerover", enter);
    root.addEventListener("pointerout", leave);
    root.addEventListener("focusin", enter);
    root.addEventListener("focusout", leave);
    return () => {
      root.removeEventListener("pointerover", enter);
      root.removeEventListener("pointerout", leave);
      root.removeEventListener("focusin", enter);
      root.removeEventListener("focusout", leave);
    };
  }, [scope]);
}
