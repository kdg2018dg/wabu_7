/** 'YYYY-MM-DD' -> 1(월)~5(금), 주말이면 0(토/일 구분 없이) */
export function dayOfWeekMonToFri(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=일 1=월 ... 6=토
  if (jsDay === 0 || jsDay === 6) return 0;
  return jsDay; // 1~5
}

export function isWeekend(dateStr: string): boolean {
  return dayOfWeekMonToFri(dateStr) === 0;
}

export const PERIODS = [1, 2, 3, 4, 5, 6, 7] as const;
export const WEEKDAY_LABEL: Record<number, string> = { 1: "월", 2: "화", 3: "수", 4: "목", 5: "금" };

export const CATEGORY_LABEL: Record<string, string> = {
  exam: "시험",
  assessment: "수행평가",
  homework: "숙제",
  supplies: "준비물",
  mock_exam: "모의고사",
  school_event: "학교 행사",
  holiday: "공휴일",
  other: "기타",
};

export const CATEGORY_ICON: Record<string, string> = {
  exam: "📝",
  assessment: "📋",
  homework: "📓",
  supplies: "🎒",
  mock_exam: "📄",
  school_event: "🏫",
  holiday: "🎉",
  other: "📌",
};

export interface TimetableCell {
  subject: string | null;
  teacher: string | null;
  room: string | null;
}

export interface TimetableRow {
  day_of_week: number;
  period: number;
  subject: string | null;
  teacher: string | null;
  room: string | null;
}

/** 기본 템플릿 위에 개인 오버라이드를 덮어씌워 (요일,교시) -> 셀 맵을 만든다 */
export function mergeTimetable(
  template: TimetableRow[],
  overrides: TimetableRow[]
): Map<string, TimetableCell> {
  const map = new Map<string, TimetableCell>();
  for (const row of template) {
    map.set(`${row.day_of_week}-${row.period}`, {
      subject: row.subject,
      teacher: row.teacher,
      room: row.room,
    });
  }
  for (const row of overrides) {
    map.set(`${row.day_of_week}-${row.period}`, {
      subject: row.subject,
      teacher: row.teacher,
      room: row.room,
    });
  }
  return map;
}
