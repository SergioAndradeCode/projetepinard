import React from "react";
import { useCurrentFrame } from "remotion";
import { Crown, UserCog, Briefcase, Eye, Link as LinkIcon, Copy, UserPlus } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { Card, CardTitle, InitialsAvatar } from "../components/ui";
import { Caption } from "../components/Caption";
import { COLORS } from "../theme";
import { enter } from "../utils";

const ROLES = [
  { label: "Admin", count: 2, Icon: Crown, color: COLORS.primary, bg: COLORS.accentBg },
  { label: "Référent(e) Handicap", count: 3, Icon: UserCog, color: COLORS.success, bg: COLORS.successBg },
  { label: "Chargé(e) de Mission", count: 4, Icon: Briefcase, color: COLORS.purple, bg: "#F3E8FF" },
  { label: "Lecteur", count: 6, Icon: Eye, color: COLORS.textMuted, bg: "#F1F5F9" },
];

const MEMBERS = [
  { initials: "SD", name: "Sergio De Andrade", role: "Référent(e) Handicap", color: COLORS.primary, bg: COLORS.accentBg },
  { initials: "AB", name: "Ahmed Belkacem", role: "Chargé(e) de Mission", color: COLORS.purple, bg: "#F3E8FF" },
  { initials: "SL", name: "Sophie Lambert", role: "Admin", color: COLORS.success, bg: COLORS.successBg },
];

export const CollaborationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const inviteE = enter(frame, 4);
  const onlineE = enter(frame, 10);
  const headerE = enter(frame, 20);

  return (
    <>
    <AppShell active="equipe" title="Équipe" subtitle="Gérez les accès de votre organisation">
      <div style={{ height: "100%" }}>
        <div
          style={{
            opacity: onlineE.opacity,
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex" }}>
              {MEMBERS.map((m, i) => (
                <div key={m.initials} style={{ marginLeft: i === 0 ? 0 : -12 }}>
                  <InitialsAvatar initials={m.initials} color={m.color} bg={m.bg} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.textMuted, fontWeight: 600 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.success }} />
              3 personnes en ligne
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card
            style={{
              opacity: inviteE.opacity,
              transform: `translateY(${inviteE.translateY}px)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: COLORS.accentBg,
              border: `1px solid rgba(30,74,140,0.16)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <LinkIcon size={18} color={COLORS.primary} />
              <span style={{ fontSize: 14, color: COLORS.primary, fontFamily: "monospace" }}>
                talenth.fr/join/tal-industries-8f2c
              </span>
              <Copy size={15} color={COLORS.primary} />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: COLORS.primary,
                color: COLORS.white,
                borderRadius: 10,
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <UserPlus size={15} /> Ajouter un accès
            </div>
          </Card>

          <div
            style={{
              opacity: headerE.opacity,
              transform: `translateY(${headerE.translateY}px)`,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {ROLES.map((role, i) => {
                const startFrame = 26 + i * 6;
                const e = enter(frame, startFrame);
                return (
                  <Card
                    key={role.label}
                    style={{ opacity: e.opacity, transform: `translateY(${e.translateY}px)` }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: role.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 12,
                      }}
                    >
                      <role.Icon size={19} color={role.color} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDark }}>{role.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: role.color, marginTop: 4 }}>
                      {role.count}
                    </div>
                  </Card>
                );
              })}
            </div>

            <CardTitle>Membres de l'organisation</CardTitle>
            <Card>
              {MEMBERS.map((member, i) => {
                const startFrame = 50 + i * 6;
                const e = enter(frame, startFrame);
                return (
                  <div
                    key={member.name}
                    style={{
                      opacity: e.opacity,
                      transform: `translateY(${e.translateY}px)`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: i < MEMBERS.length - 1 ? `1px solid ${COLORS.border}` : "none",
                    }}
                  >
                    <InitialsAvatar initials={member.initials} color={member.color} bg={member.bg} size={34} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDark }}>{member.name}</div>
                    <div style={{ fontSize: 13, color: COLORS.textMuted }}>{member.role}</div>
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
    <Caption
      text="Invitez votre équipe et travaillez sur votre SIRH en simultané, sans soucis"
      startFrame={70}
      sceneDurationInFrames={165}
    />
    </>
  );
};
