import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

export const Watermark: React.FC<{ appearAt?: number }> = ({ appearAt = 0 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [appearAt, appearAt + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Img
        src={staticFile("talenth-mark.png")}
        style={{
          position: "absolute",
          bottom: 30,
          right: 34,
          width: 40,
          height: 40,
          opacity,
          filter: "drop-shadow(0 2px 6px rgba(15, 23, 42, 0.25))",
        }}
      />
    </AbsoluteFill>
  );
};
