import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { loginUser, LoginModel } from "../../api/auth";
import "./Boardroom.css";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../../Providers/ToastContext";
import { login, setLoadingFalse, setLoadingTrue } from "../../features/authSlice";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { RootState } from "../../store";
import Button from "../../Components/Button/Button";
import LockOverlay from '../../Components/LockOverlay/LockOverlay'
import './Boardroom.css';
import { setReady } from '../../features/appSlice';
import { usePage } from '@/Providers/PageContext';
import { EnvContext } from '@/EnvContext';
import EventCard from './EventCard';
import { getBoardMeetings } from "@/api/boardMeetings";
import { useBoardMeetingRequest } from "@/Hooks/useBoardMeetingRequest";
import { MemberBoardMeetingDto, REQUEST_STATUS_LABELS } from "../../../../src/types/boardMeeting.types";

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

    // Meetings are members-only: fetch only for a signed-in user (the lock overlay covers the page otherwise).
    const fetchEvents = useCallback(async () => {
        if (!user) {
            setMeetings([]);
            _setLoading(false);
            return;
        }
        try {
            _setLoading(true);
            setMeetings(await getBoardMeetings());
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

    // Upcoming meetings mapped to the Boardroom card's shape.
    const eventCard = useMemo(() => meetings
        .filter((meeting) => !meeting.isPast)
        .map((meeting) => {
            const [year, month, day] = meeting.date.split("-").map(Number);
            const monthLabel = new Date(year, month - 1, day).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            });

            return {
                id: meeting.id,
                page: meeting.id,
                city: meeting.location.length > 32 ? `${meeting.location.slice(0, 31)}…` : meeting.location,
                day: String(day),
                monthLabel,
                type: "Upcoming · Board Meeting",
                title: meeting.title,
                description: meeting.description,
                meta: [
                    `${meeting.time} GST`,
                    meeting.venue,
                    meeting.myRequest ? REQUEST_STATUS_LABELS[meeting.myRequest.status] : "Request to Join",
                ],
                visStyle: {
                    background: "linear-gradient(135deg,var(--bgp2) 0%,var(--bg2) 100%)",
                },
                dateStyle: { background: "" },
                cardStyle: { opacity: 1, cursor: 'pointer' }
            };
        }), [meetings]);

    const handleRequest = (id: string) => {
        const meeting = meetings.find((m) => m.id === id);
        if (meeting) request(meeting);
    };

    return (

        <div>
            <LockOverlay />

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

                <div className="ev-sec">
                    <div className="ev-hd">
                        <div>
                            <div className="slbl">Events &amp; Gatherings</div>
                            <h2 className="stit">
                                {false ? (
                                    <>Past <em>Sessions</em></>
                                ) : (
                                    <>Upcoming <em>Sessions</em></>
                                )}
                            </h2>
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

                    {eventCard?.map((event) => (
                        <EventCard key={event.id} event={event} _onClick={(id) => handleRequest(String(id))} />
                    ))}
                </div>

                <div className="ac-sec">
                    <div className="ac-in">
                        <div className="ac-icon">&#x2B21;</div>
                        <h2 className="ac-title">Member Access Required</h2>
                        <p className="ac-body">
                            Full event details, venue information, speaker briefings, and registration are available exclusively to verified Club members.
                        </p>
                        <a
                            className="btn-p"
                            onClick={() => {
                                showPage("/contact");
                                navigate("/contact");
                            }}
                        >
                            Request Membership
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Boardroom;
