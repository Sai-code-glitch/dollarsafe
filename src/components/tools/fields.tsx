"use client";

export const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/** Parses a form value; blank or invalid becomes 0 so results update as the visitor types. */
export const num = (v: string) => {
  const n = Number(v.replace(/[$,%\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = "any",
  min = 0,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  step?: string;
  min?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className="relative block">
        {prefix && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">{prefix}</span>}
        <input
          className={`input ${prefix ? "pl-7" : ""} ${suffix ? "pr-14" : ""}`}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">{suffix}</span>}
      </span>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${emphasis ? "bg-brand-600 text-white" : "bg-slate-100"}`}>
      <div className={`text-xs font-medium ${emphasis ? "text-brand-50" : "text-slate-600"}`}>{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

export function ResultError({ message }: { message: string }) {
  return <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status">{message}</p>;
}

export const monthsLabel = (m: number) => {
  const y = Math.floor(m / 12);
  const r = m % 12;
  return [y && `${y} yr`, r && `${r} mo`].filter(Boolean).join(" ") || "0 mo";
};
