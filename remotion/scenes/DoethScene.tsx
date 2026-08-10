import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import {
  FileText,
  Building2,
  Users,
  Calculator,
  FileDown,
  Check,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card, CardTitle } from "../components/ui";
import { Caption } from "../components/Caption";
import { COLORS } from "../theme";
import { countUp, enter } from "../utils";

const STEPS = [
  { label: "Année", Icon: FileText },
  { label: "Établissements", Icon: Building2 },
  { label: "Unités bénéficiaires", Icon: Users },
  { label: "Contribution", Icon: Calculator },
  { label: "Export DSN", Icon: FileDown },
];

const DONE_FRAMES = [16, 28, 40, 52];

const Stepper: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center" }}>
        {STEPS.map((step, i) => {
          const isDone = i < DONE_FRAMES.length && frame >= DONE_FRAMES[i];
          const isActive = i === DONE_FRAMES.length && frame >= DONE_FRAMES[DONE_FRAMES.length - 1];
          const bg = isDone ? COLORS.success : isActive ? COLORS.accentBg : "#F1F5F9";
          const fg = isDone ? COLORS.white : isActive ? COLORS.primary : COLORS.textMuted;
          return (
            <React.Fragment key={step.label}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 108 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "none",
                  }}
                >
                  {isDone ? <Check size={20} color={fg} /> : <step.Icon size={19} color={fg} />}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? COLORS.primary : COLORS.textMuted,
                    textAlign: "center",
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight size={18} color={COLORS.border} style={{ flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
};

const RecapRow: React.FC<{ label: string; value: string; startFrame: number; highlight?: boolean }> = ({
  label,
  value,
  startFrame,
  highlight,
}) => {
  const frame = useCurrentFrame();
  const e = enter(frame, startFrame);

  return (
    <div
      style={{
        opacity: e.opacity,
        transform: `translateY(${e.translateY}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "9px 0",
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <span style={{ fontSize: 14, color: highlight ? COLORS.textDark : COLORS.textMuted, fontWeight: highlight ? 600 : 400 }}>
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.textDark }}>{value}</span>
    </div>
  );
};

export const DoethScene: React.FC = () => {
  const frame = useCurrentFrame();
  const headerE = enter(frame, 4);
  const recapE = enter(frame, 66);
  const resultE = enter(frame, 132);

  const contributionNette = countUp(0, frame, 132, 1, 0);
  const contributionBrute = interpolate(frame, [132, 158], [42500, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exportE = enter(frame, 172);
  const exporting = frame >= 172 && frame < 190;
  const exported = frame >= 190;

  return (
    <>
    <AppShell active="doeth" title="Assistant DOETH" subtitle="Simulez votre déclaration en 5 étapes">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
        <div style={{ opacity: headerE.opacity, transform: `translateY(${headerE.translateY}px)` }}>
          <Stepper />
        </div>

        <div style={{ display: "flex", gap: 16, flex: 1 }}>
          <Card style={{ opacity: recapE.opacity, transform: `translateY(${recapE.translateY}px)`, flex: 1 }}>
            <CardTitle>Récapitulatif de la déclaration 2026</CardTitle>
            <RecapRow label="Effectif total" value="187" startFrame={72} />
            <RecapRow label="Quota théorique (6%)" value="11,2" startFrame={80} />
            <RecapRow label="UB BOETH comptabilisées" value="26,8" startFrame={88} />
            <RecapRow label="Taux d'emploi BOETH" value="6,4%" startFrame={96} />
            <RecapRow label="Déficit" value="0" startFrame={104} highlight />

            <div
              style={{
                opacity: resultE.opacity,
                transform: `translateY(${resultE.translateY}px)`,
                marginTop: 18,
                background: COLORS.accentBg,
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: COLORS.primary, fontWeight: 600 }}>
                  CONTRIBUTION NETTE À VERSER
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                  après déductions ESAT / EA et formation
                </div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, color: COLORS.primary }}>
                {frame < 158 ? `${Math.round(contributionBrute).toLocaleString("fr-FR")} €` : `${contributionNette} €`}
              </div>
            </div>
          </Card>

          <Card style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 16 }}>
            <div
              style={{
                opacity: exportE.opacity,
                transform: `scale(${0.9 + exportE.opacity * 0.1})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: exported ? COLORS.success : COLORS.primary,
                  color: COLORS.white,
                  borderRadius: 12,
                  padding: "14px 26px",
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {exporting ? (
                  <Loader2 size={18} style={{ transform: `rotate(${frame * 20}deg)` }} />
                ) : exported ? (
                  <Check size={18} />
                ) : (
                  <FileDown size={18} />
                )}
                {exported ? "Dossier exporté" : "Exporter le dossier DOETH (.xlsx)"}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center" }}>
                Talenth_DOETH_TalenthIndustries_2026.xlsx
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
    <Caption
      text="DOETH simulé à partir de vos données, prêt pour l'extraction"
      startFrame={112}
      sceneDurationInFrames={220}
    />
    </>
  );
};
