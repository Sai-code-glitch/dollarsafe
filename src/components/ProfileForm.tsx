"use client";

import { useState } from "react";
import { api } from "./api";
import { EMPLOYMENT, GOALS, INCOME_BANDS, US_STATES } from "@/lib/profile";

export interface ProfileValues {
  id?: string;
  displayName: string;
  birthYear: number;
  state: string;
  householdSize: number;
  incomeBand: string;
  employment: string;
  goals: string[];
  riskComfort: string;
  notes: string;
  guardianConsent: boolean;
}

const thisYear = new Date().getFullYear();

export function ProfileForm({ initial, submitLabel, onDone, allowMinor }: { initial?: Partial<ProfileValues>; submitLabel: string; onDone: string; allowMinor: boolean }) {
  const [v, setV] = useState<ProfileValues>({
    displayName: "",
    birthYear: thisYear - 30,
    state: "CA",
    householdSize: 1,
    incomeBand: "50k_100k",
    employment: "employed",
    goals: [],
    riskComfort: "medium",
    notes: "",
    guardianConsent: false,
    ...initial,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof ProfileValues>(k: K, val: ProfileValues[K]) => setV((p) => ({ ...p, [k]: val }));
  const isMinor = thisYear - v.birthYear < 18;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { id, ...body } = v;
    try {
      await api(id ? `/api/profiles/${id}` : "/api/profiles", { method: id ? "PUT" : "POST", body });
      window.location.href = onDone;
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">First name or nickname</label>
          <input id="name" className="input" required maxLength={40} value={v.displayName} onChange={(e) => set("displayName", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="birthYear">Birth year</label>
          <input
            id="birthYear"
            className="input"
            type="number"
            required
            min={thisYear - 110}
            max={thisYear - (allowMinor ? 13 : 18)}
            value={v.birthYear}
            onChange={(e) => set("birthYear", Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label" htmlFor="state">State</label>
          <select id="state" className="input" value={v.state} onChange={(e) => set("state", e.target.value)}>
            {US_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="household">People in household</label>
          <input id="household" className="input" type="number" min={1} max={15} value={v.householdSize} onChange={(e) => set("householdSize", Number(e.target.value))} />
        </div>
        <div>
          <label className="label" htmlFor="income">Yearly household income</label>
          <select id="income" className="input" value={v.incomeBand} onChange={(e) => set("incomeBand", e.target.value)}>
            {Object.entries(INCOME_BANDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="employment">Work</label>
          <select id="employment" className="input" value={v.employment} onChange={(e) => set("employment", e.target.value)}>
            {Object.entries(EMPLOYMENT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="label">Goals (pick any)</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(GOALS).map(([k, l]) => {
            const on = v.goals.includes(k);
            return (
              <button
                type="button"
                key={k}
                aria-pressed={on}
                onClick={() => set("goals", on ? v.goals.filter((g) => g !== k) : [...v.goals, k])}
                className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-300 bg-white text-slate-700"}`}
              >
                {l}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">How do you feel about investments going up and down?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["low", "I'd rather play it safe"],
            ["medium", "Some ups and downs are OK"],
            ["high", "I can ride out big swings"],
          ].map(([k, l]) => (
            <label key={k} className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${v.riskComfort === k ? "border-brand-600 bg-brand-50" : "border-slate-300"}`}>
              <input type="radio" className="sr-only" name="risk" checked={v.riskComfort === k} onChange={() => set("riskComfort", k)} />
              {l}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="notes">Anything else Dollarsafe should know? (optional)</label>
        <textarea
          id="notes"
          className="input min-h-24"
          maxLength={1000}
          placeholder="e.g. Paid every two weeks, renting, saving for a wedding next year. Please don't include account numbers."
          value={v.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {isMinor && (
        <label className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <input type="checkbox" checked={v.guardianConsent} onChange={(e) => set("guardianConsent", e.target.checked)} />
          <span>I am this teen&apos;s parent or legal guardian and I consent to them using Dollarsafe under my account.</span>
        </label>
      )}

      {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : submitLabel}</button>
    </form>
  );
}
