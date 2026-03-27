'use client';

import { type ReactNode, useMemo, useState } from 'react';

type Goal =
  | 'fall_asleep_faster'
  | 'stay_asleep'
  | 'wind_down'
  | 'travel_shift'
  | 'recovery'
  | '';

type Issue =
  | 'racing_mind'
  | 'multiple_awakenings'
  | 'late_caffeine'
  | 'schedule_shift'
  | 'jet_lag';

type Flag =
  | 'pregnancy'
  | 'kidney'
  | 'meds'
  | 'autoimmune'
  | 'mood';

type FormState = {
  goal: Goal;
  bedtime: string;
  wakeTime: string;
  caffeineCutoff: string;
  screenExposure: 'low' | 'moderate' | 'high';
  issues: Issue[];
  flags: Flag[];
  email: string;
};

type SupplementKey =
  | 'magnesium'
  | 'glycine'
  | 'melatonin'
  | 'theanine'
  | 'apigenin';

type Supplement = {
  name: string;
  goals: Goal[];
  timing: string;
  cautionFlags: Flag[];
};

const GOALS: { value: Goal; label: string; short: string }[] = [
  { value: 'fall_asleep_faster', label: 'Fall asleep faster', short: 'Sleep Onset' },
  { value: 'stay_asleep', label: 'Stay asleep longer', short: 'Sleep Continuity' },
  { value: 'wind_down', label: 'Wind down before bed', short: 'Evening Calm' },
  { value: 'travel_shift', label: 'Travel / shift-work support', short: 'Timing Reset' },
  { value: 'recovery', label: 'Recovery / next-day readiness', short: 'Recovery' },
];

const ISSUES: { value: Issue; label: string }[] = [
  { value: 'racing_mind', label: 'Racing mind at night' },
  { value: 'multiple_awakenings', label: 'Multiple awakenings' },
  { value: 'late_caffeine', label: 'Late caffeine possible' },
  { value: 'schedule_shift', label: 'Schedule changes often' },
  { value: 'jet_lag', label: 'Jet lag / travel' },
];

const FLAGS: { value: Flag; label: string }[] = [
  { value: 'pregnancy', label: 'Pregnant / trying to conceive / breastfeeding' },
  { value: 'kidney', label: 'Kidney condition / mineral restriction' },
  { value: 'meds', label: 'Taking prescription medication' },
  { value: 'autoimmune', label: 'Autoimmune condition / immune treatment' },
  { value: 'mood', label: 'Mood / psychiatric / neurological condition' },
];

const SUPPLEMENTS: Record<SupplementKey, Supplement> = {
  magnesium: {
    name: 'Magnesium glycinate',
    goals: ['stay_asleep', 'wind_down', 'recovery', 'fall_asleep_faster'],
    timing: 'Usually explored 1 to 2 hours before bed.',
    cautionFlags: ['kidney', 'meds'],
  },
  glycine: {
    name: 'Glycine',
    goals: ['stay_asleep', 'recovery', 'wind_down'],
    timing: 'Usually explored 30 to 60 minutes before bed.',
    cautionFlags: ['meds'],
  },
  melatonin: {
    name: 'Melatonin',
    goals: ['fall_asleep_faster', 'travel_shift'],
    timing: 'Usually explored 30 to 120 minutes before intended sleep, depending on the use case.',
    cautionFlags: ['pregnancy', 'meds', 'autoimmune', 'mood'],
  },
  theanine: {
    name: 'L-theanine',
    goals: ['wind_down', 'fall_asleep_faster', 'recovery', 'travel_shift'],
    timing: 'Usually explored 30 to 60 minutes before bed.',
    cautionFlags: ['meds'],
  },
  apigenin: {
    name: 'Apigenin',
    goals: ['wind_down', 'stay_asleep'],
    timing: 'Usually explored 30 to 60 minutes before bed.',
    cautionFlags: ['pregnancy', 'meds'],
  },
};

const INITIAL_FORM: FormState = {
  goal: '',
  bedtime: '',
  wakeTime: '',
  caffeineCutoff: '',
  screenExposure: 'high',
  issues: [],
  flags: [],
  email: '',
};

