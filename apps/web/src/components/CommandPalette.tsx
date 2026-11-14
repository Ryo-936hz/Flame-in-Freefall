import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { KIND_LABEL, KIND_ORDER, searchItems } from "../lib/search";
import type { SearchItem } from "../lib/search";
import { Icon } from "./icons";
import type { IconName } from "./icons";

const KIND_ICON: Record<SearchItem["kind"], IconName> = { section: "arrow", study: "catalog", trial: "report" };

/**
 * Header search: a trigger that looks like a field, and a modal list opened with
 * a click or Ctrl/Cmd + K. Arrow keys move, Enter opens, Escape closes.
 */
export default function CommandPalette({ items, enabled, onSelect }: {
  items: SearchItem[];
  /** Only the visible dashboard listens for the shortcut. */
  enabled: boolean;
  onSelect: (item: SearchItem) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const uid = useId();
  const results = useMemo(() => searchItems(items, query), [items, query]);
  const optionId = (index: number) => `${uid}-opt-${index}`;

  const open = () => {
    if (!dialog.current || dialog.current.open) return;
    setQuery(""); setActive(0);
    dialog.current.showModal();
    input.current?.focus();
  };
  const close = () => dialog.current?.close();
  const choose = (item: SearchItem | undefined) => {
    if (!item) return;
    close();
    onSelect(item);
  };

  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialog.current?.open) close(); else open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);

  useEffect(() => { setActive(0); }, [query]);
  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
  }, [active, results]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!results.length) return;
      setActive((index) => (index + (event.key === "ArrowDown" ? 1 : results.length - 1)) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[active]);
    }
  };

  let index = -1;
  return <>
    <button type="button" className="search-trigger" onClick={open} aria-haspopup="dialog" aria-keyshortcuts="Control+K">
      <Icon name="investigate" />
      <span className="search-placeholder">Search studies, trials and sections</span>
      <kbd>Ctrl K</kbd>
    </button>

    <dialog ref={dialog} className="palette" aria-label="Search"
      onClick={(event) => { if (event.target === dialog.current) close(); }}>
      <div className="palette-field">
        <Icon name="investigate" />
        <input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onKeyDown}
          placeholder="Search studies, trials and sections" aria-label="Search studies, trials and sections"
          role="combobox" aria-expanded="true" aria-controls={`${uid}-list`} aria-autocomplete="list"
          aria-activedescendant={results.length ? optionId(active) : undefined} autoComplete="off" spellCheck={false} />
        <kbd>Esc</kbd>
      </div>
      <div className="palette-list" id={`${uid}-list`} role="listbox" aria-label="Results">
        {!results.length && <p className="palette-empty">No section, study or trial matches “{query.trim()}”.</p>}
        {KIND_ORDER.map((kind) => {
          const group = results.filter((item) => item.kind === kind);
          if (!group.length) return null;
          return <div key={kind} role="group" aria-labelledby={`${uid}-${kind}`}>
            <p className="palette-group cap" id={`${uid}-${kind}`}>{KIND_LABEL[kind]}</p>
            {group.map((item) => {
              index += 1;
              const position = index;
              return <div key={`${item.kind}:${item.id}`} id={optionId(position)} role="option" aria-selected={position === active}
                className="palette-item" onMouseMove={() => setActive(position)} onClick={() => choose(item)}>
                <span className="palette-icon"><Icon name={item.kind === "section" ? (item.id as IconName) : KIND_ICON[item.kind]} /></span>
                <span className="palette-text"><b>{item.title}</b><small>{item.detail}</small></span>
              </div>;
            })}
          </div>;
        })}
      </div>
      <p className="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span>Matches names only; it does not answer questions.</span></p>
    </dialog>
  </>;
}
