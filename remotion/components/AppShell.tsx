import React from "react";
import { Img, staticFile } from "remotion";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Wallet,
  BookOpen,
  FileCheck,
  UserCog,
  Settings,
  CreditCard,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { COLORS, FONT, SIDEBAR_WIDTH } from "../theme";

export const NAV_ITEMS = [
  { id: "dashboard", label: "Tableau de bord", Icon: LayoutDashboard },
  { id: "rqth", label: "Salariés RQTH", Icon: Users },
  { id: "achats", label: "Achats ESAT / EA", Icon: Building2 },
  { id: "calendrier", label: "Calendrier", Icon: Calendar },
  { id: "budget", label: "Budget", Icon: Wallet },
  { id: "guide", label: "Guide OETH", Icon: BookOpen },
];

export const ADMIN_NAV_ITEMS = [
  { id: "doeth", label: "Assistant DOETH", Icon: FileCheck },
  { id: "equipe", label: "Équipe", Icon: UserCog },
  { id: "parametres", label: "Paramètres", Icon: Settings },
  { id: "abonnement", label: "Abonnement", Icon: CreditCard },
];

const NavRow: React.FC<{
  label: string;
  Icon: LucideIcon;
  active?: boolean;
}> = ({ label, Icon, active }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "11px 16px",
      borderRadius: 10,
      background: active ? COLORS.accentBg : "transparent",
      color: active ? COLORS.primary : COLORS.textMuted,
      fontSize: 15,
      fontWeight: active ? 600 : 500,
    }}
  >
    <Icon size={19} strokeWidth={2} color={active ? COLORS.primary : COLORS.textMuted} />
    {label}
  </div>
);

export const Sidebar: React.FC<{ active: string; showProfile?: boolean }> = ({
  active,
  showProfile = true,
}) => (
  <div
    style={{
      width: SIDEBAR_WIDTH,
      height: "100%",
      background: COLORS.white,
      borderRight: `1px solid ${COLORS.border}`,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "24px 22px 18px" }}>
      <Img src={staticFile("talenth-mark.png")} style={{ width: 30, height: 30 }} />
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.primary, lineHeight: 1.1 }}>
          Talenth
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>Talenth Industries</div>
      </div>
    </div>

    <div style={{ padding: "6px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
      {NAV_ITEMS.map((item) => (
        <NavRow key={item.id} label={item.label} Icon={item.Icon} active={item.id === active} />
      ))}
    </div>

    <div
      style={{
        marginTop: 18,
        padding: "0 22px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.6,
        color: "#9CA3AF",
        textTransform: "uppercase",
      }}
    >
      Administration
    </div>
    <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 3 }}>
      {ADMIN_NAV_ITEMS.map((item) => (
        <NavRow key={item.id} label={item.label} Icon={item.Icon} active={item.id === active} />
      ))}
    </div>

    <div style={{ flex: 1 }} />

    {showProfile && (
      <div
        style={{
          margin: 16,
          padding: 14,
          borderRadius: 12,
          background: COLORS.bg,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: COLORS.accentBg,
            color: COLORS.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          SD
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textDark }}>Sergio De Andrade</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>Référent(e) Handicap</div>
        </div>
        <LogOut size={17} color={COLORS.textMuted} />
      </div>
    )}
  </div>
);

export const HeaderBar: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => (
  <div
    style={{
      padding: "24px 40px",
      borderBottom: `1px solid ${COLORS.border}`,
      background: "rgba(248, 250, 252, 0.95)",
    }}
  >
    <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.textDark }}>{title}</div>
    <div style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 3 }}>{subtitle}</div>
  </div>
);

export const AppShell: React.FC<{
  active: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showProfile?: boolean;
}> = ({ active, title, subtitle, children, showProfile = true }) => (
  <div style={{ display: "flex", width: "100%", height: "100%", background: COLORS.bg, fontFamily: FONT }}>
    <Sidebar active={active} showProfile={showProfile} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <HeaderBar title={title} subtitle={subtitle} />
      <div style={{ flex: 1, padding: "28px 40px", overflow: "hidden" }}>{children}</div>
    </div>
  </div>
);
