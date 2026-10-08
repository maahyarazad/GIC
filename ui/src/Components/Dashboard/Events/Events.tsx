import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import './Events.css';
import Loader from "@/Components/Loader/Loader";
import {
    MemberBoardMeetingDto,
    BoardMeetingRequestStatus,
} from '../../../../../src/types/boardMeeting.types';
import { getBoardMeetings } from "@/api/boardMeetings";
import { useBoardMeetingRequest } from "@/Hooks/useBoardMeetingRequest";
import EventCard, { EventCardBadgeTone } from "./EventCard";
import MyRequests from "./MyRequests";

const BADGES: Record<BoardMeetingRequestStatus, { label: string; tone: EventCardBadgeTone }> = {
    pending: { label: "Requested", tone: "pending" },
    approved: { label: "Invited", tone: "approved" },
    declined: { label: "Declined", tone: "declined" },
};

// Splits meetings into upcoming (soonest first) and past (most recent first).
// Pure function: lives outside the component so it isn't recreated per render.
function splitMeetings(meetings: MemberBoardMeetingDto[]) {
    const upcoming = meetings.filter((m) => !m.isPast).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const past = meetings.filter((m) => m.isPast).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    return { upcoming, past };
}

// --- Memoized list pieces ---

interface MeetingItemProps {
    meeting: MemberBoardMeetingDto;
    showUpcomingBadge: boolean;
    onRequest?: (meeting: MemberBoardMeetingDto) => void;
}

// Cards sit in the half-width left column, so two per row instead of 3–4.
const EVENT_CARD_COLUMN = "col-12 col-sm-6 mb-3";

// Wrapper keeps EventCard from re-rendering when unrelated parent state changes.
const MeetingItem = memo(({ meeting, showUpcomingBadge, onRequest }: MeetingItemProps) => (
    <EventCard
        columnClassName={EVENT_CARD_COLUMN}
        title={meeting.title}
        date={meeting.date}
        subtitle={`${meeting.venue} · ${meeting.time} GST`}
        imageUrl={meeting.imageUrl}
        badge={meeting.myRequest ? BADGES[meeting.myRequest.status] : undefined}
        showUpcomingBadge={showUpcomingBadge}
        onClick={onRequest && (() => onRequest(meeting))}
    />
));
MeetingItem.displayName = "MeetingItem";

interface MeetingsGroupProps {
    title: string;
    emptyText: string;
    meetings: MemberBoardMeetingDto[];
    showUpcomingBadge: boolean;
    onRequest?: (meeting: MemberBoardMeetingDto) => void;
}

const MeetingsGroup = memo(({ title, emptyText, meetings, showUpcomingBadge, onRequest }: MeetingsGroupProps) => (
    <section className="events-group">
        <h4 className="events-group__title">{title}</h4>
        {meetings.length === 0 ? (
            <p className="events-group__empty">{emptyText}</p>
        ) : (
            <div className="products row mt-2">
                {meetings.map((meeting) => (
                    <MeetingItem
                        key={meeting.id}
                        meeting={meeting}
                        showUpcomingBadge={showUpcomingBadge}
                        onRequest={onRequest}
                    />
                ))}
            </div>
        )}
    </section>
));
MeetingsGroup.displayName = "MeetingsGroup";

// --- Component ---
const Events: React.FC = () => {
    const [meetings, setMeetings] = useState<MemberBoardMeetingDto[]>([]);
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
            setMeetings(await getBoardMeetings(controller.signal));
        } catch (err) {
            if (controller.signal.aborted) return;
            console.error("Failed to fetch board meetings", err);
            setFailed(true);
        } finally {
            if (!controller.signal.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        return () => controllerRef.current?.abort();
    }, [load]);

    const { request } = useBoardMeetingRequest(load);

    const { upcoming, past } = useMemo(() => splitMeetings(meetings), [meetings]);
    const requested = useMemo(() => meetings.filter((m) => m.myRequest), [meetings]);

    const retry = () => {
        setLoading(true);
        load();
    };

    return (
        <div className="dash-section economic-insights">
            <div className="dash-header">
                <h3>Events</h3>
            </div>

            {/* Meetings on the left, My Requests on the right, top-aligned; stacked below lg. */}
            <div className="row align-items-start events-columns">
                <div className="col-12 col-lg-6">
                    {loading ? (
                        <Loader />
                    ) : failed ? (
                        <p className="my-events-empty">
                            Could not load board meetings.
                            <button type="button" className="my-events-action ms-2" onClick={retry}>
                                Retry
                            </button>
                        </p>
                    ) : (
                        <>
                            <MeetingsGroup
                                title="Upcoming Meetings"
                                emptyText="No upcoming meetings."
                                meetings={upcoming}
                                showUpcomingBadge
                                onRequest={request}
                            />
                            <MeetingsGroup
                                title="Past Meetings"
                                emptyText="No past meetings."
                                meetings={past}
                                showUpcomingBadge={false}
                            />
                        </>
                    )}
                </div>

                <div className="col-12 col-lg-6">
                    {!loading && !failed && <MyRequests items={requested} />}
                </div>
            </div>
        </div>
    );
};

export default Events;
