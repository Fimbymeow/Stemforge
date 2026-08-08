import type { MathInputCapabilities } from "@/lib/questions/math-input-capabilities";

export type MathKeyboardInsertControl = {
  id: string;
  label: string;
  accessibleLabel: string;
  latex: string;
};

export function deriveElementaryMathKeyboardControls(capabilities: MathInputCapabilities): MathKeyboardInsertControl[] {
  const controls: MathKeyboardInsertControl[] = [];
  if (capabilities.allowedFunctions.includes("sin")) controls.push(control("sin", "sin", "Insert sine", "\\sin\\left(#0\\right)"));
  if (capabilities.allowedFunctions.includes("cos")) controls.push(control("cos", "cos", "Insert cosine", "\\cos\\left(#0\\right)"));
  if (capabilities.allowedFunctions.includes("tan")) controls.push(control("tan", "tan", "Insert tangent", "\\tan\\left(#0\\right)"));
  if (capabilities.allowedConstants.includes("pi")) controls.push(control("pi", "π", "Insert pi", "\\pi"));
  if (capabilities.allowedConstants.includes("e")) controls.push(control("e", "e", "Insert e", "e"));
  if (capabilities.allowedFunctions.includes("ln")) controls.push(control("ln", "ln", "Insert natural logarithm", "\\ln\\left(#0\\right)"));
  if (capabilities.allowedFunctions.includes("log")) {
    const latex = capabilities.allowedLogBases.length ? "\\log_{#0}\\left(#?\\right)" : "\\log\\left(#0\\right)";
    controls.push(control("log", "log", "Insert logarithm", latex));
  }
  return controls;
}

function control(id: string, label: string, accessibleLabel: string, latex: string): MathKeyboardInsertControl {
  return { id, label, accessibleLabel, latex };
}
