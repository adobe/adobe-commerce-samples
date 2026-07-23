import { Divider } from "@react-spectrum/s2/Divider";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import { useCallback, useState } from "react";

import { ApprovalRequestDetail } from "../components/approval-request-detail.tsx";
import { ApprovalRequestList } from "../components/approval-request-list.tsx";
import { ExecutionLog } from "../components/execution-log.tsx";
import { SideNav } from "../components/side-nav.tsx";

export type DashboardView = "approvals" | "log";

export function ApprovalDashboardPage() {
  const [currentView, setCurrentView] = useState<DashboardView>("approvals");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleNavigate = useCallback((view: DashboardView) => {
    setSelectedId(null);
    setCurrentView(view);
  }, []);

  const handleDeselect = useCallback(() => setSelectedId(null), []);

  return (
    <div className={style({ display: "flex", height: "screen" })}>
      <div className={style({ flexShrink: 0, width: 240 })}>
        <SideNav currentView={currentView} onNavigate={handleNavigate} />
      </div>

      <Divider orientation="vertical" size="S" />

      <div
        className={style({
          flexGrow: 1,
          overflowY: "auto",
          padding: 24,
        })}>
        {currentView === "approvals" && !selectedId && (
          <ApprovalRequestList onSelect={setSelectedId} />
        )}
        {currentView === "approvals" && selectedId && (
          <ApprovalRequestDetail
            id={selectedId}
            onBack={handleDeselect}
            onResolved={handleDeselect}
          />
        )}
        {currentView === "log" && <ExecutionLog />}
      </div>
    </div>
  );
}
