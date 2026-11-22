import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "ZARASOA — Plateforme universitaire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image d'aperçu pour les réseaux sociaux (Facebook, WhatsApp, LinkedIn, X…). */
export default async function OpenGraphImage() {
  let logo: string | null = null;
  try {
    const file = await readFile(join(process.cwd(), "public/assets/img/logo-light-wordmark.png"));
    logo = `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    logo = null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "#011c86",
          color: "#ffffff",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 0, right: 150, width: 26, height: 630, background: "#eeaf2e", display: "flex" }} />
        <div style={{ position: "absolute", top: 0, right: 0, width: 150, height: 630, background: "#ffffff", opacity: 0.06, display: "flex" }} />
        {logo ? (
          <img src={logo} width={560} height={125} alt="" />
        ) : (
          <div style={{ fontSize: 96, fontWeight: 700, display: "flex" }}>ZARASOA</div>
        )}
        <div style={{ fontSize: 44, marginTop: 44, maxWidth: 800, lineHeight: 1.25, display: "flex" }}>
          Plateforme universitaire : cours, ressources pédagogiques et devoirs
        </div>
        <div style={{ fontSize: 32, marginTop: 28, color: "#eeaf2e", display: "flex" }}>Apprendre • Partager • Réussir</div>
      </div>
    ),
    size,
  );
}
