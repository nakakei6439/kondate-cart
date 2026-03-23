import {
  getWeekKey,
  getWeekDates,
  prevWeekKey,
  nextWeekKey,
  formatWeekTitle,
  formatDayLabel,
  getDayKeyFromDate,
} from '../../src/utils/weekUtils';

describe('getWeekKey', () => {
  it('月曜日は当週の weekKey を返す', () => {
    expect(getWeekKey(new Date(2026, 1, 23))).toBe('2026-W09');
  });

  it('木曜日は当週の weekKey を返す', () => {
    expect(getWeekKey(new Date(2026, 1, 26))).toBe('2026-W09');
  });

  it('日曜日は当週の weekKey を返す（ISO 週末）', () => {
    expect(getWeekKey(new Date(2026, 2, 1))).toBe('2026-W09');
  });

  it('年またぎ: 2025-12-29 は 2026-W01', () => {
    expect(getWeekKey(new Date(2025, 11, 29))).toBe('2026-W01');
  });
});

describe('getWeekDates', () => {
  it('月曜日が正しい日付（2026-W09 → 2/23）', () => {
    const dates = getWeekDates('2026-W09');
    expect(dates[0].getFullYear()).toBe(2026);
    expect(dates[0].getMonth()).toBe(1); // 0-based
    expect(dates[0].getDate()).toBe(23);
  });

  it('7要素を返す', () => {
    expect(getWeekDates('2026-W09')).toHaveLength(7);
  });

  it('weekKey との往復変換: getWeekKey(getWeekDates[0]) === 元の weekKey', () => {
    const key = '2026-W09';
    const monday = getWeekDates(key)[0];
    expect(getWeekKey(monday)).toBe(key);
  });
});

describe('prevWeekKey / nextWeekKey', () => {
  it('通常週: 前週', () => {
    expect(prevWeekKey('2026-W09')).toBe('2026-W08');
  });

  it('通常週: 次週', () => {
    expect(nextWeekKey('2026-W09')).toBe('2026-W10');
  });

  it('年またぎ: 2026-W01 の前週は 2025-W52（2025年は52週）', () => {
    expect(prevWeekKey('2026-W01')).toBe('2025-W52');
  });

  it('逆操作: prev(next(key)) === key', () => {
    const key = '2026-W09';
    expect(prevWeekKey(nextWeekKey(key))).toBe(key);
  });
});

describe('formatWeekTitle', () => {
  it('"2/23 〜 3/1" 形式を返す', () => {
    expect(formatWeekTitle('2026-W09')).toBe('2/23 〜 3/1');
  });
});

describe('formatDayLabel', () => {
  it('月曜日: "2/23(月)"', () => {
    expect(formatDayLabel(new Date(2026, 1, 23))).toBe('2/23(月)');
  });

  it('日曜日: "3/1(日)"', () => {
    expect(formatDayLabel(new Date(2026, 2, 1))).toBe('3/1(日)');
  });
});

describe('getDayKeyFromDate', () => {
  it('月曜日 → "Mon"', () => {
    expect(getDayKeyFromDate(new Date(2026, 1, 23))).toBe('Mon');
  });

  it('日曜日 → "Sun"', () => {
    expect(getDayKeyFromDate(new Date(2026, 2, 1))).toBe('Sun');
  });

  it('土曜日 → "Sat"', () => {
    expect(getDayKeyFromDate(new Date(2026, 1, 28))).toBe('Sat');
  });
});
