import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { CheckCircle2 } from "lucide-react";
import { DashboardScene } from "../scenes/DashboardScene";
import { COLORS, FONT } from "../theme";

const FEATURES = ["Conformité OETH", "Salariés RQTH", "Budget", "DOETH"];

const MOCK_WIDTH = 1180;
const MOCK_HEIGHT = Math.round(MOCK_WIDTH * (1080 / 1920));
const MOCK_SCALE = MOCK_WIDTH / 1920;

export const Thumbnail: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryHover} 100%)`,
      fontFamily: FONT,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        width: 900,
        height: 900,
        left: -260,
        top: -260,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%)",
      }}
    />

    <div
      style={{
        position: "absolute",
        right: -70,
        top: 208,
        width: MOCK_WIDTH,
        height: MOCK_HEIGHT,
        transform: "rotate(-3deg)",
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "0 60px 130px rgba(0,0,0,0.5)",
        border: "1px solid rgba(255,255,255,0.25)",
      }}
    >
      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${MOCK_SCALE})`,
          transformOrigin: "top left",
        }}
      >
        <DashboardScene hideProfile />
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 76,
        top: 88,
        width: 760,
        display: "flex",
        flexDirection: "column",
        gap: 26,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Img src={staticFile("talenth-mark.png")} style={{ width: 46, height: 46 }} />
        <span style={{ fontSize: 28, fontWeight: 800, color: COLORS.white }}>Talenth</span>
      </div>

      <div style={{ fontSize: 74, fontWeight: 800, color: COLORS.white, lineHeight: 1.08 }}>
        Pilotage OETH
        <br />
        simplifié
      </div>

      <div style={{ fontSize: 24, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, maxWidth: 620 }}>
        Dashboard, salariés RQTH, budget et DOETH réunis dans un seul outil.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
        {FEATURES.map((f) => (
          <div
            key={f}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 999,
              padding: "9px 16px",
              fontSize: 15,
              fontWeight: 600,
              color: COLORS.white,
            }}
          >
            <CheckCircle2 size={15} />
            {f}
          </div>
        ))}
      </div>
    </div>

    <div
      style={{
        position: "absolute",
        left: 76,
        bottom: 70,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: COLORS.white,
        borderRadius: 999,
        padding: "14px 26px",
        fontSize: 20,
        fontWeight: 700,
        color: COLORS.primary,
      }}
    >
      talenth.fr
    </div>
  </AbsoluteFill>
);
