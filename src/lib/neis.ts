/**
 * 나이스(NEIS) 교육정보 개방 포털 Open API 연동 — 학교 급식 정보 조회
 * https://open.neis.go.kr (교육부/한국교육학술정보원 공식 무료 공공 API)
 *
 * 학교의 표준학교코드(SD_SCHUL_CODE)를 직접 하드코딩하지 않는다. 코드를 잘못
 * 적으면 "정상적으로 응답은 오지만 엉뚱한 학교의 급식이 나오는" 조용한 오류가
 * 생길 수 있기 때문에, 학교명("와부고등학교")과 교육청코드("J10" 경기도교육청)로
 * 매번 안전하게 조회해서 코드를 알아낸 뒤 사용한다. 조회 결과는 거의 바뀌지 않는
 * 정보이므로 캐시해서 반복 호출을 피한다.
 */

const SCHOOL_NAME = "와부고등학교";
const OFFICE_CODE = "J10"; // 경기도교육청
const BASE_URL = "https://open.neis.go.kr/hub";

// NEIS_API_KEY 는 선택 사항 — https://open.neis.go.kr 에서 무료로 즉시 발급받을 수 있고,
// 키가 없어도 소량의 요청은 동작하지만 안정적인 운영을 위해서는 발급받아 설정하는 걸 권장한다.
const API_KEY = process.env.NEIS_API_KEY;

function withKey(params: Record<string, string>) {
  const p = new URLSearchParams(params);
  if (API_KEY) p.set("KEY", API_KEY);
  return p;
}

interface ResolvedSchool {
  atptCode: string;
  schulCode: string;
}

let cachedSchool: ResolvedSchool | null = null;

async function resolveSchoolCode(): Promise<ResolvedSchool | null> {
  if (cachedSchool) return cachedSchool;

  try {
    const params = withKey({
      Type: "json",
      SCHUL_NM: SCHOOL_NAME,
      ATPT_OFCDC_SC_CODE: OFFICE_CODE,
    });
    const res = await fetch(`${BASE_URL}/schoolInfo?${params.toString()}`, {
      next: { revalidate: 60 * 60 * 24 }, // 학교 코드는 사실상 안 바뀌므로 하루 캐시
    });
    if (!res.ok) return null;

    const data = await res.json();
    const row = data?.schoolInfo?.[1]?.row?.[0];
    if (!row?.SD_SCHUL_CODE) return null;

    cachedSchool = { atptCode: row.ATPT_OFCDC_SC_CODE, schulCode: row.SD_SCHUL_CODE };
    return cachedSchool;
  } catch {
    return null;
  }
}

export interface MealInfo {
  mealName: string; // "조식" | "중식" | "석식"
  dishes: string[]; // 줄바꿈 단위로 분리되고, 알레르기 유발 식재료 번호는 제거된 요리명 목록
  calorie: string | null;
}

/** 알레르기 유발 식재료 번호(예: "닭볶음탕1.5.6.")를 떼어내 요리명만 깔끔하게 남긴다 */
function cleanDishName(raw: string): string {
  return raw.replace(/(\d\.)+/g, "").trim();
}

/**
 * 특정 날짜의 급식 정보를 가져온다. 데이터가 없으면(먼 미래 날짜 등) null을 반환하므로,
 * 호출하는 쪽에서는 null일 때 급식 칸 자체를 표시하지 않으면 된다.
 */
export async function getMealsForDate(dateStr: string): Promise<MealInfo[] | null> {
  const school = await resolveSchoolCode();
  if (!school) return null;

  const ymd = dateStr.replace(/-/g, "");

  try {
    const params = withKey({
      Type: "json",
      ATPT_OFCDC_SC_CODE: school.atptCode,
      SD_SCHUL_CODE: school.schulCode,
      MLSV_YMD: ymd,
    });
    const res = await fetch(`${BASE_URL}/mealServiceDietInfo?${params.toString()}`, {
      next: { revalidate: 60 * 60 * 6 }, // 6시간 캐시 — 같은 날짜 반복 요청 시 외부 API 왕복 없이 즉시 응답
    });
    if (!res.ok) return null;

    const data = await res.json();

    // 데이터가 없는 날짜(급식 정보 미공개, 방학, 먼 미래 등)는 RESULT 코드가 INFO-200 으로 온다.
    const resultCode = data?.mealServiceDietInfo?.[0]?.head?.[1]?.RESULT?.CODE;
    if (resultCode !== "INFO-000") return null;

    const rows = data?.mealServiceDietInfo?.[1]?.row;
    if (!Array.isArray(rows) || rows.length === 0) return null;

    return rows.map((r: { MMEAL_SC_NM: string; DDISH_NM: string; CAL_INFO: string | null }) => ({
      mealName: r.MMEAL_SC_NM,
      dishes: r.DDISH_NM.split("<br/>").map(cleanDishName).filter(Boolean),
      calorie: r.CAL_INFO ?? null,
    }));
  } catch {
    return null;
  }
}
