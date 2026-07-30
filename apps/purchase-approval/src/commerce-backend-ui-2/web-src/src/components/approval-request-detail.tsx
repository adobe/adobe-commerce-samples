import { Button } from "@react-spectrum/s2/Button";
import { Content } from "@react-spectrum/s2/Content";
import { Heading } from "@react-spectrum/s2/Heading";
import { InlineAlert } from "@react-spectrum/s2/InlineAlert";
import { ProgressCircle } from "@react-spectrum/s2/ProgressCircle";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import { Text } from "@react-spectrum/s2/Text";
import { TextField } from "@react-spectrum/s2/TextField";
import { useCallback, useEffect, useState } from "react";

import { formatDate, formatMoney } from "../lib/format.ts";
import {
  type ApprovalRequest,
  useApprovalApi,
} from "../hooks/use-approval-api.ts";

export interface ApprovalRequestDetailProps {
  id: string;
  onBack: () => void;
  onResolved: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={style({ display: "flex", gap: 8 })}>
      <Text>
        <strong>{label}:</strong> {value}
      </Text>
    </div>
  );
}

export function ApprovalRequestDetail({
  id,
  onBack,
  onResolved,
}: ApprovalRequestDetailProps) {
  const { fetchApprovalRequestDetail, approveRequest, rejectRequest } =
    useApprovalApi();

  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [comment, setComment] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchApprovalRequestDetail(id);
        if (!cancelled) {
          setRequest(data);
        }
      } catch (error) {
        console.error("Error fetching approval request:", error);
        if (!cancelled) {
          setRequest(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchApprovalRequestDetail, id]);

  const submitDecision = useCallback(
    async (
      action: "approve" | "reject",
      decide: (id: string, params: { comment?: string }) => Promise<unknown>,
    ) => {
      setSubmittingAction(action);
      setActionError(null);
      try {
        await decide(id, { comment: comment || undefined });
        onResolved();
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : "The action failed.",
        );
      } finally {
        setSubmittingAction(null);
      }
    },
    [comment, id, onResolved],
  );

  const handleApprove = useCallback(
    () => submitDecision("approve", approveRequest),
    [submitDecision, approveRequest],
  );

  const handleReject = useCallback(
    () => submitDecision("reject", rejectRequest),
    [submitDecision, rejectRequest],
  );

  if (loading) {
    return (
      <div
        className={style({
          display: "flex",
          justifyContent: "center",
          marginTop: 32,
        })}>
        <ProgressCircle aria-label="Loading…" isIndeterminate size="L" />
      </div>
    );
  }

  if (!request) {
    return (
      <main
        className={style({
          display: "flex",
          flexDirection: "column",
          gap: 16,
        })}>
        <Button fillStyle="outline" onPress={onBack} variant="secondary">
          Back
        </Button>
        <Text>Request not found.</Text>
      </main>
    );
  }

  const isPending = request.status === "pending";

  return (
    <main
      className={style({ display: "flex", flexDirection: "column", gap: 16 })}>
      <div>
        <Button fillStyle="outline" onPress={onBack} variant="secondary">
          Back
        </Button>
      </div>

      <Heading level={1}>
        {`Order #${request.incrementId || request.orderId || "—"}`}
      </Heading>

      <div
        className={style({ display: "flex", flexDirection: "column", gap: 8 })}>
        <DetailRow
          label="Customer"
          value={request.customerName || request.customerEmail || "—"}
        />
        <DetailRow
          label="Amount"
          value={formatMoney(request.grandTotal, request.currency)}
        />
        <DetailRow label="Store" value={request.storeName || "—"} />
        <DetailRow label="Status" value={request.status} />
        <DetailRow label="Created" value={formatDate(request.createdAt)} />
        {request.updatedAt && (
          <DetailRow label="Updated" value={formatDate(request.updatedAt)} />
        )}
        {request.comment && (
          <DetailRow label="Comment" value={request.comment} />
        )}
      </div>

      {isPending && (
        <div
          className={style({
            display: "flex",
            flexDirection: "column",
            gap: 16,
          })}>
          <TextField
            label="Comment (optional)"
            onChange={setComment}
            value={comment}
          />

          {actionError && (
            <InlineAlert variant="negative">
              <Heading>Action failed</Heading>
              <Content>{actionError}</Content>
            </InlineAlert>
          )}

          <div className={style({ display: "flex", gap: 16 })}>
            <Button
              isDisabled={submittingAction === "reject"}
              isPending={submittingAction === "approve"}
              onPress={handleApprove}
              variant="accent">
              Approve
            </Button>
            <Button
              isDisabled={submittingAction === "approve"}
              isPending={submittingAction === "reject"}
              onPress={handleReject}
              variant="negative">
              Reject
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
