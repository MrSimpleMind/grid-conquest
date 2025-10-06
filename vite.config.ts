import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const shouldEnablePwa = process.env.DISABLE_PWA !== "true";

const plugins = [react()];

if (shouldEnablePwa) {
  plugins.push(
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.svg", "icons/icon-512.svg", "vite.svg"],
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      },
    })
  );
}

export default defineConfig({
  base: "/grid-conquest/",
  plugins,
});
