import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { CheckCircle2, Users, Wallet, AlertTriangle, TrendingUp, Target, Landmark } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card, CardTitle, Badge, ProgressBar, IconTile, MultiDonut } from "../components/ui";
import { Caption } from "../components/Caption";
import { COLORS } from "../theme";
import { countUp, enter } from "../utils";

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const MONTH_VALUES = [3.1, 3.4, 3.8, 4.2, 4.6, 5.0, 5.3, 5.6, 5.9, 6.1, 6.3, 6.4];
const RECONNAISSANCE = [
  { label: "RQTH", value: 22, color: COLORS.primary },
  { label: "Invalidité", value: 6, color: COLORS.secondary },
  { label: "AAH", value: 3, color: COLORS.success },
];

const GaugeCard: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const e = enter(frame, startFrame);
  const target = 6.4;
  const scaleMax = 10;
  const pct = countUp(target, frame, startFrame + 6, 20, 1);

  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const fillRatio = interpolate(frame, [startFrame + 6, startFrame + 26], [0, target / scaleMax], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dashoffset = circumference * (1 - fillRatio);

  return (
    <Card style={{ opacity: e.opacity, transform: `translateY(${e.translateY}px)`, flex: 1 }}>
      <CardTitle>Taux OETH 2026</CardTitle>
      <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
        <svg width={164} height={164}>
          <circle cx={82} cy={82} r={radius} fill="none" stroke="#EEF2F6" strokeWidth={13} />
          <circle
            cx={82}
            cy={82}
            r={radius}
            fill="none"
            stroke={COLORS.success}
            strokeWidth={13}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            transform="rotate(-90 82 82)"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 164,
            height: 164,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 700, color: COLORS.textDark }}>{pct}%</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>taux OETH</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <Badge variant="success">
          <CheckCircle2 size={13} /> Conforme
        </Badge>
      </div>
    </Card>
  );
};

const MiniKpiCard: React.FC<{
  startFrame: number;
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  caption: string;
}> = ({ startFrame, title, icon, iconBg, value, caption }) => {
  const frame = useCurrentFrame();
  const e = enter(frame, startFrame);

  return (
    <Card style={{ opacity: e.opacity, transform: `translateY(${e.translateY}px)`, flex: 1 }}>
      <CardTitle>{title}</CardTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <IconTile bg={iconBg}>{icon}</IconTile>
        <div>
          <div style={{ fontSize: 30, fontWeight: 700, color: COLORS.textDark, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 5 }}>{caption}</div>
        </div>
      </div>
    </Card>
  );
};

const HeadcountCard: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const e = enter(frame, startFrame);
  const active = countUp(24, frame, startFrame + 6, 18, 0);

  return (
    <Card style={{ opacity: e.opacity, transform: `translateY(${e.translateY}px)`, flex: 1 }}>
      <CardTitle>Salariés BOETH</CardTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <IconTile>
          <Users size={22} color={COLORS.primary} />
        </IconTile>
        <div>
          <div style={{ fontSize: 30, fontWeight: 700, color: COLORS.textDark, lineHeight: 1 }}>{active}</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>actifs sur 31 enregistrés</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <div style={{ flex: 1, background: COLORS.bg, borderRadius: 10, padding: "9px 12px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textDark }}>26,8</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>UB BOETH</div>
        </div>
        <div style={{ flex: 1, background: COLORS.warningBg, borderRadius: 10, padding: "9px 12px" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.warning }}>4</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>Expirations à venir</div>
        </div>
      </div>
    </Card>
  );
};

const ReconnaissanceCard: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const e = enter(frame, startFrame);

  return (
    <Card style={{ opacity: e.opacity, transform: `translateY(${e.translateY}px)`, flex: 1 }}>
      <CardTitle>Types de reconnaissance</CardTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <MultiDonut segments={RECONNAISSANCE} startFrame={startFrame + 4} size={110} strokeWidth={14} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {RECONNAISSANCE.map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 9, height: 9, borderRadius: 3, background: r.color }} />
              <span style={{ fontSize: 13, color: COLORS.textDark }}>
                {r.label} <span style={{ color: COLORS.textMuted }}>({r.value})</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

const AlertsRow: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const e = enter(frame, startFrame);

  return (
    <Card style={{ opacity: e.opacity, transform: `translateY(${e.translateY}px)` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <CardTitle>Alertes prioritaires</CardTitle>
        <Badge variant="danger">3</Badge>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          "2 reconnaissances RQTH expirent dans moins de 30 jours",
          "Objectif de contribution AGEFIPH atteint à 82%",
        ].map((line) => (
          <div key={line} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={16} color={COLORS.warning} />
            <span style={{ fontSize: 14, color: COLORS.textDark }}>{line}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

const ProjectionRow: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const e = enter(frame, startFrame);
  const maxVal = 8;

  return (
    <Card style={{ opacity: e.opacity, transform: `translateY(${e.translateY}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <TrendingUp size={17} color={COLORS.primary} />
        <CardTitle>Projection fin d'année</CardTitle>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 80 }}>
        {MONTHS.map((m, i) => {
          const barStart = startFrame + 3 + i * 2;
          const h = interpolate(frame, [barStart, barStart + 12], [0, (MONTH_VALUES[i] / maxVal) * 80], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: "100%", height: 80, display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", height: h, background: COLORS.secondary, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 10, color: COLORS.textMuted }}>{m}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const DashboardScene: React.FC<{ hideProfile?: boolean }> = ({ hideProfile = false }) => {
  const frame = useCurrentFrame();
  const bannerE = enter(frame, 4);

  return (
    <>
    <AppShell
      active="dashboard"
      title="Tableau de bord"
      subtitle="Vue d'ensemble de votre conformité OETH"
      showProfile={!hideProfile}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
        <div
          style={{
            opacity: bannerE.opacity,
            transform: `translateY(${bannerE.translateY}px)`,
            background: COLORS.successBg,
            border: `1px solid ${COLORS.successBorder}`,
            borderRadius: 14,
            padding: "14px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle2 size={20} color={COLORS.success} />
            <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.textDark }}>
              Taux OETH conforme, objectif 6% atteint
            </span>
          </div>
          <Badge variant="success" style={{ fontSize: 14 }}>
            6,4% / 6%
          </Badge>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <GaugeCard startFrame={12} />
          <MiniKpiCard
            startFrame={20}
            title="Gap à combler"
            icon={<Target size={22} color={COLORS.success} />}
            iconBg={COLORS.successBg}
            value="0"
            caption="poste(s) restant pour l'objectif"
          />
          <MiniKpiCard
            startFrame={28}
            title="Contribution AGEFIPH"
            icon={<Landmark size={22} color={COLORS.success} />}
            iconBg={COLORS.successBg}
            value="0 €"
            caption="grâce à votre conformité"
          />
        </div>

        <div style={{ display: "flex", gap: 14, flex: 1 }}>
          <div style={{ flex: 2 }}>
            <ProjectionRow startFrame={40} />
          </div>
          <div style={{ flex: 1 }}>
            <AlertsRow startFrame={48} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, flex: 1 }}>
          <HeadcountCard startFrame={60} />
          <ReconnaissanceCard startFrame={68} />
        </div>
      </div>
    </AppShell>
    <Caption
      text="Toute votre conformité OETH en un coup d'œil"
      startFrame={96}
      sceneDurationInFrames={175}
    />
    </>
  );
};
