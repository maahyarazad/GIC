import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./EventsPage.css";
import { useSelector } from "react-redux";
import { useToast } from "../../Providers/ToastContext";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store";
import { usePage } from '@/Providers/PageContext';
import EventCard from './EventCard';
import { getEvents } from "@/api/events";
import { useEventAttendance } from "@/Hooks/useEventAttendance";
import { MemberEventDto } from "../../../../src/types/event.types";

interface Props {
    siteData?: any;
}

// Visitors get these blurred stand-ins instead of real board meetings: generic text only,
// always three, so nothing about the real list (not even its size) reaches them.
const PLACEHOLDER_CARDS = [1, 2, 3].map((n) => ({
    id: `placeholder-${n}`,
    page: `placeholder-${n}`,
    city: "Members Only",
    day: "··",
    monthLabel: "Members Only",
    type: "Upcoming · Members Board Meeting",
    title: "Private Board Meeting",
    description: "Details are shared with Club members.",
    meta: ["Members Only", "Members Only", "Request Access"],
    visStyle: {
        background: "linear-gradient(135deg,var(--bgp2) 0%,var(--bg2) 100%)",
    },
    dateStyle: { background: "" },
    cardStyle: { opacity: 1, cursor: 'pointer' }
}));

const EventsPage: React.FC<Props> = () => {
    const { show } = useToast();

    const user = useSelector((state: RootState) => state.auth.user);
    const loading = useSelector((state: RootState) => state.auth.loading);

    const { showPage, activePage } = usePage();
    const navigate = useNavigate();

    const [events, setEvents] = useState<MemberEventDto[]>([]);

    const [_loading, _setLoading] = useState(true);

    // Members only: visitors never request board meetings (they see PLACEHOLDER_CARDS).
    const fetchEvents = useCallback(async () => {
        try {
            _setLoading(true);
            setEvents(await getEvents());
        } catch (err) {
            show({ type: "error", message: "Failed to fetch board meetings" });
            console.error("Failed to fetch board meetings", err);
        } finally {
            _setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            // Signed out (or never signed in): drop any real rows a member had loaded.
            setEvents([]);
            _setLoading(false);
            return;
        }
        fetchEvents();
    }, [loading, user, fetchEvents]);

    const { confirm } = useEventAttendance(fetchEvents, "board meeting");

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
            type: `${event.isPast ? "Past" : "Upcoming"} · Members Board Meeting`,
            title: event.title,
            description: event.description,
            meta: [monthLabel, "Members Only", action],
            visStyle: {
                background: "linear-gradient(135deg,var(--bgp2) 0%,var(--bg2) 100%)",
            },
            dateStyle: { background: "" },
            // Members can't attend past board meetings, so those cards are not clickable.
            cardStyle: { opacity: 1, cursor: event.isPast ? 'default' : 'pointer' }
        };
    }, []);

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
                            <em style={{ color: "var(--ora)" }}>Board Meetings</em>
                        </h1>
                        <p className="br-sub">
                            Private sessions, Business Breakfasts, and curated evenings for Club members across MEA.
                        </p>
                    </div>
                </div>

                <div className="ev-sec ev-sec--upcoming">
                    <div className="ev-hd">
                        <div>
                            <div className="slbl">Board Meetings &amp; Gatherings</div>
                            <h2 className="stit">Upcoming <em>Board Meetings</em></h2>
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

                    {!user && PLACEHOLDER_CARDS.map((card) => (
                        <EventCard key={card.id} event={card} blurred _onClick={(id) => handleSelect(String(id))} />
                    ))}

                    {user && !_loading && upcomingCards.length === 0 && (
                        <p className="ev-empty">No upcoming board meetings are scheduled yet.</p>
                    )}
                    {user && upcomingCards.map((event) => (
                        <EventCard key={event.id} event={event} _onClick={(id) => handleSelect(String(id))} />
                    ))}
                </div>

                {user && pastCards.length > 0 && (
                    <div className="ev-sec ev-sec--past">
                        <div className="ev-hd">
                            <div>
                                <div className="slbl">Archive</div>
                                <h2 className="stit">Past <em>Board Meetings</em></h2>
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
