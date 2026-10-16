import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/result-room/dashboard",
    name: "Uprix Result Room",
    short_name: "Uprix",
    description: "Your Result Room progress and accountability dashboard.",
    start_url: "/result-room/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#07017b",
    orientation: "portrait",
    icons: [
      {
        src: "/logo/logo-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo/logo-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
