import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Wallet, TrendingDown, Calendar } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card, CardTitle, IconTile, ProgressBar, MultiDonut } from "../components/ui";
import { Caption } from "../components/Caption";
import { COLORS } from "../theme";
import { enter } from "../utils";

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const DEPENSES = [3.2, 4.1, 3.8, 5.0, 4.4, 5.6, 4.9, 3.5, 5.2, 4.8, 3.9, 4.6];
const BUDGET_MENSUEL = 6.5;

const CATEGORIES = [
  { label: "ESAT / EA", value: 34, color: COLORS.primary },
  { label: "Sensibilisation", value: 18, color: COLORS.secondary },
  { label: "Communication", value: 14, color: COLORS.tertiary },
  { label: "Formation", value: 20, color: COLORS.success },
  { label: "Prestations externes", value: 9, color: COLORS.warning },
  { label: "Autres", value: 5, color: COLORS.purple },
];

const SummaryCard: React.FC<{
  startFrame: number;
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  value: React.ReactNode;
  caption: string;
  progress?: number;
}> = ({ startFrame, title, icon, iconBg, value, caption, progress }) => {
  const frame = useCurrentFrame();
  const e = enter(frame, startFrame);
  const barValue = interpolate(frame, [startFrame + 5, startFrame + 22], [0, progress ?? 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Card style={{ opacity: e.opacity, transform: `translateY(${e.translateY}px)`, flex: 1 }}>
      <CardTitle>{title}</CardTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: progress !== undefined ? 14 : 0 }}>
        <IconTile bg={iconBg}>{icon}</IconTile>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textDark }}>{value}</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>{caption}</div>
        </div>
      </div>
      {progress !== undefined && <ProgressBar progress={barValue} color={COLORS.primary} />}
    </Card>
  );
};

const YearPill: React.FC<{ label: string; active?: boolean }> = ({ label, active }) => (
  <div
    style={{
      padding: "8px 16px",
      borderRadius: 8,
      fontSize: 14,
      fontWeight: active ? 700 : 500,
      background: active ? COLORS.primary : "transparent",
      color: active ? COLORS.white : COLORS.textMuted,
    }}
  >
    {label}
  </div>
);

const CategoryChart: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const e = enter(frame, startFrame);

  return (
    <Card style={{ opacity: e.opacity, transform: `translateY(${e.translateY}px)`, flex: 1 }}>
      <CardTitle>Répartition par catégorie</CardTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <MultiDonut segments={CATEGORIES} startFrame={startFrame + 4} size={128} strokeWidth={16} />
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {CATEGORIES.map((c) => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 9, height: 9, borderRadius: 3, background: c.color }} />
              <span style={{ fontSize: 12, color: COLORS.textDark }}>
                {c.label} <span style={{ color: COLORS.textMuted }}>{c.value}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const MonthlyChart: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const e = enter(frame, startFrame);
  const maxVal = 8;

  return (
    <Card style={{ opacity: e.opacity, transform: `translateY(${e.translateY}px)`, flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <CardTitle>Évolution mensuelle 2026</CardTitle>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: COLORS.textMuted }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 9, height: 9, borderRadius: 3, background: COLORS.primary }} />
            Dépenses
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 9, height: 9, borderRadius: 3, background: "#CBD5E1" }} />
            Budget
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 130 }}>
        {MONTHS.map((m, i) => {
          const barStart = startFrame + 4 + i * 2;
          const depH = interpolate(frame, [barStart, barStart + 12], [0, (DEPENSES[i] / maxVal) * 130], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const budgetH = (BUDGET_MENSUEL / maxVal) * 130;
          return (
            <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: "100%", height: 130, display: "flex", alignItems: "flex-end", position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    width: "100%",
                    height: budgetH,
                    borderRadius: 4,
                    background: "#CBD5E1",
                    opacity: 0.5,
                  }}
                />
                <div
                  style={{
                    width: "100%",
                    height: depH,
                    borderRadius: 4,
                    background: COLORS.primary,
                    zIndex: 1,
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: COLORS.textMuted }}>{m}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const BudgetScene: React.FC = () => {
  const frame = useCurrentFrame();
  const headerE = enter(frame, 4);

  return (
    <>
    <AppShell active="budget" title="Budget" subtitle="Suivi des dépenses OETH : exercice 2026">
      <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
        <div
          style={{
            opacity: headerE.opacity,
            transform: `translateY(${headerE.translateY}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: 4,
            }}
          >
            <YearPill label="2023" />
            <YearPill label="2024" />
            <YearPill label="2025" />
            <YearPill label="2026" active />
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <SummaryCard
            startFrame={16}
            title="Budget consommé"
            icon={<Wallet size={22} color={COLORS.primary} />}
            iconBg={COLORS.accentBg}
            value="48 200 €"
            caption="sur 78 000 € alloués"
            progress={62}
          />
          <SummaryCard
            startFrame={24}
            title="Budget restant"
            icon={<TrendingDown size={22} color={COLORS.success} />}
            iconBg={COLORS.successBg}
            value="29 800 €"
            caption="disponible cette année"
          />
          <SummaryCard
            startFrame={32}
            title="Dépenses ce mois"
            icon={<Calendar size={22} color={COLORS.warning} />}
            iconBg={COLORS.warningBg}
            value="4 600 €"
            caption="12 opérations enregistrées"
          />
        </div>

        <div style={{ display: "flex", gap: 14, flex: 1 }}>
          <CategoryChart startFrame={46} />
          <MonthlyChart startFrame={56} />
        </div>
      </div>
    </AppShell>
    <Caption
      text="Tout votre budget handicap, catégorie par catégorie"
      startFrame={100}
      sceneDurationInFrames={185}
    />
    </>
  );
};
