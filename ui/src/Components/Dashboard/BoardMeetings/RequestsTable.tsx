import React, { useCallback, useEffect, useState } from "react";
import Loader from "@/Components/Loader/Loader";
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import { useToast } from "@/Providers/ToastContext";
import {
    adminApproveRequest,
    adminDeclineRequest,
    adminListMeetings,
    adminListRequests,
    adminResendInvitation,
    apiErrorMessage,
    RequestActionResult,
} from "@/api/boardMeetings";
import {
    REQUEST_STATUS_LABELS,
    type AdminBoardMeetingDto,
    type BoardMeetingRequestDto,
    type BoardMeetingRequestStatus,
    type NotificationOutcomeDto,
} from "../../../../../src/types/boardMeeting.types";
import { formatDay, formatTimestamp } from "./format";

type StatusFilter = BoardMeetingRequestStatus | "all";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "declined", label: "Declined" },
    { value: "all", label: "All" },
];

const EMAILS: { key: keyof BoardMeetingRequestDto["notifications"]; short: string; label: string }[] = [
    { key: "leadership", short: "L", label: "Leadership notification" },
    { key: "receipt", short: "R", label: "Receipt to member" },
    { key: "invitation", short: "I", label: "Invitation" },
];

const EmailStatus = ({ label, short, outcome }: { label: string; short: string; outcome: NotificationOutcomeDto }) => (
    <span
        className={`email-status email-status--${outcome.status}`}
        title={`${label}: ${outcome.status.replace("_", " ")}${outcome.attemptedAt ? ` (${formatTimestamp(outcome.attemptedAt)})` : ""}`}
    >
        {short}
    </span>
);

const canResend = (request: BoardMeetingRequestDto) =>
    request.status === "approved" && request.notifications.invitation.status !== "sent";

interface RequestsTableProps {
    /** Called after any decision, so the parent can refresh its pending-requests badge. */
    onChanged?: () => void;
}

const RequestsTable: React.FC<RequestsTableProps> = ({ onChanged }) => {
    const [status, setStatus] = useState<StatusFilter>("pending");
    const [meetingId, setMeetingId] = useState("");
    const [meetings, setMeetings] = useState<AdminBoardMeetingDto[]>([]);
    const [requests, setRequests] = useState<BoardMeetingRequestDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const { confirm } = useConfirm();
    const { show } = useToast();

    useEffect(() => {
        adminListMeetings()
            .then(setMeetings)
            .catch((error) => console.error("Failed to fetch meetings for the filter", error));
    }, []);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setFailed(false);
            setRequests(await adminListRequests({
                status: status === "all" ? undefined : status,
                meetingId: meetingId || undefined,
            }));
        } catch (error) {
            console.error("Failed to fetch board meeting requests", error);
            setFailed(true);
        } finally {
            setLoading(false);
        }
    }, [status, meetingId]);

    useEffect(() => {
        load();
    }, [load]);

    const runAction = async (
        request: BoardMeetingRequestDto,
        confirmOptions: { title: string; message: string; confirmText: string } | null,
        action: (id: string) => Promise<RequestActionResult>
    ) => {
        if (confirmOptions && !(await confirm({ ...confirmOptions, cancelText: "Cancel" }))) return;

        setBusyId(request.id);
        try {
            const { message } = await action(request.id);
            show({ type: /failed/i.test(message) ? "warning" : "success", message });
        } catch (error) {
            show({ type: "error", message: apiErrorMessage(error, "The action failed. Please try again.") });
        } finally {
            setBusyId(null);
            load();
            onChanged?.();
        }
    };

    const approve = (request: BoardMeetingRequestDto) =>
        runAction(request, {
            title: "Approve request",
            message: `Approve ${request.requester.name} for “${request.meeting?.title ?? "this meeting"}”? An invitation email will be sent.`,
            confirmText: "Approve",
        }, adminApproveRequest);

    const decline = (request: BoardMeetingRequestDto) =>
        runAction(request, {
            title: "Decline request",
            message: `Decline ${request.requester.name}'s request? No email is sent.`,
            confirmText: "Decline",
        }, adminDeclineRequest);

    const resend = (request: BoardMeetingRequestDto) => runAction(request, null, adminResendInvitation);

    return (
        <section className="bm-card">
            <div className="bm-card__header">
                <h4>Requests</h4>
                <div className="bm-filters">
                    <select
                        className="form-select form-select-sm"
                        aria-label="Filter by status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as StatusFilter)}
                    >
                        {STATUS_FILTERS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <select
                        className="form-select form-select-sm"
                        aria-label="Filter by meeting"
                        value={meetingId}
                        onChange={(e) => setMeetingId(e.target.value)}
                    >
                        <option value="">All meetings</option>
                        {meetings.map((meeting) => (
                            <option key={meeting.id} value={meeting.id}>
                                {formatDay(meeting.date)} · {meeting.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : failed ? (
                <p className="bm-empty">
                    Could not load requests.
                    <button type="button" className="bm-action ms-2" onClick={load}>Retry</button>
                </p>
            ) : requests.length === 0 ? (
                <p className="bm-empty">No requests match the filters.</p>
            ) : (
                <div className="bm-table-wrap">
                    <table className="bm-table">
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Requester</th>
                                <th>Meeting</th>
                                <th>Requested on</th>
                                <th>Status</th>
                                <th>Emails</th>
                                <th aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => (
                                <tr key={request.id}>
                                    <td className="bm-ref">{request.reference}</td>
                                    <td>
                                        {request.requester.name}
                                        <div className="bm-muted">
                                            <a href={`mailto:${request.requester.email}`}>{request.requester.email}</a>
                                        </div>
                                        {request.requester.phone && <div className="bm-muted">{request.requester.phone}</div>}
                                    </td>
                                    <td>
                                        {request.meeting?.title ?? "—"}
                                        {request.meeting && (
                                            <div className="bm-muted">{formatDay(request.meeting.date)} · {request.meeting.time} GST</div>
                                        )}
                                    </td>
                                    <td className="bm-nowrap">{formatTimestamp(request.createdAt)}</td>
                                    <td>
                                        <span className={`request-status request-status--${request.status}`}>
                                            {REQUEST_STATUS_LABELS[request.status]}
                                        </span>
                                        {request.decision.byName && (
                                            <div className="bm-muted">by {request.decision.byName}</div>
                                        )}
                                    </td>
                                    <td className="bm-nowrap">
                                        {EMAILS.map(({ key, short, label }) => (
                                            <EmailStatus key={key} short={short} label={label} outcome={request.notifications[key]} />
                                        ))}
                                    </td>
                                    <td className="bm-actions">
                                        {request.status === "pending" && (
                                            <>
                                                <button type="button" className="bm-action" disabled={busyId === request.id} onClick={() => approve(request)}>
                                                    Approve
                                                </button>
                                                <button type="button" className="bm-action bm-action--danger" disabled={busyId === request.id} onClick={() => decline(request)}>
                                                    Decline
                                                </button>
                                            </>
                                        )}
                                        {canResend(request) && (
                                            <button type="button" className="bm-action" disabled={busyId === request.id} onClick={() => resend(request)}>
                                                Resend invitation
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default RequestsTable;
