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

import { formatDate, formatMoney } from "../lib/format.ts";
import {
  type ApprovalRequest,
  type ApprovalStatus,
  useApprovalApi,
} from "../hooks/use-approval-api.ts";

import type { Key } from "react-aria-components";

const STATUS_VARIANTS: Record<
  ApprovalStatus,
  "neutral" | "positive" | "negative"
> = {
  approved: "positive",
  pending: "neutral",
  rejected: "negative",
};

const ALL = "all";

export interface ApprovalRequestListProps {
  onSelect: (id: string) => void;
}

export function ApprovalRequestList({ onSelect }: ApprovalRequestListProps) {
  const { fetchApprovalRequests } = useApprovalApi();
  const [list, setList] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApprovalRequests(
        statusFilter === ALL ? {} : { status: statusFilter },
      );
      setList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching approval requests:", error);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [fetchApprovalRequests, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = useCallback((key: Key | null) => {
    setStatusFilter(String(key));
  }, []);

  const handleRowAction = useCallback(
    (key: Key) => onSelect(String(key)),
    [onSelect],
  );

  const renderEmptyState = useCallback(
    () => (
      <IllustratedMessage>
        <Content>No approval requests found.</Content>
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
        <Heading level={1}>Approval requests</Heading>
        <ActionButton isDisabled={loading} onPress={load}>
          <Refresh />
        </ActionButton>
      </div>

      <div className={style({ display: "flex", marginBottom: 16 })}>
        <Picker
          label="Status"
          onSelectionChange={handleStatusChange}
          selectedKey={statusFilter}>
          <PickerItem id={ALL}>All</PickerItem>
          <PickerItem id="pending">Pending</PickerItem>
          <PickerItem id="approved">Approved</PickerItem>
          <PickerItem id="rejected">Rejected</PickerItem>
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
          aria-label="Approval requests"
          onAction={handleRowAction}
          selectionMode="none"
          UNSAFE_style={{ minHeight: 400, width: "100%" }}>
          <TableHeader>
            <Column isRowHeader>Order</Column>
            <Column>Customer</Column>
            <Column>Amount</Column>
            <Column>Status</Column>
            <Column>Created</Column>
          </TableHeader>
          <TableBody items={list} renderEmptyState={renderEmptyState}>
            {(row) => (
              <Row id={row.id} key={row.id}>
                <Cell>{`#${row.incrementId || row.orderId || "—"}`}</Cell>
                <Cell>{row.customerName || row.customerEmail || "—"}</Cell>
                <Cell>{formatMoney(row.grandTotal, row.currency)}</Cell>
                <Cell>
                  <StatusLight
                    size="S"
                    variant={STATUS_VARIANTS[row.status] || "neutral"}>
                    {row.status}
                  </StatusLight>
                </Cell>
                <Cell>{formatDate(row.createdAt)}</Cell>
              </Row>
            )}
          </TableBody>
        </TableView>
      )}
    </main>
  );
}
