import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "7반 학급 운영센터",
    short_name: "7반",
    description: "공부시간 인증, 캘린더, 시간표, 공지사항, 물품 신청을 한곳에서",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#3d4bff",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
