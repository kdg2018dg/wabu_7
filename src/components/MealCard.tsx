import { getMealsForDate } from "@/lib/neis";
import { Card } from "@/components/Card";

const MEAL_ICON: Record<string, string> = {
  조식: "🌅",
  중식: "🍚",
  석식: "🌙",
};

export async function MealCard({ date }: { date: string }) {
  const meals = await getMealsForDate(date);

  // 아직 급식 정보가 공개되지 않은 날짜(먼 미래 등)는 오류로 보이지 않도록 칸 자체를 숨긴다.
  if (!meals || meals.length === 0) return null;

  return (
    <Card className="p-3">
      <p className="mb-2 text-xs font-bold text-[var(--color-ink-soft)]">🍽️ 이 날의 급식</p>
      <div className="flex flex-col gap-2.5">
        {meals.map((meal) => (
          <div key={meal.mealName}>
            <p className="mb-1 text-xs font-semibold text-[var(--color-brand)]">
              {MEAL_ICON[meal.mealName] ?? "🍴"} {meal.mealName}
              {meal.calorie && (
                <span className="ml-1.5 font-normal text-[var(--color-ink-soft)]">{meal.calorie}</span>
              )}
            </p>
            <ul className="flex flex-col gap-0.5">
              {meal.dishes.map((dish, i) => (
                <li key={i} className="text-sm leading-snug text-[var(--color-ink)]">
                  {dish}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
