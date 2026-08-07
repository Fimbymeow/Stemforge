export type TextSelectionEdit = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

export function insertAtSelection(value: string, selectionStart: number, selectionEnd: number, text: string): TextSelectionEdit {
  const selection = normalizeSelection(value, selectionStart, selectionEnd);
  const caret = selection.start + text.length;
  return {
    value: `${value.slice(0, selection.start)}${text}${value.slice(selection.end)}`,
    selectionStart: caret,
    selectionEnd: caret,
  };
}

export function wrapOrInsertOpeningBracket(value: string, selectionStart: number, selectionEnd: number): TextSelectionEdit {
  const selection = normalizeSelection(value, selectionStart, selectionEnd);
  if (selection.start === selection.end) return insertAtSelection(value, selection.start, selection.end, "(");
  const selected = value.slice(selection.start, selection.end);
  return {
    value: `${value.slice(0, selection.start)}(${selected})${value.slice(selection.end)}`,
    selectionStart: selection.start + 1,
    selectionEnd: selection.end + 1,
  };
}

export function deleteAtSelection(value: string, selectionStart: number, selectionEnd: number): TextSelectionEdit {
  const selection = normalizeSelection(value, selectionStart, selectionEnd);
  if (selection.start !== selection.end) {
    return {
      value: `${value.slice(0, selection.start)}${value.slice(selection.end)}`,
      selectionStart: selection.start,
      selectionEnd: selection.start,
    };
  }
  if (selection.start === 0) return unchanged(value, 0);
  const caret = selection.start - 1;
  return {
    value: `${value.slice(0, caret)}${value.slice(selection.end)}`,
    selectionStart: caret,
    selectionEnd: caret,
  };
}

export function moveCaret(value: string, selectionStart: number, selectionEnd: number, direction: "left" | "right"): TextSelectionEdit {
  const selection = normalizeSelection(value, selectionStart, selectionEnd);
  const caret = direction === "left"
    ? selection.start === selection.end ? Math.max(0, selection.start - 1) : selection.start
    : selection.start === selection.end ? Math.min(value.length, selection.end + 1) : selection.end;
  return unchanged(value, caret);
}

export function clearInput(): TextSelectionEdit {
  return unchanged("", 0);
}

function normalizeSelection(value: string, selectionStart: number, selectionEnd: number) {
  const start = clamp(Math.min(selectionStart, selectionEnd), 0, value.length);
  const end = clamp(Math.max(selectionStart, selectionEnd), 0, value.length);
  return { start, end };
}

function unchanged(value: string, caret: number): TextSelectionEdit {
  return { value, selectionStart: caret, selectionEnd: caret };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : maximum));
}
