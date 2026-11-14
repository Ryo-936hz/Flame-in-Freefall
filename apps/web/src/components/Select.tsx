import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { gsap, prefersReducedMotion } from "../lib/motion";

export interface SelectOption { value: string; label: string; hint?: string }

const LIST_MAX = 280;

/**
 * A solid dropdown list that replaces native selects and datalist inputs.
 * The trigger is a combobox button; the list opens in a portal so scrolling
 * columns never clip it, and it animates in and out with GSAP.
 * Keyboard: Enter/Space/↓ open, ↑↓ Home End move, letters jump, Enter picks, Esc closes.
 */
export default function Select({ id, value, options, onChange, placeholder = "Choose…", disabled, ariaLabel, invalid, describedBy, className = "" }: {
  id?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Only when no <label> points at the trigger. */
  ariaLabel?: string;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}) {
  const uid = useId();
  const listId = `${uid}-list`;
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<{ left: number; top: number; width: number; above: boolean }>({ left: 0, top: 0, width: 0, above: false });
  const typed = useRef({ text: "", timer: 0 });
  const selectedIndex = options.findIndex((option) => option.value === value);
  const current = options[selectedIndex];

  const position = useCallback(() => {
    const box = trigger.current?.getBoundingClientRect();
    if (!box) return;
    const height = Math.min(LIST_MAX, options.length * 36 + 10);
    const below = window.innerHeight - box.bottom;
    const above = below < height + 12 && box.top > below;
    setPlace({ left: box.left, width: Math.max(box.width, 180), above, top: above ? box.top - 6 : box.bottom + 6 });
  }, [options.length]);

  const show = () => {
    if (disabled || open) return;
    position();
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setClosing(false);
    setOpen(true);
  };

  const hide = useCallback((refocus = true) => {
    if (!open || closing) return;
    const done = () => { setOpen(false); setClosing(false); };
    if (refocus) trigger.current?.focus();
    if (!list.current || prefersReducedMotion() || document.hidden) { done(); return; }
    setClosing(true);
    const tween = gsap.to(list.current, { opacity: 0, y: place.above ? 6 : -6, scale: 0.98, duration: 0.14, ease: "power2.in", onComplete: done });
    window.setTimeout(() => { if (tween.progress() < 1) tween.progress(1); }, 260);
  }, [open, closing, place.above]);

  const pick = (index: number) => {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    hide();
  };

  // Opening: the panel unfolds from the trigger and its options cascade in.
  useLayoutEffect(() => {
    if (!open || closing || !list.current || prefersReducedMotion()) return;
    const tl = gsap.timeline();
    tl.fromTo(list.current, { opacity: 0, y: place.above ? 8 : -8, scaleY: 0.92, transformOrigin: place.above ? "50% 100%" : "50% 0%" },
      { opacity: 1, y: 0, scaleY: 1, duration: 0.26, ease: "power3.out" })
      .fromTo(list.current.querySelectorAll("li"), { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.2, stagger: 0.018, ease: "power2.out" }, 0.05);
    const timer = window.setTimeout(() => tl.progress(1), 600);
    return () => { window.clearTimeout(timer); tl.progress(1).kill(); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // The chevron turns with the open state.
  useEffect(() => {
    const chevron = trigger.current?.querySelector(".dd-chevron");
    if (!chevron) return;
    if (prefersReducedMotion()) { gsap.set(chevron, { rotate: open && !closing ? 180 : 0 }); return; }
    gsap.to(chevron, { rotate: open && !closing ? 180 : 0, duration: 0.3, ease: "power3.out" });
  }, [open, closing]);

  // Clicks outside close it; the list follows its trigger while columns scroll.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !list.current?.contains(target)) hide(false);
    };
    const onMove = () => position();
    document.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, hide, position]);

  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) { event.preventDefault(); show(); }
      return;
    }
    switch (event.key) {
      case "ArrowDown": event.preventDefault(); setActive((i) => Math.min(last, i + 1)); return;
      case "ArrowUp": event.preventDefault(); setActive((i) => Math.max(0, i - 1)); return;
      case "Home": event.preventDefault(); setActive(0); return;
      case "End": event.preventDefault(); setActive(last); return;
      case "Enter": case " ": event.preventDefault(); pick(active); return;
      case "Escape": event.preventDefault(); hide(); return;
      case "Tab": hide(false); return;
    }
    if (event.key.length === 1 && /\S/.test(event.key)) {
      window.clearTimeout(typed.current.timer);
      typed.current.text += event.key.toLowerCase();
      typed.current.timer = window.setTimeout(() => { typed.current.text = ""; }, 500);
      const match = options.findIndex((option) => option.label.toLowerCase().startsWith(typed.current.text));
      if (match >= 0) setActive(match);
    }
  };

  return <div className={`dd ${className}`} data-open={open && !closing ? "true" : undefined}>
    <button ref={trigger} id={id} type="button" className="dd-trigger" disabled={disabled}
      role="combobox" aria-haspopup="listbox" aria-expanded={open && !closing} aria-controls={open ? listId : undefined}
      aria-activedescendant={open ? `${uid}-opt-${active}` : undefined}
      aria-label={ariaLabel} aria-invalid={invalid || undefined} aria-describedby={describedBy}
      onClick={() => (open ? hide() : show())} onKeyDown={onKeyDown}>
      <span className={`dd-value${current ? "" : " dd-placeholder"}`}>{current?.label ?? (value || placeholder)}</span>
      <svg className="dd-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    {open && createPortal(
      <ul ref={list} id={listId} className="dd-list" role="listbox" aria-label={ariaLabel}
        style={{ left: place.left, width: place.width, maxHeight: LIST_MAX, ...(place.above ? { bottom: window.innerHeight - place.top } : { top: place.top }) }}>
        {options.length === 0 && <li className="dd-empty" role="presentation">No options</li>}
        {options.map((option, index) => <li key={option.value} id={`${uid}-opt-${index}`} data-index={index} role="option"
          aria-selected={option.value === value} data-active={index === active || undefined}
          onPointerMove={() => setActive(index)} onPointerDown={(event) => event.preventDefault()} onClick={() => pick(index)}>
          <span className="dd-check" aria-hidden="true">{option.value === value && <svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10" /></svg>}</span>
          <span className="dd-label">{option.label}</span>
          {option.hint && <small className="dd-hint">{option.hint}</small>}
        </li>)}
      </ul>,
      document.body,
    )}
  </div>;
}
