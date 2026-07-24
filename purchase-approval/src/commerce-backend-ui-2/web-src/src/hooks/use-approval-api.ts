import { useIms } from "@adobe/aio-commerce-lib-admin-ui/web";
import { useCallback, useMemo } from "react";

import { useConfig } from "./use-config.ts";

const PACKAGE = "PurchaseApprovalUi";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: string;
  orderId?: string;
  incrementId?: string;
  customerName?: string;
  customerEmail?: string;
  grandTotal?: number | string;
  currency?: string;
  storeName?: string;
  status: ApprovalStatus;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExecutionLogEntry {
  id?: string;
  timestamp: string;
  source: string;
  orderId?: string;
  result?: string;
  status: string;
  message?: string;
}

// Kept as `type` (not `interface`): passed directly as the `payload: Record<string, unknown>`
// argument to `invoke()` below, and only a type alias structurally satisfies an index
// signature — an interface never does, even with identical members.
// biome-ignore lint/style/useConsistentTypeDefinitions: see comment above
export type ApprovalListFilters = { status?: string };
// biome-ignore lint/style/useConsistentTypeDefinitions: see comment above
export type ExecutionLogFilters = { source?: string; status?: string };
export interface DecisionParams {
  comment?: string;
}

/**
 * Calls this extension's Purchase Approval web actions, authenticated with the logged-in admin's
 * IMS credentials (from `useIms()`) — no bundled runtime credentials. Each action is a
 * `require-adobe-auth` web action, so the platform returns its JSON body directly.
 */
export function useApprovalApi() {
  const { imsOrgId, imsToken } = useIms();
  const { getActionUrl } = useConfig();

  const invoke = useCallback(
    async (
      action: string,
      payload: Record<string, unknown> = {},
    ): Promise<unknown> => {
      const actionUrl = getActionUrl(`${PACKAGE}/${action}`);

      const response = await fetch(actionUrl, {
        body: JSON.stringify(payload),
        headers: {
          authorization: `Bearer ${imsToken}`,
          "Content-Type": "application/json",
          "x-gw-ims-org-id": imsOrgId,
        },
        method: "POST",
      });

      if (!response.ok) {
        const { error } = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          error || `Request failed with status ${response.status}`,
        );
      }

      return response.json();
    },
    [getActionUrl, imsOrgId, imsToken],
  );

  return useMemo(
    () => ({
      fetchApprovalRequests: (filters: ApprovalListFilters = {}) =>
        invoke("approval-requests-list", filters) as Promise<ApprovalRequest[]>,
      fetchApprovalRequestDetail: (id: string) =>
        invoke("approval-request-detail", { id }) as Promise<ApprovalRequest>,
      approveRequest: (id: string, params: DecisionParams = {}) =>
        invoke("approve", { id, ...params }) as Promise<ApprovalRequest>,
      rejectRequest: (id: string, params: DecisionParams = {}) =>
        invoke("reject", { id, ...params }) as Promise<ApprovalRequest>,
      fetchExecutionLog: (filters: ExecutionLogFilters = {}) =>
        invoke("execution-log-api", filters) as Promise<ExecutionLogEntry[]>,
    }),
    [invoke],
  );
}
