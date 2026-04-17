import React, { useState, useEffect, useCallback, useContext } from "react";
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

    const getEventImageUrl = (p?: Event) => {

        const fallback = "https://services.german-emirates-club.com/uploads/GECBackground.webp";

        if (!p?.Image) return fallback;

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



    return (
        <div className="economic-insights">

            <h3 className="mb-3">Events</h3>

            {loading ? (
                <Loader />
            ) : events?.length === 0 ? (
                <p>No event found.</p>
            ) : (
                <div className="products row mt-2">
                    {events?.map((p) => {
                        const eventDate = p.event_date ? new Date(p.event_date) : null;

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
                            eventDate &&
                            eventDate >= new Date() &&
                            eventDate <= new Date(new Date().setDate(new Date().getDate() + 30));

                        

                        return (
                            <div
                                key={p.id}
                                className="col-md-6 mb-3 col-lg-4 col-xl-4 col-xxl-3 position-relative"
                                onClick={() => handleNavigation(p.page)}

                            >
                                <div className="card h-100 card-bg position-relative overflow-hidden">
                                    {isVideo(p.Image) ? (
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
                    })}
                </div>

            )}
        </div>
    );
}
export default Events;
