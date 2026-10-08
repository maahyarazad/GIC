import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { loginUser, LoginModel } from "../../api/auth";
import "./Boardroom.css";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../../Providers/ToastContext";
import { login, setLoadingFalse, setLoadingTrue } from "../../features/authSlice";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { RootState } from "../../store";
import Button from "../../Components/Button/Button";
import './Boardroom.css';
import { setReady } from '../../features/appSlice';
import { usePage } from '@/Providers/PageContext';
import { EnvContext } from '@/EnvContext';
import EventCard from './EventCard';
import { getBoardMeetings, getPublicBoardMeetings } from "@/api/boardMeetings";
import { useBoardMeetingRequest } from "@/Hooks/useBoardMeetingRequest";
import { MemberBoardMeetingDto } from "../../../../src/types/boardMeeting.types";

interface Props {
    siteData: any;
}

const Boardroom: React.FC<Props> = ({ siteData }) => {
    const env = useContext(EnvContext);


    const { show } = useToast();


    const user = useSelector((state: RootState) => state.auth.user);
    const loading = useSelector((state: RootState) => state.auth.loading);


    useEffect(() => {
        if (!loading && user) {

        }
    }, [loading, user, location.pathname]);


    interface BoardroomEvent {
        id: string;
        imageUrl: string;
        title: string;
        description: string;
    }

    interface BoardroomProps {
        boardroom: BoardroomEvent[];
    }
    const { showPage, activePage } = usePage();
    const navigate = useNavigate();



    const [meetings, setMeetings] = useState<MemberBoardMeetingDto[]>([]);

    const [_loading, _setLoading] = useState(true);

    // Public page: visitors get the upcoming meetings; signed-in users also get their own request status.
    const fetchEvents = useCallback(async () => {
        try {
            _setLoading(true);
            setMeetings(user
                ? await getBoardMeetings()
                : (await getPublicBoardMeetings()).map((meeting) => ({ ...meeting, myRequest: null })));
        } catch (err) {
            show({ type: "error", message: "Failed to fetch board meetings" });
            console.error("Failed to fetch board meetings", err);
        } finally {
            _setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (loading) return;
        fetchEvents();
    }, [loading, fetchEvents]);

    const { request } = useBoardMeetingRequest(fetchEvents);

    // Meeting → Boardroom card shape.
    const toCard = useCallback((meeting: MemberBoardMeetingDto) => {
        const [year, month, day] = meeting.date.split("-").map(Number);
        const monthLabel = new Date(year, month - 1, day).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });

        return {
            id: meeting.id,
            page: meeting.id,
            city: meeting.location,
            day: String(day),
            monthLabel,
            type: `${meeting.isPast ? "Past" : "Upcoming"} · Members Briefing`,
            title: meeting.title,
            description: meeting.description,
            meta: [monthLabel, "Members Only", "Register Interest"],
            visStyle: {
                background: "linear-gradient(135deg,var(--bgp2) 0%,var(--bg2) 100%)",
            },
            dateStyle: { background: "" },
            // Members can't request past meetings, so those cards are not clickable for them.
            cardStyle: { opacity: 1, cursor: meeting.isPast && user ? 'default' : 'pointer' }
        };
    }, [user]);

    // Upcoming: soonest first. Past: most recent first.
    const upcomingCards = useMemo(() => meetings
        .filter((m) => !m.isPast)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .map(toCard), [meetings, toCard]);

    const pastCards = useMemo(() => meetings
        .filter((m) => m.isPast)
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
        .map(toCard), [meetings, toCard]);

    // Signed-in users request to join; visitors are sent to the Contact page.
    const handleRequest = (id: string) => {
        if (!user) {
            showPage("/contact");
            navigate("/contact");
            return;
        }
        const meeting = meetings.find((m) => m.id === id);
        if (meeting) request(meeting);
    };

    return (

        <div>
            <div id="page-boardroom" className={`page ${activePage === "/boardroom" ? "active" : ""}`}>
                <div className="ptnav"></div>

                <div className="br-hero">
                    <div className="br-bg"></div>
                    <div className="br-content">
                        <div className="br-tag">Restricted Access &middot; By Invitation Only</div>
                        <h1 className="br-title">
                            The <em style={{ color: "var(--ora)" }}>Boardroom</em>
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
                            <h2 className="stit">Upcoming <em>Sessions</em></h2>
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
                        <p className="ev-empty">No upcoming sessions are scheduled yet.</p>
                    )}
                    {upcomingCards.map((event) => (
                        <EventCard key={event.id} event={event} _onClick={(id) => handleRequest(String(id))} />
                    ))}
                </div>

                {pastCards.length > 0 && (
                    <div className="ev-sec ev-sec--past">
                        <div className="ev-hd">
                            <div>
                                <div className="slbl">Archive</div>
                                <h2 className="stit">Past <em>Sessions</em></h2>
                            </div>
                        </div>

                        {pastCards.map((event) => (
                            <EventCard key={event.id} event={event} _onClick={(id) => handleRequest(String(id))} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Boardroom;
