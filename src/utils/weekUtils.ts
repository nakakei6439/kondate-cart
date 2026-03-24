import { DayKey } from '../types';

export const DAY_KEYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type TimeLabelKey = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'earlier';

/** ISO 8601 週番号を返す "2026-W09" 形式 */
export function getWeekKey(date: Date): string {
  // 木曜日基準のISO週番号
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay(); // 0=Sun,1=Mon,...,6=Sat
  // 木曜日に揃える（ISO 8601: 週は月曜始まり、木曜が属する年の週番号）
  d.setUTCDate(d.getUTCDate() + 4 - (day === 0 ? 7 : day));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const year = d.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

/** weekKey → 月曜日〜日曜日の Date 配列（7要素）*/
export function getWeekDates(weekKey: string): Date[] {
  const [yearStr, weekStr] = weekKey.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // 1月4日はISO週の第1週に必ず含まれる
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // 0=Sunを7に変換（月=1）
  // その年の第1週の月曜日
  const firstMonday = new Date(jan4.getTime() - (jan4Day - 1) * 86400000);
  // 目的の週の月曜日
  const monday = new Date(firstMonday.getTime() + (week - 1) * 7 * 86400000);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getTime() + i * 86400000);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  });
}

/** "2/23" 形式のラベル */
export function formatDayLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/** Date → DayKey */
export function getDayKeyFromDate(date: Date): DayKey {
  const jsDay = date.getDay(); // 0=Sun,1=Mon,...,6=Sat
  return DAY_KEYS[jsDay === 0 ? 6 : jsDay - 1];
}

/** 前の週の weekKey */
export function prevWeekKey(weekKey: string): string {
  const dates = getWeekDates(weekKey);
  const prevSat = new Date(dates[0].getTime() - 86400000); // 月曜の1日前=前週日曜
  return getWeekKey(prevSat);
}

/** 次の週の weekKey */
export function nextWeekKey(weekKey: string): string {
  const dates = getWeekDates(weekKey);
  const nextMon = new Date(dates[6].getTime() + 86400000); // 日曜の1日後=翌週月曜
  return getWeekKey(nextMon);
}

/** 今週の weekKey */
export function getCurrentWeekKey(): string {
  return getWeekKey(new Date());
}

/** "2026-W09" → "2026年 第9週 (2/23〜3/1)" 形式 */
export function formatWeekTitle(weekKey: string): string {
  const dates = getWeekDates(weekKey);
  const start = dates[0];
  const end = dates[6];
  return `${start.getMonth() + 1}/${start.getDate()} 〜 ${end.getMonth() + 1}/${end.getDate()}`;
}
