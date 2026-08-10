import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 14,
      padding: 22,
      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      fontSize: 18,
      fontWeight: 600,
      color: COLORS.textDark,
      marginBottom: 14,
    }}
  >
    {children}
  </div>
);

type BadgeVariant = "success" | "warning" | "danger" | "primary" | "neutral" | "purple";

const badgeColors: Record<BadgeVariant, { bg: string; fg: string; border: string }> = {
  success: { bg: COLORS.successBg, fg: COLORS.success, border: COLORS.successBorder },
  warning: { bg: COLORS.warningBg, fg: COLORS.warning, border: COLORS.warningBorder },
  danger: { bg: COLORS.dangerBg, fg: COLORS.danger, border: COLORS.dangerBorder },
  primary: { bg: COLORS.accentBg, fg: COLORS.primary, border: "rgba(30,74,140,0.18)" },
  neutral: { bg: "#F1F5F9", fg: COLORS.textMuted, border: COLORS.border },
  purple: { bg: "#F3E8FF", fg: COLORS.purple, border: "#E9D5FF" },
};

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: React.CSSProperties;
}> = ({ children, variant = "neutral", style }) => {
  const c = badgeColors[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const Pill: React.FC<{
  children: React.ReactNode;
  active?: boolean;
}> = ({ children, active }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 16px",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      background: active ? COLORS.primary : COLORS.white,
      color: active ? COLORS.white : COLORS.textMuted,
      border: `1px solid ${active ? COLORS.primary : COLORS.border}`,
    }}
  >
    {children}
  </span>
);

export const ProgressBar: React.FC<{
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
}> = ({ progress, color = COLORS.primary, trackColor = "#EEF2F6", height = 10 }) => (
  <div
    style={{
      width: "100%",
      height,
      borderRadius: height,
      background: trackColor,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${Math.max(0, Math.min(100, progress))}%`,
        height: "100%",
        borderRadius: height,
        background: color,
      }}
    />
  </div>
);

export const IconTile: React.FC<{
  children: React.ReactNode;
  bg?: string;
  size?: number;
}> = ({ children, bg = COLORS.accentBg, size = 46 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 12,
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {children}
  </div>
);

export const InitialsAvatar: React.FC<{
  initials: string;
  color: string;
  bg: string;
  size?: number;
}> = ({ initials, color, bg, size = 40 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: bg,
      color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.36,
      fontWeight: 700,
      border: `2px solid ${COLORS.white}`,
      boxShadow: "0 1px 4px rgba(15, 23, 42, 0.12)",
      flexShrink: 0,
    }}
  >
    {initials}
  </div>
);

const EASE_OUT = Easing.out(Easing.cubic);

export const MultiDonut: React.FC<{
  segments: { value: number; color: string }[];
  startFrame: number;
  size?: number;
  strokeWidth?: number;
}> = ({ segments, startFrame, size = 140, strokeWidth = 16 }) => {
  const frame = useCurrentFrame();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let cumulative = 0;

  return (
    <svg width={size} height={size}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {segments.map((seg, i) => {
          const segStart = startFrame + i * 5;
          const ratio = interpolate(frame, [segStart, segStart + 16], [0, seg.value / total], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EASE_OUT,
          });
          const dash = circumference * ratio;
          const offset = -cumulative * circumference;
          cumulative += seg.value / total;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </g>
    </svg>
  );
};
