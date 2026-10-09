import React, { useCallback, useEffect, useState } from "react";
import Loader from "@/Components/Loader/Loader";
import { useToast } from "@/Providers/ToastContext";
import {
    adminListAttendances,
    adminListEvents,
    adminResendConfirmation,
    apiErrorMessage,
} from "@/api/events";
import {
    ATTENDANCE_STATUS_LABELS,
    type AdminEventDto,
    type EventAttendanceDto,
    type NotificationOutcomeDto,
} from "../../../../../src/types/event.types";
import { formatDay, formatTimestamp } from "./format";

const EMAILS: { key: keyof EventAttendanceDto["notifications"]; short: string; label: string }[] = [
    { key: "leadership", short: "L", label: "Leadership notification" },
    { key: "confirmation", short: "C", label: "Confirmation to member" },
];

const EmailStatus = ({ label, short, outcome }: { label: string; short: string; outcome: NotificationOutcomeDto }) => (
    <span
        className={`email-status email-status--${outcome.status}`}
        title={`${label}: ${outcome.status.replace("_", " ")}${outcome.attemptedAt ? ` (${formatTimestamp(outcome.attemptedAt)})` : ""}`}
    >
        {short}
    </span>
);

const canResend = (attendance: EventAttendanceDto) =>
    attendance.status === "confirmed" && attendance.notifications.confirmation.status !== "sent";

interface AttendeesTableProps {
    /** Called after any action, so the parent can refresh what depends on attendees. */
    onChanged?: () => void;
}

const AttendeesTable: React.FC<AttendeesTableProps> = ({ onChanged }) => {
    const [eventId, setEventId] = useState("");
    const [showCancelled, setShowCancelled] = useState(false);
    const [events, setEvents] = useState<AdminEventDto[]>([]);
    const [attendances, setAttendances] = useState<EventAttendanceDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const { show } = useToast();

    useEffect(() => {
        adminListEvents()
            .then(setEvents)
            .catch((error) => console.error("Failed to fetch events for the filter", error));
    }, []);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setFailed(false);
            setAttendances(await adminListAttendances({
                status: showCancelled ? "all" : "confirmed",
                eventId: eventId || undefined,
            }));
        } catch (error) {
            console.error("Failed to fetch event attendees", error);
            setFailed(true);
        } finally {
            setLoading(false);
        }
    }, [showCancelled, eventId]);

    useEffect(() => {
        load();
    }, [load]);

    const resend = async (attendance: EventAttendanceDto) => {
        setBusyId(attendance.id);
        try {
            const { message } = await adminResendConfirmation(attendance.id);
            show({ type: /failed/i.test(message) ? "warning" : "success", message });
        } catch (error) {
            show({ type: "error", message: apiErrorMessage(error, "The action failed. Please try again.") });
        } finally {
            setBusyId(null);
            load();
            onChanged?.();
        }
    };

    return (
        <section className="bm-card">
            <div className="bm-card__header">
                <h4>Attendees</h4>
                <div className="bm-filters">
                    <select
                        className="form-select form-select-sm"
                        aria-label="Filter by event"
                        value={eventId}
                        onChange={(e) => setEventId(e.target.value)}
                    >
                        <option value="">All events</option>
                        {events.map((event) => (
                            <option key={event.id} value={event.id}>
                                {formatDay(event.date)} · {event.title}
                            </option>
                        ))}
                    </select>
                    <label className="form-check-label bm-nowrap">
                        <input
                            type="checkbox"
                            className="form-check-input me-1"
                            checked={showCancelled}
                            onChange={(e) => setShowCancelled(e.target.checked)}
                        />
                        Show cancelled
                    </label>
                </div>
            </div>

            {loading ? (
                <Loader />
            ) : failed ? (
                <p className="bm-empty">
                    Could not load attendees.
                    <button type="button" className="bm-action ms-2" onClick={load}>Retry</button>
                </p>
            ) : attendances.length === 0 ? (
                <p className="bm-empty">No attendees match the filters.</p>
            ) : (
                <div className="bm-table-wrap">
                    <table className="bm-table">
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Member</th>
                                <th>Event</th>
                                <th>Confirmed on</th>
                                {showCancelled && <th>Status</th>}
                                <th>Emails</th>
                                <th aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {attendances.map((attendance) => (
                                <tr key={attendance.id}>
                                    <td className="bm-ref">{attendance.reference}</td>
                                    <td>
                                        {attendance.requester.name}
                                        <div className="bm-muted">
                                            <a href={`mailto:${attendance.requester.email}`}>{attendance.requester.email}</a>
                                        </div>
                                        {attendance.requester.phone && <div className="bm-muted">{attendance.requester.phone}</div>}
                                    </td>
                                    <td>
                                        {attendance.event?.title ?? "—"}
                                        {attendance.event && (
                                            <div className="bm-muted">{formatDay(attendance.event.date)} · {attendance.event.time} GST</div>
                                        )}
                                    </td>
                                    <td className="bm-nowrap">{formatTimestamp(attendance.createdAt)}</td>
                                    {showCancelled && (
                                        <td>
                                            <span className={`request-status request-status--${attendance.status}`}>
                                                {ATTENDANCE_STATUS_LABELS[attendance.status]}
                                            </span>
                                        </td>
                                    )}
                                    <td className="bm-nowrap">
                                        {EMAILS.map(({ key, short, label }) => (
                                            <EmailStatus key={key} short={short} label={label} outcome={attendance.notifications[key]} />
                                        ))}
                                    </td>
                                    <td className="bm-actions">
                                        {canResend(attendance) && (
                                            <button type="button" className="bm-action" disabled={busyId === attendance.id} onClick={() => resend(attendance)}>
                                                Resend confirmation
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

export default AttendeesTable;
