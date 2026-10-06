import React, { useState, useEffect, useCallback, useContext, useMemo } from "react";
import { PaginationModel, SortModel, FilterModel } from "../../GenericDataGrid/GenericDataGrid";
import { useToast } from "@/Providers/ToastContext";
import { EnvContext } from '@/EnvContext.jsx';
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import './Events.css';
import Loader from "@/Components/Loader/Loader";
import { Navigate, useNavigate } from "react-router-dom";
import { Event } from '../../../../../src/types/event.types';
import axiosInstance from "@/api/axiosInstance";
import newEvent from "@/Assets/upcoming-events2.png";
import gicLogo from "../../../../public/gic-logo-main.png"

// Parses event_date as a local calendar day; "YYYY-MM-DD" strings would otherwise be read as UTC midnight.
const toLocalDay = (value?: string): Date | null => {
    if (!value) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    const date = match
        ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        : new Date(value);
    if (isNaN(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

// Splits events into upcoming (today or later, or undated) and past, sorted soonest/most recent first.
const splitEventsByDate = (events: Event[], now = new Date()) => {
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
};

// --- Component ---
const Events: React.FC = () => {


    const [events, setEvents] = useState<Event[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 1, pageSize: 10 });
    const [sortModel, setSortModel] = useState<SortModel<Event> | null>(null);
    const [filterModel, setFilterModel] = useState<FilterModel<Event>[] | null>(null);
    const [uploading, setUploading] = useState(false);
    const { show } = useToast();
    const { confirm } = useConfirm();
    const env = useContext(EnvContext);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/events");
            if(response){
                const {data} = response;
                setEvents(data.data);
                setRowCount(data.data.length);
            }
        } catch (err) {
            show({ type: "error", message: 'Failed to fetch registration list' });
            console.error("Failed to fetch registration list", err);
        } finally {
            setLoading(false);
        }
    }, []);



    useEffect(() => {

        fetchEvents()
    }, [fetchEvents])

    const getEventImageUrl = (p?: Event): string | null => {
        // No image of its own: the card shows the blurred GIC logo instead.
        if (!p?.Image) return null;

        const baseUrl = "https://services.german-emirates-club.com/uploads/";
        const url = new URL(p.Image, baseUrl);

        return url.toString();
    };



    const isVideo = (file?: string) => file?.trimEnd().toLowerCase().endsWith(".webm");

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



    const { upcoming, past } = useMemo(() => splitEventsByDate(events ?? []), [events]);

    const renderEventCard = (p: Event, showUpcomingBadge: boolean) => {
        const eventDate = toLocalDay(p.event_date);

        const formattedDate = eventDate
            ? eventDate.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
            : null;

        const url = getEventImageUrl(p);

        // Check if the event is within the next 30 days
        const isUpcoming =
            showUpcomingBadge &&
            eventDate &&
            eventDate >= new Date(new Date().setHours(0, 0, 0, 0)) &&
            eventDate <= new Date(new Date().setDate(new Date().getDate() + 30));

        return (
            <div
                key={p.id}
                className="col-md-6 mb-3 col-lg-4 col-xl-4 col-xxl-3 position-relative"
                onClick={() => handleNavigation(p.page)}
            >
                <div className="card h-100 card-bg position-relative overflow-hidden">
                    {url === null ? (
                        <div
                            className="card-bg-image card-bg-image--fallback w-100 h-100 position-absolute top-0 start-0"
                            style={{ backgroundImage: `url("${gicLogo}")`, zIndex: 0 }}
                        />
                    ) : isVideo(p.Image) ? (
                        <video
                            className="card-video-bg w-100 h-100 position-absolute top-0 start-0"
                            autoPlay
                            muted
                            loop
                            playsInline
                            style={{ objectFit: "cover", zIndex: 0 }}
                        >
                            <source src={url} type="video/webm" />
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <div
                            className="card-bg-image w-100 h-100 position-absolute top-0 start-0"
                            style={{
                                backgroundImage: `url("${url}")`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                zIndex: 0,
                            }}
                        />
                    )}

                    {formattedDate && (
                        <div className="event-date-badge position-absolute top-0 start-0 m-2 z-1">
                            {formattedDate}
                        </div>
                    )}

                    <div className="card-body text-center position-relative z-1">
                        <h5 className="card-title">{p.title}</h5>
                    </div>
                </div>
                {isUpcoming && (
                    <img
                        src={newEvent}
                        alt="Upcoming Event"
                        className="position-absolute pulse-badge"
                        style={{
                            zIndex: 1,
                        }}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="dash-section economic-insights">
            <div className="dash-header">
                <h3>Events</h3>
            </div>

            {loading ? (
                <Loader />
            ) : events?.length === 0 ? (
                <p>No event found.</p>
            ) : (
                <>
                    <section className="events-group">
                        <h4 className="events-group__title">Upcoming Events</h4>
                        {upcoming.length === 0 ? (
                            <p className="events-group__empty">No upcoming events.</p>
                        ) : (
                            <div className="products row mt-2">
                                {upcoming.map((p) => renderEventCard(p, true))}
                            </div>
                        )}
                    </section>

                    <section className="events-group">
                        <h4 className="events-group__title">Past Events</h4>
                        {past.length === 0 ? (
                            <p className="events-group__empty">No past events.</p>
                        ) : (
                            <div className="products row mt-2">
                                {past.map((p) => renderEventCard(p, false))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}
export default Events;
