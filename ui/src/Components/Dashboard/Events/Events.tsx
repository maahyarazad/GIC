import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import './Events.css';
import Loader from "@/Components/Loader/Loader";
import { MemberEventDto } from '../../../../../src/types/event.types';
import { getEvents } from "@/api/events";
import { useEventAttendance } from "@/Hooks/useEventAttendance";
import EventCard, { EventCardBadgeTone } from "./EventCard";
import MyEvents from "./MyEvents";

const badgeFor = (event: MemberEventDto): { label: string; tone: EventCardBadgeTone } | undefined => {
    if (event.myAttendance) return { label: "Attending", tone: "attending" };
    if (!event.isPast && event.isFull) return { label: "Fully booked", tone: "full" };
    return undefined;
};

// Splits events into upcoming (soonest first) and past (most recent first).
// Pure function: lives outside the component so it isn't recreated per render.
function splitEvents(events: MemberEventDto[]) {
    const upcoming = events.filter((e) => !e.isPast).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const past = events.filter((e) => e.isPast).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    return { upcoming, past };
}

// --- Memoized list pieces ---

interface EventItemProps {
    event: MemberEventDto;
    showUpcomingBadge: boolean;
    onSelect?: (event: MemberEventDto) => void;
}

// Cards sit in the half-width left column, so two per row instead of 3–4.
const EVENT_CARD_COLUMN = "col-12 col-sm-6 mb-3";

// Wrapper keeps EventCard from re-rendering when unrelated parent state changes.
const EventItem = memo(({ event, showUpcomingBadge, onSelect }: EventItemProps) => (
    <EventCard
        columnClassName={EVENT_CARD_COLUMN}
        title={event.title}
        date={event.date}
        subtitle={`${event.venue} · ${event.time} GST`}
        imageUrl={event.imageUrl}
        badge={badgeFor(event)}
        showUpcomingBadge={showUpcomingBadge}
        onClick={onSelect && (() => onSelect(event))}
    />
));
EventItem.displayName = "EventItem";

interface EventsGroupProps {
    title: string;
    emptyText: string;
    events: MemberEventDto[];
    showUpcomingBadge: boolean;
    onSelect?: (event: MemberEventDto) => void;
}

const EventsGroup = memo(({ title, emptyText, events, showUpcomingBadge, onSelect }: EventsGroupProps) => (
    <section className="events-group">
        <h4 className="events-group__title">{title}</h4>
        {events.length === 0 ? (
            <p className="events-group__empty">{emptyText}</p>
        ) : (
            <div className="products row mt-2">
                {events.map((event) => (
                    <EventItem
                        key={event.id}
                        event={event}
                        showUpcomingBadge={showUpcomingBadge}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        )}
    </section>
));
EventsGroup.displayName = "EventsGroup";

// --- Component ---
const Events: React.FC = () => {
    const [events, setEvents] = useState<MemberEventDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);

    // Aborts the previous fetch when a new one starts or the component unmounts.
    const controllerRef = useRef<AbortController | null>(null);

    const load = useCallback(async () => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        try {
            setFailed(false);
            setEvents(await getEvents(controller.signal));
        } catch (err) {
            if (controller.signal.aborted) return;
            console.error("Failed to fetch events", err);
            setFailed(true);
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        return () => controllerRef.current?.abort();
    }, [load]);

    const { confirm } = useEventAttendance(load);

    const { upcoming, past } = useMemo(() => splitEvents(events), [events]);
    const attending = useMemo(() => events.filter((e) => e.myAttendance), [events]);

    const retry = () => {
        setLoading(true);
        load();
    };

    return (
        <div className="dash-section economic-insights">
            <div className="dash-header">
                <h3>Events</h3>
            </div>

            {/* Events on the left, My Events on the right, top-aligned; stacked below lg. */}
            <div className="row align-items-start events-columns">
                <div className="col-12 col-lg-6">
                    {loading ? (
                        <Loader />
                    ) : failed ? (
                        <p className="my-events-empty">
                            Could not load events.
                            <button type="button" className="my-events-action ms-2" onClick={retry}>
                                Retry
                            </button>
                        </p>
                    ) : (
                        <>
                            <EventsGroup
                                title="Upcoming Events"
                                emptyText="No upcoming events."
                                events={upcoming}
                                showUpcomingBadge
                                onSelect={confirm}
                            />
                            <EventsGroup
                                title="Past Events"
                                emptyText="No past events."
                                events={past}
                                showUpcomingBadge={false}
                            />
                        </>
                    )}
                </div>

                <div className="col-12 col-lg-6">
                    {!loading && !failed && <MyEvents items={attending} />}
                </div>
            </div>
        </div>
    );
};

export default Events;
