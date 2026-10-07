import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/Providers/ToastContext";
import './Events.css';
import Loader from "@/Components/Loader/Loader";
import type { Event } from '../../../../../src/types/event.types';
import axiosInstance from "@/api/axiosInstance";
import EventCard, { toLocalDay } from "./EventCard";
import MyEvents from "./MyEvents";

const SERVICES_REGISTRATION_URL = "https://services.german-emirates-club.com/registration";

// Splits events into upcoming (today or later, or undated) and past, sorted soonest/most recent first.
// Pure function: lives outside the component so it can be unit tested and isn't recreated per render.
function splitEventsByDate(events: Event[], now: Date = new Date()) {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const upcoming: { event: Event; day: number | null }[] = [];
    const past: { event: Event; day: number }[] = [];

    events.forEach((event) => {
        const day = toLocalDay(event.event_date)?.getTime() ?? null;
        if (day !== null && day < startOfToday) past.push({ event, day });
        else upcoming.push({ event, day });
    });

    upcoming.sort((a, b) => (a.day ?? Infinity) - (b.day ?? Infinity));
    past.sort((a, b) => b.day - a.day);

    return {
        upcoming: upcoming.map((x) => x.event),
        past: past.map((x) => x.event),
    };
}

// --- Memoized list pieces ---

interface EventItemProps {
    event: Event;
    showUpcomingBadge: boolean;
    onNavigate: (page: string) => void;
}

// Cards sit in the half-width left column, so two per row instead of 3–4.
const EVENT_CARD_COLUMN = "col-12 col-sm-6 mb-3";

// Wrapper keeps EventCard from re-rendering when unrelated parent state changes.
const EventItem = memo(({ event, showUpcomingBadge, onNavigate }: EventItemProps) => (
    <EventCard
        columnClassName={EVENT_CARD_COLUMN}
        event={event}
        showUpcomingBadge={showUpcomingBadge}
        onClick={() => onNavigate(event.page)}
    />
));
EventItem.displayName = "EventItem";

interface EventsGroupProps {
    title: string;
    emptyText: string;
    events: Event[];
    showUpcomingBadge: boolean;
    onNavigate: (page: string) => void;
}

const EventsGroup = memo(({ title, emptyText, events, showUpcomingBadge, onNavigate }: EventsGroupProps) => (
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
                        onNavigate={onNavigate}
                    />
                ))}
            </div>
        )}
    </section>
));
EventsGroup.displayName = "EventsGroup";

// --- Component ---
const Events: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const { show } = useToast();

    // Keep the latest toast function without making it a dependency of effects/callbacks.
    const showRef = useRef(show);
    showRef.current = show;

    // Fetch once on mount; abort on unmount to avoid state updates on an unmounted component.
    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                const { data } = await axiosInstance.get("/events", { signal: controller.signal });
                setEvents(data?.data ?? []);
            } catch (err) {
                if (controller.signal.aborted) return;
                showRef.current({ type: "error", message: "Failed to fetch events" });
                console.error("Failed to fetch events", err);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();

        return () => controller.abort();
    }, []);

    // Guards against duplicate SSO requests from rapid clicks.
    const navigatingRef = useRef(false);

    const handleNavigation = useCallback(async (page: string) => {
        if (navigatingRef.current) return;
        navigatingRef.current = true;

        try {
            const { data } = await axiosInstance.get("/sso");
            const ssoToken = data?.data?.ssoToken;

            if (!ssoToken) throw new Error("Missing SSO token");

            window.location.href =
                `${SERVICES_REGISTRATION_URL}/${encodeURIComponent(page)}` +
                `?sso=${encodeURIComponent(ssoToken)}&referer=gic`;
            // Flag stays set: the browser is leaving the page.
        } catch (error) {
            navigatingRef.current = false;
            showRef.current({
                type: "error",
                message: "SSO token not generated. Please try again.",
            });
            console.error("SSO error", error);
        }
    }, []);

    // Recompute when events change, or when the calendar day rolls over (e.g. tab left open overnight).
    const todayKey = new Date().toDateString();
    const { upcoming, past } = useMemo(
        () => splitEventsByDate(events),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [events, todayKey]
    );

    return (
        <div className="dash-section economic-insights">
            <div className="dash-header">
                <h3>Events</h3>
            </div>

            {/* Upcoming/Past on the left, My Events on the right, top-aligned; stacked below lg. */}
            <div className="row align-items-start events-columns">
                <div className="col-12 col-lg-6">
                    {loading ? (
                        <Loader />
                    ) : events.length === 0 ? (
                        <p>No event found.</p>
                    ) : (
                        <>
                            <EventsGroup
                                title="Upcoming Events"
                                emptyText="No upcoming events."
                                events={upcoming}
                                showUpcomingBadge
                                onNavigate={handleNavigation}
                            />
                            <EventsGroup
                                title="Past Events"
                                emptyText="No past events."
                                events={past}
                                showUpcomingBadge={false}
                                onNavigate={handleNavigation}
                            />
                        </>
                    )}
                </div>

                <div className="col-12 col-lg-6">
                    <MyEvents />
                </div>
            </div>
        </div>
    );
};

export default Events;