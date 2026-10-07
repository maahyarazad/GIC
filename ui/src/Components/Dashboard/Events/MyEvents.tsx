import React, { useCallback, useEffect, useState } from "react";
import Loader from "@/Components/Loader/Loader";
import { useModal } from "@/Providers/ModalContext";
import { getMyEvents } from "@/api/myEvents";
import { MyEventRegistration } from '../../../../../src/types/event.types';
import EventCard from "./EventCard";
import MyEventQr from "./MyEventQr";

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
            debugger;
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

    const openQr = (item: MyEventRegistration) =>
        openModal({
            title: item.event.title,
            content: <MyEventQr reference={item.reference} />,
            cancelText: "Close",
        });

    const renderFooter = (item: MyEventRegistration) => (
        <div className="event-card-footer" onClick={(e) => e.stopPropagation()}>
            <span className="event-card-footer__reference" title={item.reference}>
                {item.reference}
            </span>
            {item.paymentStatus && (
                <span className="event-card-footer__status">{item.paymentStatus}</span>
            )}
            <button type="button" className="btn btn-sm btn-light" onClick={() => openQr(item)}>
                Show QR
            </button>
        </div>
    );

    return (
        <section className="events-group my-events">
            <h4 className="events-group__title">My Events</h4>
            {loading ? (
                <Loader />
            ) : failed ? (
                <p className="events-group__empty">
                    Could not load your registrations.{" "}
                    <button type="button" className="btn btn-sm btn-outline-secondary ms-2" onClick={fetchMyEvents}>
                        Retry
                    </button>
                </p>
            ) : items.length === 0 ? (
                <p className="events-group__empty">You haven't registered for any events yet.</p>
            ) : (
                <div className="products row mt-2">
                    {items.map((item) => (
                        <EventCard
                            key={item.reference}
                            event={item.event}
                            onClick={() => openQr(item)}
                            footer={renderFooter(item)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default MyEvents;
