import { Divider } from "@react-spectrum/s2/Divider";
import { Heading } from "@react-spectrum/s2/Heading";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import { Text } from "@react-spectrum/s2/Text";
import { ToggleButton } from "@react-spectrum/s2/ToggleButton";
import { useCallback } from "react";

import type { DashboardView } from "../pages/approval-dashboard-page.tsx";

export interface SideNavProps {
  currentView: DashboardView;
  onNavigate: (view: DashboardView) => void;
}

export function SideNav({ currentView, onNavigate }: SideNavProps) {
  const handleApprovalsPress = useCallback(
    () => onNavigate("approvals"),
    [onNavigate],
  );
  const handleLogPress = useCallback(() => onNavigate("log"), [onNavigate]);

  return (
    <nav
      className={style({
        display: "flex",
        flexDirection: "column",
        height: "full",
      })}>
      <div className={style({ padding: 16 })}>
        <Heading level={3}>Purchase Approval</Heading>
      </div>

      <Divider size="S" />

      <div
        className={style({
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          gap: 8,
          padding: 16,
        })}>
        <ToggleButton
          isEmphasized
          isQuiet
          isSelected={currentView === "approvals"}
          onPress={handleApprovalsPress}>
          Approval requests
        </ToggleButton>
        <ToggleButton
          isEmphasized
          isQuiet
          isSelected={currentView === "log"}
          onPress={handleLogPress}>
          Execution log
        </ToggleButton>
      </div>

      <div className={style({ padding: 16 })}>
        <Text>B2B Purchase Approval</Text>
      </div>
    </nav>
  );
}
