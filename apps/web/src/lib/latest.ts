/**
 * Guards against late responses: only the most recently started request may
 * update state, so an older query never overwrites the current selection.
 */
export function createLatest() {
  let current = 0;
  return {
    begin(): number { current += 1; return current; },
    isCurrent(token: number): boolean { return token === current; },
    cancel(): void { current += 1; },
  };
}

export type Latest = ReturnType<typeof createLatest>;
