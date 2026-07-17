"use client";

import type { NatureTableConfig, NatureTableExpectedCell, NatureTableNature, NatureTableSign, NatureTableTrend } from "@/lib/maths/expression-types";

type NatureTableProps = {
  config: NatureTableConfig;
  value: Record<string, NatureTableExpectedCell>;
  disabled?: boolean;
  onChange: (value: Record<string, NatureTableExpectedCell>) => void;
};

const signOptions = ["positive", "zero", "negative"] as const;
const trendOptions = ["increasing", "decreasing", "stationary"] as const;
const natureOptions = ["maximum", "minimum", "stationary_inflection"] as const;

export function NatureTable({ config, value, disabled = false, onChange }: NatureTableProps) {
  const cellIds = Object.keys(config.expectedAnswers);
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white p-4" data-testid="nature-table">
      <h3 className="m-0 text-base font-extrabold">Nature table</h3>
      <p className="mt-1 text-sm text-muted">Use structured controls. No precise drawing is required.</p>
      <table className="mt-4 min-w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th scope="col" className="border-b border-line p-2 text-left">Cell</th>
            <th scope="col" className="border-b border-line p-2 text-left">Answer</th>
          </tr>
        </thead>
        <tbody>
          {cellIds.map((cellId) => {
            const expected = config.expectedAnswers[cellId];
            return (
              <tr key={cellId}>
                <th scope="row" className="border-b border-line p-2 text-left font-bold">{cellId.replace(/[:-]/g, " ")}</th>
                <td className="border-b border-line p-2">
                  <CellInput
                    cellId={cellId}
                    expectedType={expected.type}
                    value={value[cellId]}
                    disabled={disabled}
                    onChange={(cell) => onChange({ ...value, [cellId]: cell })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CellInput({
  cellId,
  expectedType,
  value,
  disabled,
  onChange,
}: {
  cellId: string;
  expectedType: NatureTableExpectedCell["type"];
  value?: NatureTableExpectedCell;
  disabled: boolean;
  onChange: (value: NatureTableExpectedCell) => void;
}) {
  if (expectedType === "sign") {
    return <Select label={cellId} options={signOptions} disabled={disabled} value={value?.type === "sign" ? value.value : ""} onChange={(next) => onChange({ type: "sign", value: next as NatureTableSign })} />;
  }
  if (expectedType === "trend") {
    return <Select label={cellId} options={trendOptions} disabled={disabled} value={value?.type === "trend" ? value.value : ""} onChange={(next) => onChange({ type: "trend", value: next as NatureTableTrend })} />;
  }
  if (expectedType === "nature") {
    return <Select label={cellId} options={natureOptions} disabled={disabled} value={value?.type === "nature" ? value.value : ""} onChange={(next) => onChange({ type: "nature", value: next as NatureTableNature })} />;
  }
  return (
    <div className="flex flex-wrap gap-2">
      <NumberField label={`${cellId} x`} disabled={disabled} value={value?.type === "coordinate" ? value.x.numerator / (value.x.denominator ?? 1) : ""} onChange={(x) => onChange({ type: "coordinate", x: toExact(x), y: value?.type === "coordinate" ? value.y : toExact(0) })} />
      <NumberField label={`${cellId} y`} disabled={disabled} value={value?.type === "coordinate" ? value.y.numerator / (value.y.denominator ?? 1) : ""} onChange={(y) => onChange({ type: "coordinate", x: value?.type === "coordinate" ? value.x : toExact(0), y: toExact(y) })} />
    </div>
  );
}

function Select({ label, options, value, disabled, onChange }: { label: string; options: readonly string[]; value: string; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <select aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="min-h-10 rounded-lg border border-line bg-white px-3 font-semibold">
      <option value="">Choose...</option>
      {options.map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
    </select>
  );
}

function NumberField({ label, value, disabled, onChange }: { label: string; value: number | ""; disabled: boolean; onChange: (value: number) => void }) {
  return <input aria-label={label} type="number" step="0.25" value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} className="min-h-10 w-24 rounded-lg border border-line bg-white px-3" />;
}

function toExact(value: number) {
  return { numerator: Math.round(value * 1_000_000), denominator: 1_000_000 };
}
