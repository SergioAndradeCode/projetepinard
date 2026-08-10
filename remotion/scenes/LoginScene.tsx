import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Loader2, CheckCircle2 } from "lucide-react";
import { COLORS, FONT } from "../theme";
import { typeText, enter } from "../utils";
import { Caption } from "../components/Caption";

const EMAIL = "sergio.deandrade@talenth.fr";
const EMAIL_START = 8;
const PASSWORD_START = 22;
const PASSWORD_DOTS = 10;
const SUBMIT_FRAME = 34;
const SPINNER_END = 46;
const TOAST_START = 46;

const GoogleIcon: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export const LoginScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({ frame, fps, config: { damping: 200, mass: 0.6 } });
  const cardOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const emailText = typeText(EMAIL, frame, EMAIL_START, 2.3);
  const emailDone = emailText.length >= EMAIL.length;

  const passwordCount = Math.floor(
    interpolate(frame, [PASSWORD_START, PASSWORD_START + 8], [0, PASSWORD_DOTS], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const isSubmitting = frame >= SUBMIT_FRAME && frame < SPINNER_END;
  const isSuccess = frame >= SPINNER_END;

  const toastOpacity = interpolate(frame, [TOAST_START, TOAST_START + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const toastY = interpolate(frame, [TOAST_START, TOAST_START + 8], [-14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 40,
          opacity: toastOpacity,
          transform: `translateY(${toastY}px)`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: COLORS.white,
          border: `1px solid ${COLORS.successBorder}`,
          borderRadius: 12,
          padding: "14px 20px",
          boxShadow: "0 6px 20px rgba(15,23,42,0.1)",
        }}
      >
        <CheckCircle2 size={20} color={COLORS.success} />
        <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.textDark }}>
          Connexion réussie
        </span>
      </div>

      <div
        style={{
          width: 460,
          background: COLORS.white,
          borderRadius: 20,
          boxShadow: "0 12px 40px rgba(15,23,42,0.1)",
          padding: 40,
          opacity: cardOpacity,
          transform: `scale(${0.94 + cardSpring * 0.06})`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Img src={staticFile("talenth-mark.png")} style={{ width: 36, height: 36 }} />
            <span style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>Talenth</span>
          </div>
          <div style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 6 }}>
            Pilotage OETH simplifié
          </div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 600, color: COLORS.textDark, marginBottom: 18, textAlign: "center" }}>
          Connexion
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: "11px 0",
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.textDark,
            marginBottom: 16,
          }}
        >
          <GoogleIcon /> Continuer avec Google
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>ou</span>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textDark, marginBottom: 6 }}>
            Email professionnel
          </div>
          <div
            style={{
              border: `1px solid ${emailDone ? COLORS.primary : COLORS.border}`,
              borderRadius: 10,
              padding: "11px 14px",
              fontSize: 14,
              color: COLORS.textDark,
              minHeight: 18,
            }}
          >
            {emailText}
            {!emailDone && frame > EMAIL_START && (
              <span style={{ opacity: frame % 20 < 10 ? 1 : 0 }}>|</span>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textDark, marginBottom: 6 }}>
            Mot de passe
          </div>
          <div
            style={{
              border: `1px solid ${passwordCount >= PASSWORD_DOTS ? COLORS.primary : COLORS.border}`,
              borderRadius: 10,
              padding: "11px 14px",
              fontSize: 16,
              letterSpacing: 3,
              color: COLORS.textDark,
              minHeight: 18,
            }}
          >
            {"•".repeat(passwordCount)}
          </div>
        </div>

        <div
          style={{
            width: "100%",
            background: isSuccess ? COLORS.success : COLORS.primary,
            color: COLORS.white,
            borderRadius: 10,
            padding: "12px 0",
            textAlign: "center",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {isSubmitting ? (
            <Loader2 size={17} style={{ transform: `rotate(${frame * 22}deg)` }} />
          ) : isSuccess ? (
            <>
              <CheckCircle2 size={17} /> Connecté
            </>
          ) : (
            "Se connecter"
          )}
        </div>
      </div>

      <Caption text="Connexion rapide et sécurisée" startFrame={56} sceneDurationInFrames={115} top={110} />
    </AbsoluteFill>
  );
};
