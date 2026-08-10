import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Users, Download, Upload, Plus } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Pill, Badge, IconTile } from "../components/ui";
import { Caption } from "../components/Caption";
import { COLORS } from "../theme";
import { countUp, enter } from "../utils";

type ContractType = "CDI" | "CDD" | "Alternant" | "Stagiaire";
type StatusType = "Actif" | "Expire bientôt";

const CONTRACT_VARIANT: Record<ContractType, "primary" | "warning" | "purple" | "neutral"> = {
  CDI: "primary",
  CDD: "warning",
  Alternant: "purple",
  Stagiaire: "neutral",
};

const STATUS_VARIANT: Record<StatusType, "success" | "warning"> = {
  Actif: "success",
  "Expire bientôt": "warning",
};

const EMPLOYEES: {
  name: string;
  contract: ContractType;
  service: string;
  poste: string;
  reconnaissance: string;
  status: StatusType;
}[] = [
  { name: "Julien Petit", contract: "CDI", service: "Production", poste: "Opérateur", reconnaissance: "RQTH", status: "Actif" },
  { name: "Sophie Bernard", contract: "CDD", service: "Ressources Humaines", poste: "Assistante", reconnaissance: "RQTH", status: "Actif" },
  { name: "Ahmed Belkacem", contract: "CDI", service: "Logistique", poste: "Cariste", reconnaissance: "Invalidité", status: "Expire bientôt" },
  { name: "Camille Girard", contract: "Alternant", service: "IT", poste: "Développeuse", reconnaissance: "RQTH", status: "Actif" },
  { name: "Karim Haddad", contract: "CDI", service: "Maintenance", poste: "Technicien", reconnaissance: "AAH", status: "Actif" },
  { name: "Laura Fontaine", contract: "Stagiaire", service: "Marketing", poste: "Assistante", reconnaissance: "RQTH", status: "Actif" },
];

const COLS = ["Collaborateur", "Contrat", "Service / Poste", "Reconnaissance", "Statut"];

const ToolbarButton: React.FC<{
  children: React.ReactNode;
  primary?: boolean;
}> = ({ children, primary }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 16px",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      background: primary ? COLORS.primary : COLORS.white,
      color: primary ? COLORS.white : COLORS.textDark,
      border: `1px solid ${primary ? COLORS.primary : COLORS.border}`,
    }}
  >
    {children}
  </div>
);

export const EmployeesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const headerE = enter(frame, 4);
  const pillsE = enter(frame, 12);
  const tableE = enter(frame, 20);
  const count = countUp(31, frame, 4, 18, 0);

  return (
    <>
    <AppShell active="rqth" title="Salariés RQTH" subtitle="Gestion des collaborateurs en situation de handicap">
      <div style={{ display: "flex", flexDirection: "column", gap: 18, height: "100%" }}>
        <div
          style={{
            opacity: headerE.opacity,
            transform: `translateY(${headerE.translateY}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <IconTile>
              <Users size={20} color={COLORS.primary} />
            </IconTile>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textDark }}>
              {count} salarié(s) enregistré(s)
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <ToolbarButton>
              <Download size={15} /> Excel
            </ToolbarButton>
            <ToolbarButton>
              <Upload size={15} /> Importer CSV
            </ToolbarButton>
            <ToolbarButton primary>
              <Plus size={15} /> Ajouter un salarié
            </ToolbarButton>
          </div>
        </div>

        <div
          style={{
            opacity: pillsE.opacity,
            transform: `translateY(${pillsE.translateY}px)`,
            display: "flex",
            gap: 10,
          }}
        >
          <Pill active>Présents (28)</Pill>
          <Pill>Archivés (partis) (3)</Pill>
          <Pill>Tous (31)</Pill>
        </div>

        <div
          style={{
            opacity: tableE.opacity,
            background: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 14,
            padding: 22,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1fr 1.6fr 1.2fr 1.2fr",
              padding: "0 8px 12px",
              borderBottom: `1px solid ${COLORS.border}`,
              fontSize: 12,
              fontWeight: 700,
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {COLS.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>

          {EMPLOYEES.map((emp, i) => {
            const rowStart = 28 + i * 7;
            const rOpacity = interpolate(frame, [rowStart, rowStart + 10], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const rX = interpolate(frame, [rowStart, rowStart + 10], [-24, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={emp.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1fr 1.6fr 1.2fr 1.2fr",
                  alignItems: "center",
                  padding: "14px 8px",
                  borderBottom: `1px solid ${COLORS.border}`,
                  opacity: rOpacity,
                  transform: `translateX(${rX}px)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: COLORS.accentBg,
                      color: COLORS.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {emp.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDark }}>
                    {emp.name}
                  </span>
                </div>
                <div>
                  <Badge variant={CONTRACT_VARIANT[emp.contract]}>{emp.contract}</Badge>
                </div>
                <div style={{ fontSize: 14, color: COLORS.textDark }}>
                  {emp.service} <span style={{ color: COLORS.textMuted }}>/ {emp.poste}</span>
                </div>
                <div style={{ fontSize: 14, color: COLORS.textDark }}>{emp.reconnaissance}</div>
                <div>
                  <Badge variant={STATUS_VARIANT[emp.status]}>{emp.status}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
    <Caption
      text="Tous vos collaborateurs RQTH centralisés"
      startFrame={74}
      sceneDurationInFrames={155}
    />
    </>
  );
};