const STEP_LABELS = ['Goal', 'Timing', 'Patterns', 'Safety', 'Results'] as const;

function toggleValue<T>(items: T[], value: T): T[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function getScore(key: SupplementKey, form: FormState): number {
  const supplement = SUPPLEMENTS[key];
  let score = 0;

  if (supplement.goals.includes(form.goal)) score += 30;

  if (form.goal === 'fall_asleep_faster' && key === 'melatonin') score += 20;
  if (form.goal === 'fall_asleep_faster' && key === 'theanine') score += 10;

  if (form.goal === 'stay_asleep' && key === 'magnesium') score += 20;
  if (form.goal === 'stay_asleep' && key === 'glycine') score += 15;
  if (form.goal === 'stay_asleep' && key === 'apigenin') score += 8;

  if (form.goal === 'wind_down' && key === 'theanine') score += 18;
  if (form.goal === 'wind_down' && key === 'magnesium') score += 15;

  if (form.goal === 'travel_shift' && key === 'melatonin') score += 25;
  if (form.goal === 'travel_shift' && key === 'theanine') score += 5;

  if (form.goal === 'recovery' && key === 'magnesium') score += 15;
  if (form.goal === 'recovery' && key === 'glycine') score += 12;

  if (form.issues.includes('racing_mind') && key === 'theanine') score += 18;
  if (form.issues.includes('racing_mind') && key === 'magnesium') score += 8;

  if (form.issues.includes('multiple_awakenings') && key === 'magnesium') score += 12;
  if (form.issues.includes('multiple_awakenings') && key === 'glycine') score += 12;

  if ((form.issues.includes('schedule_shift') || form.issues.includes('jet_lag')) && key === 'melatonin') score += 18;

  if (form.issues.includes('late_caffeine') && key === 'theanine') score += 10;
  if (form.issues.includes('late_caffeine') && key === 'magnesium') score += 5;

  if (form.screenExposure === 'high' && key === 'theanine') score += 8;
  if (form.screenExposure === 'high' && key === 'magnesium') score += 4;

  const caution = supplement.cautionFlags.some((flag) => form.flags.includes(flag));
  if (caution) score -= 40;

  return score;
}

function getWhy(key: SupplementKey, form: FormState): string {
  if (key === 'melatonin' && form.goal === 'travel_shift') {
    return 'Your answers point more toward schedule adjustment and timing than a broader evening stack.';
  }

  if (key === 'theanine' && form.issues.includes('racing_mind')) {
    return 'Your answers suggest pre-sleep mental overactivation may be part of the problem.';
  }

  if (key === 'magnesium' && form.issues.includes('multiple_awakenings')) {
    return 'Your plan should lean toward steadier evening support rather than only sleep-onset support.';
  }

  if (key === 'glycine') {
    return 'A simpler evening option may fit your pattern better than a more complex stack.';
  }

  return 'This option matched your goal and routine better than the other choices.';
}

function getLifestyleFixes(form: FormState): string[] {
  const fixes: string[] = [];

  if (form.caffeineCutoff > '13:00') fixes.push('Move your last caffeine earlier in the day.');
  if (form.screenExposure === 'high') fixes.push('Reduce bright-screen exposure during the final hour before bed.');
  if (form.issues.includes('racing_mind')) fixes.push('Add a fixed 10-minute wind-down block before trying to sleep.');
  if (form.issues.includes('schedule_shift')) fixes.push('Keep one anchor sleep window as consistent as possible.');
  if (form.issues.includes('jet_lag')) fixes.push('Pair any timing strategy with light exposure planning for the new time zone.');

  if (!fixes.length) fixes.push('Keep your evening routine simple and consistent.');

  return fixes.slice(0, 3);
}

function buildResults(form: FormState) {
  const ranked = (Object.keys(SUPPLEMENTS) as SupplementKey[])
    .map((key) => {
      const supplement = SUPPLEMENTS[key];
      const caution = supplement.cautionFlags.some((flag) => form.flags.includes(flag));

      return {
        key,
        name: supplement.name,
        timing: supplement.timing,
        why: getWhy(key, form),
        caution,
        score: getScore(key, form),
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    top: ranked.filter((item) => !item.caution).slice(0, 3),
    caution: ranked.filter((item) => item.caution),
    fixes: getLifestyleFixes(form),
  };
}

function ShellCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[28px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(18,39,66,0.88),rgba(12,28,50,0.82))] shadow-[0_20px_80px_rgba(2,12,27,0.45)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

function StepItem({
  index,
  label,
  active,
  done,
  isLast,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
            active
              ? 'border-cyan-300 bg-cyan-400/15 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.22)]'
              : done
                ? 'border-emerald-300/50 bg-emerald-400/10 text-emerald-200'
                : 'border-white/10 bg-white/5 text-slate-400'
          }`}
        >
          {done ? '✓' : index}
        </div>
        {!isLast && (
          <div
            className={`ml-3 h-[2px] flex-1 rounded-full ${
              done ? 'bg-[linear-gradient(90deg,#22d3ee,#2dd4bf)]' : 'bg-white/10'
            }`}
          />
        )}
      </div>
      <div
        className={`mt-3 text-[11px] uppercase tracking-[0.22em] ${
          active || done ? 'text-cyan-300' : 'text-slate-500'
        }`}
      >
        {label}
      </div>
    </div>
  );
}

function ChoiceButton({
  title,
  subtitle,
  selected,
  onClick,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border px-5 py-5 text-left transition duration-200 ${
        selected
          ? 'border-cyan-300 bg-[linear-gradient(135deg,rgba(10,70,110,0.95),rgba(8,27,61,0.95))] shadow-[0_0_0_1px_rgba(103,232,249,0.18),0_18px_40px_rgba(2,12,27,0.35)]'
          : 'border-white/10 bg-[linear-gradient(180deg,rgba(9,19,39,0.95),rgba(6,16,34,0.9))] hover:border-cyan-300/35 hover:bg-[linear-gradient(180deg,rgba(11,27,54,0.96),rgba(7,19,41,0.95))] hover:shadow-[0_10px_30px_rgba(2,12,27,0.28)]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-white">{title}</div>
          <div className="mt-2 text-sm text-slate-300">{subtitle}</div>
        </div>
        <div
          className={`mt-1 h-5 w-5 rounded-full border ${
            selected ? 'border-cyan-200 bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.4)]' : 'border-white/20'
          }`}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_42%)] opacity-90" />
    </button>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:border-cyan-300/30 hover:bg-cyan-400/[0.04]">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-cyan-400" />
      <span className="text-sm text-slate-100">{label}</span>
    </label>
  );
}

export default function Page() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const results = useMemo(() => buildResults(form), [form]);

  const canContinue =
    (step === 1 && form.goal !== '') ||
    (step === 2 && form.bedtime !== '' && form.wakeTime !== '' && form.caffeineCutoff !== '') ||
    step === 3 ||
    step === 4;

  
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071225] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(17,117,166,0.24),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(28,202,201,0.12),transparent_16%),linear-gradient(180deg,#071225_0%,#08162b_54%,#061123_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(125,211,252,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.25)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(13,36,64,0.7),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-8 lg:px-10">
        <header className="mb-10 flex items-center justify-between rounded-[26px] border border-cyan-400/10 bg-slate-950/30 px-4 py-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
              <span className="text-lg text-cyan-200">↯</span>
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">SleepMetric</div>
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Science-backed sleep</div>
            </div>
          </div>

          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-100/85">
            Supplement Engine
          </div>
        </header>

        <section className="mb-10 max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-200">
            Interactive product
          </div>
          <h1 className="max-w-5xl text-4xl font-bold leading-[0.95] tracking-tight text-white md:text-6xl">
            Supplement Timing Wizard
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            A cleaner way to match common sleep-support supplements to the right goal, the right routine, and the right timing window.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <ShellCard className="p-6 md:p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-cyan-300">Protocol builder</div>
                <div className="mt-2 text-2xl font-semibold">Step {step} of 5</div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                Educational use only
              </div>
            </div>

            <div className="mb-8">
              <div className="flex gap-3 md:gap-4">
                {STEP_LABELS.map((label, index) => (
                  <StepItem
                    key={label}
                    index={index + 1}
                    label={label}
                    active={step === index + 1}
                    done={step > index + 1}
                    isLast={index === STEP_LABELS.length - 1}
                  />
                ))}
              </div>
            </div>

            {step === 1 && (
              <div>
                <h2 className="mb-2 text-2xl font-semibold">Choose your main goal</h2>
                <p className="mb-6 text-slate-300">Pick the outcome you want the tool to optimize first.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {GOALS.map((goal) => (
                    <ChoiceButton
                      key={goal.value}
                      title={goal.label}
                      subtitle={goal.short}
                      selected={form.goal === goal.value}
                      onClick={() => setForm({ ...form, goal: goal.value })}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="mb-2 text-2xl font-semibold">Set your timing window</h2>
                <p className="mb-6 text-slate-300">Tap each field and choose a time before moving forward.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block rounded-3xl border border-cyan-400/15 bg-slate-950/35 p-4 shadow-[0_10px_30px_rgba(2,12,27,0.18)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-100">Typical bedtime</span>
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-300">
                        Tap to choose
                      </span>
                    </div>
                    <input
                      type="time"
                      value={form.bedtime}
                      onChange={(e) => setForm({ ...form, bedtime: e.target.value })}
                      className="mt-4 w-full cursor-pointer rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-lg text-white outline-none ring-0 transition focus:border-cyan-300/40"
                    />
                    <div className="mt-2 text-xs text-slate-400">
                      {form.bedtime ? `Selected: ${form.bedtime}` : 'No time selected yet'}
                    </div>
                  </label>

                  <label className="block rounded-3xl border border-cyan-400/15 bg-slate-950/35 p-4 shadow-[0_10px_30px_rgba(2,12,27,0.18)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-100">Typical wake time</span>
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-300">
                        Tap to choose
                      </span>
                    </div>
                    <input
                      type="time"
                      value={form.wakeTime}
                      onChange={(e) => setForm({ ...form, wakeTime: e.target.value })}
                      className="mt-4 w-full cursor-pointer rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-lg text-white outline-none ring-0 transition focus:border-cyan-300/40"
                    />
                    <div className="mt-2 text-xs text-slate-400">
                      {form.wakeTime ? `Selected: ${form.wakeTime}` : 'No time selected yet'}
                    </div>
                  </label>

                  <label className="block rounded-3xl border border-cyan-400/15 bg-slate-950/35 p-4 shadow-[0_10px_30px_rgba(2,12,27,0.18)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-100">Last caffeine time</span>
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-300">
                        Tap to choose
                      </span>
                    </div>
                    <input
                      type="time"
                      value={form.caffeineCutoff}
                      onChange={(e) => setForm({ ...form, caffeineCutoff: e.target.value })}
                      className="mt-4 w-full cursor-pointer rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-lg text-white outline-none ring-0 transition focus:border-cyan-300/40"
                    />
                    <div className="mt-2 text-xs text-slate-400">
                      {form.caffeineCutoff ? `Selected: ${form.caffeineCutoff}` : 'No time selected yet'}
                    </div>
                  </label>

                  <label className="block rounded-3xl border border-cyan-400/15 bg-slate-950/35 p-4 shadow-[0_10px_30px_rgba(2,12,27,0.18)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-100">Evening screen exposure</span>
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-300">
                        Choose one
                      </span>
                    </div>
                    <select
                      value={form.screenExposure}
                      onChange={(e) => setForm({ ...form, screenExposure: e.target.value as FormState['screenExposure'] })}
                      className="mt-4 w-full cursor-pointer rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-lg text-white outline-none ring-0 transition focus:border-cyan-300/40"
                    >
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                    </select>
                    <div className="mt-2 text-xs text-slate-400">Select how much bright-screen exposure you usually get at night.</div>
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="mb-2 text-2xl font-semibold">Select what applies</h2>
                <p className="mb-6 text-slate-300">This sharpens the recommendation logic.</p>
                <div className="space-y-3">
                  {ISSUES.map((issue) => (
                    <ToggleRow
                      key={issue.value}
                      label={issue.label}
                      checked={form.issues.includes(issue.value)}
                      onChange={() => setForm({ ...form, issues: toggleValue(form.issues, issue.value) })}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="mb-2 text-2xl font-semibold">Safety check</h2>
                <p className="mb-6 text-slate-300">Use caution where clinician review makes more sense.</p>
                <div className="space-y-3">
                  {FLAGS.map((flag) => (
                    <ToggleRow
                      key={flag.value}
                      label={flag.label}
                      checked={form.flags.includes(flag.value)}
                      onChange={() => setForm({ ...form, flags: toggleValue(form.flags, flag.value) })}
                    />
                  ))}
                </div>

                <label className="mt-5 block">
                  <span className="mb-2 block text-sm text-slate-300">Email</span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none ring-0 transition focus:border-cyan-300/40"
                  />
                </label>
              </div>
            )}

            {step === 5 && (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#22d3ee,#14b8a6)] text-3xl shadow-[0_20px_50px_rgba(20,184,166,0.25)]">
                    🏆
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.28em] text-cyan-300">Protocol complete</div>
                    <h2 className="mt-2 text-2xl font-semibold">Your supplement timing results</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  {results.top.map((item, index) => (
                    <div
                      key={item.key}
                      className="rounded-[24px] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(8,27,49,0.95),rgba(6,19,35,0.92))] p-5 shadow-[0_12px_40px_rgba(2,12,27,0.28)]"
                    >
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs uppercase tracking-[0.25em] text-cyan-300">Recommendation {index + 1}</div>
                          <h3 className="mt-2 text-xl font-semibold">{item.name}</h3>
                        </div>
                        <div className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                          Strong match
                        </div>
                      </div>
                      <p className="mb-3 text-slate-300">{item.why}</p>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100">
                        <span className="font-semibold text-white">Timing:</span> {item.timing}
                      </div>
                    </div>
                  ))}
                </div>

                {results.caution.length > 0 && (
                  <div className="mt-6 rounded-[24px] border border-amber-400/25 bg-amber-400/10 p-5">
                    <div className="text-xs uppercase tracking-[0.24em] text-amber-200">Use extra caution</div>
                    <p className="mt-3 text-sm text-amber-50/90">
                      One or more of your answers suggest clinician review may make more sense before using certain options.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {results.caution.map((item) => (
                        <span
                          key={item.key}
                          className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1.5 text-xs text-amber-100"
                        >
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 rounded-[24px] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(6,22,39,0.96),rgba(8,27,49,0.9))] p-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">Non-supplement fixes</div>
                  <ul className="mt-4 space-y-3 text-sm text-slate-200">
                    {results.fixes.map((fix) => (
                      <li key={fix} className="flex items-start gap-3">
                        <span className="mt-0.5 text-cyan-300">•</span>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-6">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                disabled={step === 1}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>

              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep((current) => current + 1)}
                  disabled={!canContinue}
                  className="rounded-2xl bg-[linear-gradient(90deg,#22d3ee,#14b8a6)] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_40px_rgba(20,184,166,0.22)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setForm(INITIAL_FORM);
                    setStep(1);
                  }}
                  className="rounded-2xl bg-[linear-gradient(90deg,#22d3ee,#14b8a6)] px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_40px_rgba(20,184,166,0.22)] transition hover:scale-[1.01]"
                >
                  Start over
                </button>
              )}
            </div>
          </ShellCard>

          <div className="space-y-6">
            <ShellCard className="p-6 md:p-7">
              <div className="mb-4 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-300">
                What this tool does
              </div>
              <h3 className="text-2xl font-semibold">Personalized timing guidance</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                This tool does not try to act like a doctor. It narrows common sleep-support options based on your stated goal,
                your timing window, and your caution flags.
              </p>
              <div className="mt-6 space-y-3 text-sm text-slate-200">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">Goal-based ranking engine</div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">Timing-first recommendations</div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">Caution-aware filtering</div>
              </div>
            </ShellCard>

            <ShellCard className="p-6 md:p-7">
              <div className="mb-4 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-cyan-300">
                Next build steps
              </div>
              <h3 className="text-2xl font-semibold">Ready for the next layer</h3>
              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">Add the final SleepMetric logo and icon set.</div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">Connect email capture and tagging.</div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">Add paid unlock or bundle logic.</div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">Insert affiliate product cards after results.</div>
              </div>
            </ShellCard>
          </div>
        </div>
      </div>
    </main>
  );
}
