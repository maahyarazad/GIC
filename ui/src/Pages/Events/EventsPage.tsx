import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./EventsPage.css";
import { useSelector } from "react-redux";
import { useToast } from "../../Providers/ToastContext";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store";
import { usePage } from '@/Providers/PageContext';
import EventCard from './EventCard';
import { getEvents, getPublicEvents } from "@/api/events";
import { useEventAttendance } from "@/Hooks/useEventAttendance";
import { MemberEventDto } from "../../../../src/types/event.types";

interface Props {
    siteData?: any;
}

const EventsPage: React.FC<Props> = () => {
    const { show } = useToast();

    const user = useSelector((state: RootState) => state.auth.user);
    const loading = useSelector((state: RootState) => state.auth.loading);

    const { showPage, activePage } = usePage();
    const navigate = useNavigate();

    const [events, setEvents] = useState<MemberEventDto[]>([]);

    const [_loading, _setLoading] = useState(true);

    // Public page: visitors get all events; signed-in users also get their own attendance.
    const fetchEvents = useCallback(async () => {
        try {
            _setLoading(true);
            setEvents(user
                ? await getEvents()
                : (await getPublicEvents()).map((event) => ({ ...event, myAttendance: null })));
        } catch (err) {
            show({ type: "error", message: "Failed to fetch events" });
            console.error("Failed to fetch events", err);
        } finally {
            _setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (loading) return;
        fetchEvents();
    }, [loading, fetchEvents]);

    const { confirm } = useEventAttendance(fetchEvents);

    // Event → card shape.
    const toCard = useCallback((event: MemberEventDto) => {
        const [year, month, day] = event.date.split("-").map(Number);
        const monthLabel = new Date(year, month - 1, day).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });

        const action = event.myAttendance
            ? "Attending"
            : !event.isPast && event.isFull
                ? "Fully Booked"
                : "Confirm Attendance";

        return {
            id: event.id,
            page: event.id,
            city: event.location,
            day: String(day),
            monthLabel,
            type: `${event.isPast ? "Past" : "Upcoming"} · Members Event`,
            title: event.title,
            description: event.description,
            meta: [monthLabel, "Members Only", action],
            visStyle: {
                background: "linear-gradient(135deg,var(--bgp2) 0%,var(--bg2) 100%)",
            },
            dateStyle: { background: "" },
            // Members can't attend past events, so those cards are not clickable for them.
            cardStyle: { opacity: 1, cursor: event.isPast && user ? 'default' : 'pointer' }
        };
    }, [user]);

    // Upcoming: soonest first. Past: most recent first.
    const upcomingCards = useMemo(() => events
        .filter((e) => !e.isPast)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .map(toCard), [events, toCard]);

    const pastCards = useMemo(() => events
        .filter((e) => e.isPast)
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
        .map(toCard), [events, toCard]);

    // Signed-in members confirm attendance; visitors are sent to the Contact form, name field focused.
    const handleSelect = (id: string) => {
        if (!user) {
            showPage("/contact");
            navigate("/contact", { state: { focus: "fullName" } });
            return;
        }
        const event = events.find((e) => e.id === id);
        if (event) confirm(event);
    };

    return (

        <div>
            <div id="page-events" className={`page ${activePage === "/events" ? "active" : ""}`}>
                <div className="ptnav"></div>

                <div className="br-hero">
                    <div className="br-bg"></div>
                    <div className="br-content">
                        <div className="br-tag">Members Only &middot; By Invitation</div>
                        <h1 className="br-title">
                            <em style={{ color: "var(--ora)" }}>Events</em>
                        </h1>
                        <p className="br-sub">
                            Private sessions, Business Breakfasts, and curated evenings for Club members across MEA.
                        </p>
                    </div>
                </div>

                <div className="ev-sec ev-sec--upcoming">
                    <div className="ev-hd">
                        <div>
                            <div className="slbl">Events &amp; Gatherings</div>
                            <h2 className="stit">Upcoming <em>Events</em></h2>
                        </div>

                        <a
                            className="btn-p"
                            onClick={() => {
                                showPage("/contact");
                                navigate("/contact");
                            }}
                            style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                        >
                            Request Access
                        </a>
                    </div>

                    {!_loading && upcomingCards.length === 0 && (
                        <p className="ev-empty">No upcoming events are scheduled yet.</p>
                    )}
                    {upcomingCards.map((event) => (
                        <EventCard key={event.id} event={event} _onClick={(id) => handleSelect(String(id))} />
                    ))}
                </div>

                {pastCards.length > 0 && (
                    <div className="ev-sec ev-sec--past">
                        <div className="ev-hd">
                            <div>
                                <div className="slbl">Archive</div>
                                <h2 className="stit">Past <em>Events</em></h2>
                            </div>
                        </div>

                        {pastCards.map((event) => (
                            <EventCard key={event.id} event={event} _onClick={(id) => handleSelect(String(id))} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsPage;
