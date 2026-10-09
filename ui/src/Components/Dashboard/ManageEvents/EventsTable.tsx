import React, { useCallback, useEffect, useRef, useState } from "react";
import Loader from "@/Components/Loader/Loader";
import { useModal } from "@/Providers/ModalContext";
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import { useToast } from "@/Providers/ToastContext";
import { adminDeleteEvent, adminListEvents, apiErrorMessage } from "@/api/events";
import type { AdminEventDto } from "../../../../../src/types/event.types";
import EventForm from "./EventForm";
import { formatDay } from "./format";

interface EventsTableProps {
    /** Called after any change, so the parent can refresh what depends on events. */
    onChanged?: () => void;
}

const EventsTable: React.FC<EventsTableProps> = ({ onChanged }) => {
    const [events, setEvents] = useState<AdminEventDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { openModal, closeModal } = useModal();
    const { confirm } = useConfirm();
    const { show } = useToast();

    // The form is rendered from the modal provider with the callbacks captured at open time;
    // closeModal is only effective in its latest version, so call it through a ref.
    const closeModalRef = useRef(closeModal);
    closeModalRef.current = closeModal;

    const load = useCallback(async () => {
        try {
            setFailed(false);
            setEvents(await adminListEvents());
        } catch (error) {
            console.error("Failed to fetch events", error);
            setFailed(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const changed = () => {
        load();
        onChanged?.();
    };

    const openForm = (event?: AdminEventDto) =>
        openModal({
            title: event ? "Edit event" : "New event",
            content: (
                <EventForm
                    event={event}
                    onSaved={() => {
                        closeModalRef.current();
                        changed();
                    }}
                    onCancel={() => closeModalRef.current()}
                    notify={show}
                />
            ),
        });

    const remove = async (event: AdminEventDto) => {
        const confirmed = await confirm({
            title: "Delete event",
            message: `Delete “${event.title}”? This also removes ${event.confirmedCount} attendee record(s).`,
            confirmText: "Delete",
            cancelText: "Cancel",
        });
        if (!confirmed) return;

        setDeletingId(event.id);
        try {
            await adminDeleteEvent(event.id);
            show({ type: "success", message: "Event deleted" });
            changed();
        } catch (error) {
            show({ type: "error", message: apiErrorMessage(error, "Failed to delete the event") });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section className="bm-card">
            <div className="bm-card__header">
                <h4>Events</h4>
                <button type="button" className="dashboard-btn" onClick={() => openForm()}>
                    New event
                </button>
            </div>

            {loading ? (
                <Loader />
            ) : failed ? (
                <p className="bm-empty">
                    Could not load events.
                    <button type="button" className="bm-action ms-2" onClick={load}>Retry</button>
                </p>
            ) : events.length === 0 ? (
                <p className="bm-empty">No events yet. Create the first one with “New event”.</p>
            ) : (
                <div className="bm-table-wrap">
                    <table className="bm-table">
                        <thead>
                            <tr>
                                <th>Date &amp; time</th>
                                <th>Title</th>
                                <th>Venue</th>
                                <th>Location</th>
                                <th>Confirmed</th>
                                <th aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id} className={event.isPast ? "bm-row--past" : undefined}>
                                    <td className="bm-nowrap">
                                        {formatDay(event.date)}
                                        <div className="bm-muted">{event.time} GST{event.isPast ? " · past" : ""}</div>
                                    </td>
                                    <td>{event.title}</td>
                                    <td>{event.venue}</td>
                                    <td>{event.location}</td>
                                    <td className="bm-nowrap">
                                        {event.confirmedCount} / {event.capacity}
                                        {event.isFull ? " · Full" : ""}
                                    </td>
                                    <td className="bm-actions">
                                        <button type="button" className="bm-action" onClick={() => openForm(event)}>
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="bm-action bm-action--danger"
                                            disabled={deletingId === event.id}
                                            onClick={() => remove(event)}
                                        >
                                            Delete
                                        </button>
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

export default EventsTable;
