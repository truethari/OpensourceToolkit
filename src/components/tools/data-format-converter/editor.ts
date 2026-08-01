/**
 * Textarea editing helpers that give a plain <textarea> code-editor ergonomics.
 *
 * Each function is pure: it takes the current text plus a selection and returns
 * the next text and selection. The DOM is only touched by `applyEdit`, which
 * keeps this logic testable without a browser.
 */

export interface EditorState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

/** Start index of the line containing `pos`. */
function lineStart(value: string, pos: number): number {
  return value.lastIndexOf("\n", pos - 1) + 1;
}

/**
 * Indent or outdent the current selection.
 *
 * With no selection, Tab inserts spaces up to the next tab stop so the caret
 * lands on a column boundary rather than always jumping a fixed width.
 * With a selection spanning any newline, every touched line shifts together.
 */
export function indentSelection(
  state: EditorState,
  indent: number,
  outdent: boolean,
): EditorState {
  const { value, selectionStart, selectionEnd } = state;
  const unit = " ".repeat(indent);
  const spansLines = value.slice(selectionStart, selectionEnd).includes("\n");

  // Single-caret indent: pad to the next tab stop.
  if (selectionStart === selectionEnd && !outdent) {
    const col = selectionStart - lineStart(value, selectionStart);
    const width = indent - (col % indent) || indent;
    const pad = " ".repeat(width);
    return {
      value: value.slice(0, selectionStart) + pad + value.slice(selectionEnd),
      selectionStart: selectionStart + width,
      selectionEnd: selectionStart + width,
    };
  }

  // Single-caret outdent: remove up to `indent` spaces before the caret.
  if (selectionStart === selectionEnd && outdent && !spansLines) {
    const start = lineStart(value, selectionStart);
    const before = value.slice(start, selectionStart);
    const removable = before.length - before.replace(/ {1,}$/, "").length;
    const remove = Math.min(removable, indent);
    if (remove === 0) return state;
    return {
      value:
        value.slice(0, selectionStart - remove) + value.slice(selectionStart),
      selectionStart: selectionStart - remove,
      selectionEnd: selectionStart - remove,
    };
  }

  // Block indent/outdent across every line the selection touches.
  const blockStart = lineStart(value, selectionStart);
  const blockEnd =
    value.indexOf("\n", selectionEnd) === -1
      ? value.length
      : value.indexOf("\n", selectionEnd);

  const block = value.slice(blockStart, blockEnd);
  const lines = block.split("\n");

  let firstDelta = 0;
  let totalDelta = 0;

  const nextLines = lines.map((line, i) => {
    if (outdent) {
      const match = line.match(/^ {1,}/);
      const remove = match ? Math.min(match[0].length, indent) : 0;
      if (i === 0) firstDelta = -remove;
      totalDelta -= remove;
      return line.slice(remove);
    }
    // Don't indent blank lines — it just leaves trailing whitespace.
    if (line.trim() === "") return line;
    if (i === 0) firstDelta = indent;
    totalDelta += indent;
    return unit + line;
  });

  // A selection that started at a line boundary stays anchored there, so the
  // newly added indentation stays inside the selection and repeated Tabs work.
  const startAtLineStart = selectionStart === blockStart;

  return {
    value:
      value.slice(0, blockStart) + nextLines.join("\n") + value.slice(blockEnd),
    selectionStart: startAtLineStart
      ? blockStart
      : Math.max(blockStart, selectionStart + firstDelta),
    selectionEnd: Math.max(blockStart, selectionEnd + totalDelta),
  };
}

/**
 * Insert a newline that preserves the current line's leading whitespace, and
 * adds one extra level after a line that opens a block (`:`, `{`, `[`, `-`).
 */
export function newlineWithIndent(
  state: EditorState,
  indent: number,
): EditorState {
  const { value, selectionStart, selectionEnd } = state;
  const start = lineStart(value, selectionStart);
  const current = value.slice(start, selectionStart);
  const leading = current.match(/^[ \t]*/)?.[0] ?? "";

  // A trailing block opener earns an extra indent level.
  const opensBlock = /(:|\{|\[|-)\s*$/.test(current.trimEnd());
  const next = leading + (opensBlock ? " ".repeat(indent) : "");

  const insert = "\n" + next;
  const caret = selectionStart + insert.length;

  return {
    value: value.slice(0, selectionStart) + insert + value.slice(selectionEnd),
    selectionStart: caret,
    selectionEnd: caret,
  };
}

/**
 * Write an EditorState back to a textarea via the native value setter so React
 * observes the change, then restore the selection.
 *
 * React tracks the previous value on the DOM node; assigning `.value` directly
 * would let React skip the update as a no-op, so the native setter is required.
 */
export function applyEdit(el: HTMLTextAreaElement, next: EditorState): void {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  )?.set;

  if (setter) {
    setter.call(el, next.value);
  } else {
    el.value = next.value;
  }

  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.setSelectionRange(next.selectionStart, next.selectionEnd);
}
