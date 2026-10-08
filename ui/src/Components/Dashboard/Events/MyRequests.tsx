import React, { memo, useMemo } from "react";
import {
    MemberBoardMeetingDto,
    REQUEST_STATUS_LABELS,
} from '../../../../../src/types/boardMeeting.types';
import { toLocalDay } from "./EventCard";

const EMPTY = "—";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };

// Meeting dates are Dubai calendar days ("YYYY-MM-DD"); parse them as local days, not UTC midnight.
const formatMeetingDate = (value?: string | null) =>
    toLocalDay(value)?.toLocaleDateString("en-GB", DATE_FORMAT) ?? EMPTY;

const formatTimestamp = (value?: string | null) => {
    if (!value) return EMPTY;
    const date = new Date(value);
    return isNaN(date.getTime()) ? EMPTY : date.toLocaleDateString("en-GB", DATE_FORMAT);
};

const MyRequestRow = memo(({ meeting }: { meeting: MemberBoardMeetingDto }) => {
    const request = meeting.myRequest!;
    return (
        <tr>
            <td>
                {meeting.title}
                <div className="my-events-muted">{meeting.venue}</div>
            </td>
            <td>
                {formatMeetingDate(meeting.date)}
                <div className="my-events-muted">{meeting.time} GST</div>
            </td>
            <td>{formatTimestamp(request.createdAt)}</td>
            <td>
                <span className={`request-status request-status--${request.status}`}>
                    {REQUEST_STATUS_LABELS[request.status]}
                </span>
            </td>
        </tr>
    );
});
MyRequestRow.displayName = "MyRequestRow";

interface MyRequestsProps {
    /** Meetings the signed-in user has requested (myRequest set). */
    items: MemberBoardMeetingDto[];
}

const MyRequests: React.FC<MyRequestsProps> = ({ items }) => {
    const sorted = useMemo(
        () => [...items].sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
        [items]
    );

    return (
        <section className="my-events-card">
            <h4>My Requests</h4>
            {sorted.length === 0 ? (
                <p className="my-events-empty">You haven't requested to join any board meetings yet.</p>
            ) : (
                <div className="my-events-table-wrap">
                    <table className="my-events-table">
                        <thead>
                            <tr>
                                <th>Meeting</th>
                                <th>Date &amp; time</th>
                                <th>Requested on</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((meeting) => (
                                <MyRequestRow key={meeting.id} meeting={meeting} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default MyRequests;
