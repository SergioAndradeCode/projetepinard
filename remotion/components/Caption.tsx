import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT } from "../theme";

export const Caption: React.FC<{
  text: string;
  startFrame: number;
  sceneDurationInFrames: number;
  holdFrames?: number;
  top?: number;
  right?: number;
}> = ({ text, startFrame, sceneDurationInFrames, holdFrames = 65, top = 26, right = 40 }) => {
  const frame = useCurrentFrame();
  const outStart = Math.min(startFrame + holdFrames, sceneDurationInFrames - 14);

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 9, outStart, outStart + 12],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const y = interpolate(frame, [startFrame, startFrame + 9], [-14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(
    frame,
    [startFrame, startFrame + 7, startFrame + 12],
    [0.88, 1.04, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        top,
        right,
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        transformOrigin: "right top",
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: COLORS.primary,
        borderRadius: 14,
        padding: "18px 22px 18px 34px",
        boxShadow: "0 16px 44px rgba(15,23,42,0.35)",
        zIndex: 60,
        fontFamily: FONT,
      }}
    >
      <span style={{ fontSize: 23, fontWeight: 700, color: COLORS.white, whiteSpace: "nowrap" }}>
        {text}
      </span>
      <div style={{ width: 6, height: 28, borderRadius: 3, background: COLORS.success, flexShrink: 0 }} />
    </div>
  );
};
