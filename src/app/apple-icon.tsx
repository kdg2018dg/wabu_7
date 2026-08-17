import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3d4bff",
          borderRadius: 36,
        }}
      >
        <span style={{ fontSize: 100, fontWeight: 900, color: "#ffffff", lineHeight: 1, transform: "translateY(4px)" }}>
          7
        </span>
      </div>
    ),
    { ...size }
  );
}
