"use client";

export const EVENT_COLORS = [
  { value: "", label: "기본", swatch: "var(--color-brand)" },
  { value: "#e35a5a", label: "빨강", swatch: "#e35a5a" },
  { value: "#f5a623", label: "주황", swatch: "#f5a623" },
  { value: "#16a374", label: "초록", swatch: "#16a374" },
  { value: "#3d4bff", label: "파랑", swatch: "#3d4bff" },
  { value: "#8b5cf6", label: "보라", swatch: "#8b5cf6" },
  { value: "#ec4899", label: "핑크", swatch: "#ec4899" },
];

export function ColorPicker({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="일정 색상">
      {EVENT_COLORS.map((c) => (
        <label key={c.value} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={c.value}
            defaultChecked={defaultValue === c.value}
            className="peer sr-only"
          />
          <span
            className="block h-8 w-8 rounded-full border-2 border-transparent peer-checked:border-[var(--color-ink)]"
            style={{ background: c.swatch }}
            title={c.label}
          />
        </label>
      ))}
    </div>
  );
}
