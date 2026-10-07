import React, { memo, useCallback, useEffect, useState } from "react";
import Loader from "@/Components/Loader/Loader";
import { useModal } from "@/Providers/ModalContext";
import { getMyEvents } from "@/api/myEvents";
import { MyEventRegistration } from '../../../../../src/types/event.types';
import { toLocalDay } from "./EventCard";
import MyEventQr from "./MyEventQr";

const EMPTY = "—";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };

// Event dates are calendar days ("YYYY-MM-DD"); parse them as local days, not UTC midnight.
const formatEventDate = (value?: string | null) =>
    toLocalDay(value)?.toLocaleDateString("en-GB", DATE_FORMAT) ?? EMPTY;

const formatTimestamp = (value?: string | null) => {
    if (!value) return EMPTY;
    const date = new Date(value);
    return isNaN(date.getTime()) ? EMPTY : date.toLocaleDateString("en-GB", DATE_FORMAT);
};

const MyEventRow = memo(({
    item,
    onShowQr,
}: {
    item: MyEventRegistration;
    onShowQr: (item: MyEventRegistration) => void;
}) => {
    const { event } = item;
    const details = [event.event_time, event.event_location_name].filter(Boolean).join(" · ");

    return (
        <tr>
            <td className="my-events-ref">{item.reference}</td>
            <td>
                {event.title}
                {details && <div className="my-events-muted">{details}</div>}
            </td>
            <td>{formatEventDate(event.event_date)}</td>
            <td>{formatTimestamp(item.registeredAt)}</td>
            <td className="my-events-status">{item.paymentStatus ?? EMPTY}</td>
            <td>
                <button type="button" className="my-events-action" onClick={() => onShowQr(item)}>
                    Show QR
                </button>
            </td>
        </tr>
    );
});
MyEventRow.displayName = "MyEventRow";

const MyEvents: React.FC = () => {
    const [items, setItems] = useState<MyEventRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const { openModal } = useModal();

    const fetchMyEvents = useCallback(async () => {
        try {
            setLoading(true);
            setFailed(false);
            setItems(await getMyEvents());
        } catch (err) {
            console.error("Failed to fetch my events", err);
            setFailed(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyEvents();
    }, [fetchMyEvents]);

    const openQr = useCallback((item: MyEventRegistration) =>
        openModal({
            title: item.event.title,
            content: <MyEventQr reference={item.reference} />,
            cancelText: "Close",
        }), [openModal]);

    return (
        <section className="my-events-card">
            <h4>My Events</h4>
            {loading ? (
                <Loader />
            ) : failed ? (
                <p className="my-events-empty">
                    Could not load your registrations.{" "}
                    <button type="button" className="my-events-action ms-2" onClick={fetchMyEvents}>
                        Retry
                    </button>
                </p>
            ) : items.length === 0 ? (
                <p className="my-events-empty">You haven't registered for any events yet.</p>
            ) : (
                <div className="my-events-table-wrap">
                    <table className="my-events-table">
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Event</th>
                                <th>Event date</th>
                                <th>Registered</th>
                                <th>Status</th>
                                <th aria-label="QR code" />
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <MyEventRow key={item.reference} item={item} onShowQr={openQr} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default MyEvents;
