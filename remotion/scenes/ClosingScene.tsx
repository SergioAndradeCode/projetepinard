import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ArrowRight } from "lucide-react";
import { COLORS, FONT } from "../theme";

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({ frame, fps, config: { damping: 200, mass: 0.6 } });
  const glowOpacity = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineOpacity = interpolate(frame, [16, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextOpacity = interpolate(frame, [30, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const buttonSpring = spring({ frame: frame - 44, fps, config: { damping: 12, mass: 0.5 } });
  const buttonOpacity = interpolate(frame, [44, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = frame > 70 ? 1 + Math.sin((frame - 70) / 9) * 0.025 : 1;

  const urlOpacity = interpolate(frame, [66, 78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryHover} 100%)`,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%)",
          opacity: glowOpacity,
        }}
      />

      <div style={{ transform: `scale(${0.82 + logoSpring * 0.18})` }}>
        <Img
          src={staticFile("talenth-mark.png")}
          style={{
            width: 96,
            height: 96,
            filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.25)) brightness(0) invert(1)",
          }}
        />
      </div>

      <div
        style={{
          marginTop: 18,
          fontSize: 27,
          fontWeight: 700,
          color: COLORS.white,
          opacity: taglineOpacity,
        }}
      >
        Pilotage OETH simplifié
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 17,
          color: "rgba(255,255,255,0.85)",
          opacity: subtextOpacity,
        }}
      >
        Démo gratuite et devis personnalisé, sans engagement
      </div>

      <div
        style={{
          marginTop: 26,
          opacity: buttonOpacity,
          transform: `scale(${(0.85 + buttonSpring * 0.15) * pulse})`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "17px 34px",
          borderRadius: 999,
          background: COLORS.white,
          color: COLORS.primary,
          fontSize: 19,
          fontWeight: 700,
          boxShadow: "0 14px 34px rgba(0,0,0,0.28)",
        }}
      >
        Demander ma démo gratuite
        <ArrowRight size={20} />
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 15,
          fontWeight: 600,
          color: "rgba(255,255,255,0.75)",
          opacity: urlOpacity,
        }}
      >
        talenth.fr
      </div>
    </AbsoluteFill>
  );
};
