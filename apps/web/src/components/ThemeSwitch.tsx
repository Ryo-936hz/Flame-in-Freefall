import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "../lib/motion";

const SUN = <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
const MOON = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>;

/** Labelled day/night switch; the knob slides with GSAP and the icon spins in. */
export default function ThemeSwitch({ theme, onToggle }: { theme: "dark" | "light"; onToggle: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const first = useRef(true);
  const dark = theme === "dark";
  useGSAP(() => {
    const knob = ref.current?.querySelector(".ts-knob");
    const track = ref.current?.querySelector<HTMLElement>(".ts-track");
    if (!knob || !track) return;
    const x = dark ? 0 : track.offsetWidth - (knob as HTMLElement).offsetWidth - 4;
    if (first.current || prefersReducedMotion()) { gsap.set(knob, { x }); first.current = false; return; }
    const slide = gsap.to(knob, { x, duration: 0.55, ease: "back.out(1.6)" });
    window.setTimeout(() => slide.progress(1), 900);
    gsap.fromTo(ref.current!.querySelector(".ts-knob svg"), { rotate: -120, scale: 0.4 }, { rotate: 0, scale: 1, duration: 0.6, ease: "back.out(2)" });
  }, { dependencies: [dark], scope: ref });

  return <button ref={ref} type="button" role="switch" aria-checked={dark} className="theme-switch" onClick={onToggle}
    aria-label="Night mode" title={dark ? "Switch to day mode" : "Switch to night mode"}>
    <span className="ts-track" aria-hidden="true">
      <span className="ts-icon ts-moon">{MOON}</span>
      <span className="ts-icon ts-sun">{SUN}</span>
      <span className="ts-knob">{dark ? MOON : SUN}</span>
    </span>
  </button>;
}
