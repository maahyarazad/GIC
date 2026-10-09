import React from "react";
import newEvent from "@/Assets/upcoming-events2.png";
import gicLogo from "../../../../public/gic-logo-main.png"
import "./EventCard.css";

// Parses event_date as a local calendar day; "YYYY-MM-DD" strings would otherwise be read as UTC midnight.
export const toLocalDay = (value?: string | null): Date | null => {
    if (!value) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    const date = match
        ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        : new Date(value);
    if (isNaN(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

// Images are GIC File Management uploads, served by this app under /uploads.
const resolveImageUrl = (imageUrl?: string | null): string | null => {
    if (!imageUrl) return null;
    if (typeof window === "undefined") return imageUrl;
    return new URL(imageUrl, window.location.origin).toString();
};

const isVideo = (file?: string | null) => file?.trimEnd().toLowerCase().endsWith(".webm");

export type EventCardBadgeTone = "attending" | "full";

interface EventCardProps {
    title: string;
    /** Calendar day ("YYYY-MM-DD") shown in the left date block. */
    date?: string | null;
    /** One line under the title, e.g. "Venue · 18:30 GST". */
    subtitle?: string;
    imageUrl?: string | null;
    badge?: { label: string; tone: EventCardBadgeTone };
    showUpcomingBadge?: boolean;
    /** Omit to render a non-interactive card. */
    onClick?: () => void;
    // Bootstrap column classes; override when the card sits in a narrower container.
    columnClassName?: string;
}

const EventCard: React.FC<EventCardProps> = ({
    title,
    date,
    subtitle,
    imageUrl,
    badge,
    showUpcomingBadge = false,
    onClick,
    columnClassName = "col-md-6 mb-3 col-lg-4 col-xl-4 col-xxl-3",
}) => {
    const eventDate = toLocalDay(date);

    const dateParts = eventDate
        ? {
            iso: `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`,
            day: eventDate.toLocaleDateString("en-GB", { day: "2-digit" }),
            month: eventDate.toLocaleDateString("en-GB", { month: "short" }),
            year: String(eventDate.getFullYear()),
        }
        : null;

    const url = resolveImageUrl(imageUrl);

    // Check if the event is within the next 30 days
    const isUpcoming =
        showUpcomingBadge &&
        eventDate &&
        eventDate >= new Date(new Date().setHours(0, 0, 0, 0)) &&
        eventDate <= new Date(new Date().setDate(new Date().getDate() + 30));

    return (
        <div
            className={`${columnClassName} position-relative`}
            onClick={onClick}
        >
            <div className={`card event-card card-bg position-relative overflow-hidden${onClick ? "" : " event-card--static"}`}>
                {url === null ? (
                    <div
                        className="card-bg-image card-bg-image--fallback w-100 h-100 position-absolute top-0 start-0"
                        style={{ backgroundImage: `url("${gicLogo}")`, zIndex: 0 }}
                    />
                ) : isVideo(imageUrl) ? (
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

                {dateParts && (
                    <time className="event-date-block" dateTime={dateParts.iso}>
                        <span className="event-date-block__day">{dateParts.day}</span>
                        <span className="event-date-block__month">{dateParts.month}</span>
                        <span className="event-date-block__year">{dateParts.year}</span>
                    </time>
                )}

                {badge && (
                    <span className={`event-status-badge event-status-badge--${badge.tone}`}>{badge.label}</span>
                )}

                <div className={`card-body text-center position-relative z-1${dateParts ? " has-date" : ""}`}>
                    <div className="event-card__text">
                        <h5 className="card-title">{title}</h5>
                        {subtitle && <p className="event-card__subtitle">{subtitle}</p>}
                    </div>
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

export default EventCard;
