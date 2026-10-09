import { useCallback, useEffect, useRef, useState } from "react";
import { DHIKR_NAMES, NAME_TARGET, type WirdPhase } from "@/data/dhikr";
import { localDateKey, previousLocalDateKey } from "@/lib/local-calendar";

const KEY = "rihab-dhikr-v1";

export type NameProgress = {
  count: number;
  /** إجمالي المدة الفعلية للذكر بالمللي ثانية */
  elapsedMs: number;
  startedAt: number | null;
  completedAt: number | null;
};

export type DhikrState = {
  activeIndex: number;
  names: Record<string, NameProgress>;
  /** عدّادات أوراد الصلاة والاستغفار لليوم الحالي */
  daily: { date: string; salawat: number; istighfar: number };
  /** سلسلة الأيام المتتابعة */
  streak: number;
  lastActiveDate: string | null;
  totalSessions: number;
};

const emptyName = (): NameProgress => ({ count: 0, elapsedMs: 0, startedAt: null, completedAt: null });

function today() {
  return localDateKey();
}

function initial(): DhikrState {
  return {
    activeIndex: 0,
    names: Object.fromEntries(DHIKR_NAMES.map((n) => [n.id, emptyName()])),
    daily: { date: today(), salawat: 0, istighfar: 0 },
    streak: 0,
    lastActiveDate: null,
    totalSessions: 0,
  };
}

function load(): DhikrState {
  if (typeof window === "undefined") return initial();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const parsed = JSON.parse(raw) as Partial<DhikrState>;
    const base = initial();
    const names = { ...base.names, ...(parsed.names ?? {}) };
    const daily =
      parsed.daily && parsed.daily.date === today()
        ? parsed.daily
        : { date: today(), salawat: 0, istighfar: 0 };
    return { ...base, ...parsed, names, daily };
  } catch {
    return initial();
  }
}

function save(s: DhikrState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function bumpStreak(s: DhikrState): DhikrState {
  const d = today();
  if (s.lastActiveDate === d) return s;
  const yesterday = previousLocalDateKey();
  return {
    ...s,
    streak: s.lastActiveDate === yesterday ? s.streak + 1 : 1,
    lastActiveDate: d,
  };
}

export function useDhikr() {
  const [state, setState] = useState<DhikrState>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [running, setRunning] = useState(false);
  const [sessionMs, setSessionMs] = useState(0);
  const sessionStart = useRef<number | null>(null);
  const sessionNameId = useRef<string | null>(null);
  const sessionCount = useRef(0);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) save(state);
  }, [state, hydrated]);

  // Roll over the displayed counters while the app stays open, and when it
  // resumes from the background after a date change.
  useEffect(() => {
    const rollover = () => {
      const date = today();
      setState((current) => current.daily.date === date
        ? current
        : { ...current, daily: { date, salawat: 0, istighfar: 0 } });
    };
    const timer = window.setInterval(rollover, 60_000);
    document.addEventListener("visibilitychange", rollover);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", rollover);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (sessionStart.current) setSessionMs(Date.now() - sessionStart.current);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const startSession = useCallback(() => {
    if (sessionStart.current) return;
    sessionStart.current = Date.now();
    sessionNameId.current = DHIKR_NAMES[state.activeIndex]?.id ?? null;
    sessionCount.current = 0;
    setSessionMs(0);
    setRunning(true);
    setState((s) => {
      const active = DHIKR_NAMES[s.activeIndex]!;
      const np = s.names[active.id] ?? emptyName();
      return bumpStreak({
        ...s,
        totalSessions: s.totalSessions + 1,
        names: { ...s.names, [active.id]: { ...np, startedAt: np.startedAt ?? Date.now() } },
      });
    });
  }, [state.activeIndex]);

  const stopSession = useCallback(() => {
    const start = sessionStart.current;
    const nameId = sessionNameId.current;
    sessionStart.current = null;
    sessionNameId.current = null;
    setRunning(false);
    if (start === null) return;
    const delta = Math.max(0, Date.now() - start);
    setSessionMs(0);
    setState((s) => {
      // Credit the original name, even if the selected name changed mid-session.
      const id = nameId ?? DHIKR_NAMES[s.activeIndex]!.id;
      const np = s.names[id] ?? emptyName();
      return { ...s, names: { ...s.names, [id]: { ...np, elapsedMs: np.elapsedMs + delta } } };
    });
  }, []);

  /** يضيف عددًا إلى الاسم الحالي، وينتقل تلقائيًا عند بلوغ الهدف. */
  const addToName = useCallback((amount: number) => {
    sessionCount.current += amount;
    let completedName: string | null = null;
    setState((s) => {
      const active = DHIKR_NAMES[s.activeIndex]!;
      const np = s.names[active.id] ?? emptyName();
      const count = Math.min(NAME_TARGET, np.count + amount);
      const done = count >= NAME_TARGET;
      if (done && !np.completedAt) completedName = active.name;
      const next: DhikrState = bumpStreak({
        ...s,
        names: {
          ...s.names,
          [active.id]: {
            ...np,
            count,
            startedAt: np.startedAt ?? Date.now(),
            completedAt: done ? (np.completedAt ?? Date.now()) : np.completedAt,
          },
        },
      });
      if (done && s.activeIndex < DHIKR_NAMES.length - 1) next.activeIndex = s.activeIndex + 1;
      return next;
    });
    return () => completedName;
  }, []);

  const addDaily = useCallback((phase: Exclude<WirdPhase, "asma">, amount: number) => {
    sessionCount.current += amount;
    setState((s) => {
      const daily = s.daily.date === today() ? s.daily : { date: today(), salawat: 0, istighfar: 0 };
      return bumpStreak({ ...s, daily: { ...daily, [phase]: daily[phase] + amount } });
    });
  }, []);

  const setActiveIndex = useCallback((i: number) => setState((s) => ({ ...s, activeIndex: i })), []);

  const reset = useCallback(() => {
    setState(initial());
    sessionStart.current = null;
    sessionNameId.current = null;
    sessionCount.current = 0;
    setRunning(false);
    setSessionMs(0);
  }, []);

  const active = DHIKR_NAMES[state.activeIndex]!;
  const activeProgress = state.names[active.id] ?? emptyName();
  const totalCount = Object.values(state.names).reduce((a, n) => a + n.count, 0);
  const totalElapsed = Object.values(state.names).reduce((a, n) => a + n.elapsedMs, 0) + sessionMs;
  const minutes = (activeProgress.elapsedMs + sessionMs) / 60000;
  const rate = minutes > 0 ? Math.round(activeProgress.count / minutes) : 0;
  const remaining = NAME_TARGET - activeProgress.count;
  const etaMinutes = rate > 0 ? Math.round(remaining / rate) : null;

  return {
    hydrated,
    state,
    active,
    activeProgress,
    running,
    sessionMs,
    sessionCount: sessionCount.current,
    stats: { totalCount, totalElapsed, rate, remaining, etaMinutes },
    startSession,
    stopSession,
    addToName,
    addDaily,
    setActiveIndex,
    reset,
  };
}

export function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatNumber(n: number) {
  return n.toLocaleString("ar-EG");
}

export const MILESTONES = [0.1, 0.25, 0.5, 0.75, 1];
