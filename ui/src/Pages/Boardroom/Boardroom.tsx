import React, { useState, useEffect, useContext, useCallback } from "react";
import { loginUser, LoginModel } from "../../api/auth";
import "./Boardroom.css";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../../providers/ToastContext";
import { login, setLoadingFalse, setLoadingTrue } from "../../features/authSlice";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { RootState } from "../../store";
import Button from "../../Components/Button/Button";
import LockOverlay from '../../Components/LockOverlay/LockOverlay'
import './Boardroom.css';
import { setReady } from '../../features/appSlice';
import { usePage } from '@/providers/PageContext';
import { EnvContext } from '@/EnvContext';
import axiosInstance from "@/api/axiosInstance";
import EventCard from './EventCard';

interface Props {
    siteData: any;
}

const Boardroom: React.FC<Props> = ({ siteData }) => {
    const env = useContext(EnvContext);


    const dispatch = useDispatch();
    React.useEffect(() => {
        dispatch(setReady(true));

    }, [dispatch])


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



    const [eventCard, setEventCards] = useState<Event[]>([]);

    const [_loading, _setLoading] = useState(true);

    const stripHtml = (html: string): string => {
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    const fetchEvents = useCallback(async () => {
        try {
            _setLoading(true);
            const response = await axiosInstance.get("/events");
            if (response) {
                const { data } = response;
                const eventCards = data.data.map((x: any) => {
                    const eventDate = new Date(x.event_date);
                    const monthLabel = eventDate.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                    });

                    return {
                        id: x.id,
                        page: x.page,
                        city: "Dubai",
                        day: eventDate.getDate().toString(),
                        monthLabel,
                        dateValue: x.event_date,
                        type: "Upcoming · Members Briefing",
                        title: x.title,
                        description: stripHtml(x.description),
                        meta: [monthLabel, "Members Only", "Register Interest"],
                        visStyle: {
                            background: "linear-gradient(135deg,var(--bgp2) 0%,var(--bg2) 100%)",
                        },
                        dateStyle: { background: "" },
                        cardStyle: { opacity: 1, cursor: 'pointer' }
                    };
                });
                setEventCards(eventCards);
            }
        } catch (err) {
            show({ type: "error", message: "Failed to fetch registration list" });
            console.error("Failed to fetch registration list", err);
        } finally {
            _setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);



    const handleNavigation = async (page: string) => {
        try {
            
            const response = await axiosInstance.get("/sso");
            const data = response.data;

            if (data.data.ssoToken) {
                window.location.href = `https://services.german-emirates-club.com/registration/${page}?sso=${data.data.ssoToken}&referer=gic`;
                // window.location.href = `http://localhost:5175/registration/${page}?sso=${data.data.ssoToken}&referer=gic`;
            }
        } catch (error) {
            show({
                type: "error",
                message: "SSO token not generated. Please try again.",
            });
            console.error("SSO error", error);
        }
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
                        <EventCard key={event.id} event={event} _onClick={(p) => handleNavigation(p)} />
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
