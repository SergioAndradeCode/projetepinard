import React from "react";
import { AbsoluteFill, Audio, Sequence, Series, interpolate, staticFile } from "remotion";
import { LoginScene } from "../scenes/LoginScene";
import { DashboardScene } from "../scenes/DashboardScene";
import { EmployeesScene } from "../scenes/EmployeesScene";
import { BudgetScene } from "../scenes/BudgetScene";
import { DoethScene } from "../scenes/DoethScene";
import { CollaborationScene } from "../scenes/CollaborationScene";
import { ClosingScene } from "../scenes/ClosingScene";
import { SceneFade } from "../components/SceneFade";
import { Watermark } from "../components/Watermark";
import { COLORS } from "../theme";

export const LOGIN_DURATION = 115;
export const DASHBOARD_DURATION = 175;
export const EMPLOYEES_DURATION = 155;
export const BUDGET_DURATION = 185;
export const DOETH_DURATION = 220;
export const COLLAB_DURATION = 165;
export const CLOSING_DURATION = 140;

export const MUSIC_DURATION = 1080;

export const TOTAL_DURATION =
  LOGIN_DURATION +
  DASHBOARD_DURATION +
  EMPLOYEES_DURATION +
  BUDGET_DURATION +
  DOETH_DURATION +
  COLLAB_DURATION +
  CLOSING_DURATION;

const WATERMARK_DURATION =
  DASHBOARD_DURATION + EMPLOYEES_DURATION + BUDGET_DURATION + DOETH_DURATION + COLLAB_DURATION;

export const Main: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.bg }}>
    <Series>
      <Series.Sequence durationInFrames={LOGIN_DURATION}>
        <SceneFade durationInFrames={LOGIN_DURATION}>
          <LoginScene />
        </SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={DASHBOARD_DURATION}>
        <SceneFade durationInFrames={DASHBOARD_DURATION}>
          <DashboardScene />
        </SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={EMPLOYEES_DURATION}>
        <SceneFade durationInFrames={EMPLOYEES_DURATION}>
          <EmployeesScene />
        </SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={BUDGET_DURATION}>
        <SceneFade durationInFrames={BUDGET_DURATION}>
          <BudgetScene />
        </SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={DOETH_DURATION}>
        <SceneFade durationInFrames={DOETH_DURATION}>
          <DoethScene />
        </SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={COLLAB_DURATION}>
        <SceneFade durationInFrames={COLLAB_DURATION}>
          <CollaborationScene />
        </SceneFade>
      </Series.Sequence>
      <Series.Sequence durationInFrames={CLOSING_DURATION}>
        <SceneFade durationInFrames={CLOSING_DURATION}>
          <ClosingScene />
        </SceneFade>
      </Series.Sequence>
    </Series>

    <Sequence from={LOGIN_DURATION} durationInFrames={WATERMARK_DURATION}>
      <Watermark />
    </Sequence>

    <Sequence from={0} durationInFrames={MUSIC_DURATION}>
      <Audio
        src={staticFile("audio/luxe.mp3")}
        volume={(f) =>
          interpolate(f, [0, 25, MUSIC_DURATION - 40, MUSIC_DURATION], [0, 0.7, 0.7, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </Sequence>
  </AbsoluteFill>
);
