import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fadeInOut } from "../utils";

export const SceneFade: React.FC<{
  durationInFrames: number;
  children: React.ReactNode;
}> = ({ durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const opacity = fadeInOut(frame, durationInFrames, 15);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
