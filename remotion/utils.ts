import { Easing, interpolate } from "remotion";

const EASE_OUT = Easing.out(Easing.cubic);

export const typeText = (
  text: string,
  frame: number,
  startFrame: number,
  charsPerFrame: number = 1.6
): string => {
  const elapsed = Math.max(0, frame - startFrame);
  const count = Math.floor(elapsed * charsPerFrame);
  return text.slice(0, Math.min(count, text.length));
};

export const countUp = (
  target: number,
  frame: number,
  startFrame: number,
  durationInFrames: number = 22,
  decimals: number = 0
): string => {
  const value = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, target],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT }
  );
  return value.toFixed(decimals);
};

export const enter = (
  frame: number,
  startFrame: number,
  durationInFrames: number = 11
) => {
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT }
  );
  const translateY = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [12, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT }
  );
  return { opacity, translateY };
};

export const fadeInOut = (
  frame: number,
  durationInFrames: number,
  fadeFrames: number = 12
) => {
  return interpolate(
    frame,
    [0, fadeFrames, durationInFrames - fadeFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_OUT }
  );
};

export const grow = (
  frame: number,
  startFrame: number,
  target: number,
  durationInFrames: number = 24
) =>
  interpolate(frame, [startFrame, startFrame + durationInFrames], [0, target], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
