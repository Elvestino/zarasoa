import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZARASOA",
    short_name: "ZARASOA",
    description: "Plateforme universitaire : cours, ressources pédagogiques et devoirs.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#011c86",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
