import { ActionButton } from "@react-spectrum/s2/ActionButton";
import { Content } from "@react-spectrum/s2/Content";
import { Heading } from "@react-spectrum/s2/Heading";
import { IllustratedMessage } from "@react-spectrum/s2/IllustratedMessage";
import { Picker, PickerItem } from "@react-spectrum/s2/Picker";
import { ProgressCircle } from "@react-spectrum/s2/ProgressCircle";
import { StatusLight } from "@react-spectrum/s2/StatusLight";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import {
  Cell,
  Column,
  Row,
  TableBody,
  TableHeader,
  TableView,
} from "@react-spectrum/s2/TableView";
import Refresh from "@react-spectrum/s2/icons/Refresh";
import { useCallback, useEffect, useState } from "react";

import { formatDate } from "../lib/format.ts";
import {
  type ExecutionLogEntry,
  useApprovalApi,
} from "../hooks/use-approval-api.ts";

import type { Key } from "react-aria-components";

const STATUS_VARIANTS: Record<string, "positive" | "negative" | "neutral"> = {
  error: "negative",
  success: "positive",
};

const SOURCE_LABELS: Record<string, string> = {
  event: "Order event",
  webhook: "Checkout webhook",
};

const ALL = "all";

export function ExecutionLog() {
  const { fetchExecutionLog } = useApprovalApi();
  const [log, setLog] = useState<ExecutionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchExecutionLog({
        ...(sourceFilter === ALL ? {} : { source: sourceFilter }),
        ...(statusFilter === ALL ? {} : { status: statusFilter }),
      });
      setLog(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching execution log:", error);
      setLog([]);
    } finally {
      setLoading(false);
    }
  }, [fetchExecutionLog, sourceFilter, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSourceChange = useCallback((key: Key | null) => {
    setSourceFilter(String(key));
  }, []);

  const handleStatusChange = useCallback((key: Key | null) => {
    setStatusFilter(String(key));
  }, []);

  const renderEmptyState = useCallback(
    () => (
      <IllustratedMessage>
        <Content>No execution log entries yet.</Content>
      </IllustratedMessage>
    ),
    [],
  );

  return (
    <main className={style({ display: "flex", flexDirection: "column" })}>
      <div
        className={style({
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
        })}>
        <Heading level={1}>Execution log</Heading>
        <ActionButton isDisabled={loading} onPress={load}>
          <Refresh />
        </ActionButton>
      </div>

      <div className={style({ display: "flex", gap: 16, marginBottom: 16 })}>
        <Picker
          label="Source"
          onSelectionChange={handleSourceChange}
          selectedKey={sourceFilter}>
          <PickerItem id={ALL}>All</PickerItem>
          <PickerItem id="webhook">Webhook</PickerItem>
          <PickerItem id="event">Event</PickerItem>
        </Picker>
        <Picker
          label="Status"
          onSelectionChange={handleStatusChange}
          selectedKey={statusFilter}>
          <PickerItem id={ALL}>All</PickerItem>
          <PickerItem id="success">Success</PickerItem>
          <PickerItem id="error">Error</PickerItem>
        </Picker>
      </div>

      {loading ? (
        <div
          className={style({
            display: "flex",
            justifyContent: "center",
            marginTop: 32,
          })}>
          <ProgressCircle aria-label="Loading…" isIndeterminate size="L" />
        </div>
      ) : (
        <TableView
          aria-label="Execution log"
          selectionMode="none"
          UNSAFE_style={{ minHeight: 400, width: "100%" }}>
          <TableHeader>
            <Column isRowHeader>Time</Column>
            <Column>Source</Column>
            <Column>Order</Column>
            <Column>Result</Column>
            <Column>Status</Column>
            <Column>Message</Column>
          </TableHeader>
          <TableBody items={log} renderEmptyState={renderEmptyState}>
            {(entry) => (
              <Row
                id={entry.id || `${entry.timestamp}-${entry.orderId ?? ""}`}
                key={entry.id || `${entry.timestamp}-${entry.orderId ?? ""}`}>
                <Cell>{formatDate(entry.timestamp)}</Cell>
                <Cell>{SOURCE_LABELS[entry.source] || entry.source}</Cell>
                <Cell>{entry.orderId || "—"}</Cell>
                <Cell>{entry.result || "—"}</Cell>
                <Cell>
                  <StatusLight
                    size="S"
                    variant={STATUS_VARIANTS[entry.status] || "neutral"}>
                    {entry.status}
                  </StatusLight>
                </Cell>
                <Cell>{entry.message || "—"}</Cell>
              </Row>
            )}
          </TableBody>
        </TableView>
      )}
    </main>
  );
}
