import React, { memo, useMemo } from "react";
import { MemberEventDto } from '../../../../../src/types/event.types';
import { toLocalDay } from "./EventCard";

const EMPTY = "—";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };

// Event dates are Dubai calendar days ("YYYY-MM-DD"); parse them as local days, not UTC midnight.
const formatEventDate = (value?: string | null) =>
    toLocalDay(value)?.toLocaleDateString("en-GB", DATE_FORMAT) ?? EMPTY;

const formatTimestamp = (value?: string | null) => {
    if (!value) return EMPTY;
    const date = new Date(value);
    return isNaN(date.getTime()) ? EMPTY : date.toLocaleDateString("en-GB", DATE_FORMAT);
};

const MyEventRow = memo(({ event }: { event: MemberEventDto }) => {
    const attendance = event.myAttendance!;
    return (
        <tr>
            <td>
                {event.title}
                <div className="my-events-muted">{event.venue}</div>
            </td>
            <td>
                {formatEventDate(event.date)}
                <div className="my-events-muted">{event.time} GST</div>
            </td>
            <td>{formatTimestamp(attendance.createdAt)}</td>
            <td className="my-events-ref">{attendance.reference}</td>
        </tr>
    );
});
MyEventRow.displayName = "MyEventRow";

interface MyEventsProps {
    /** Events the signed-in user attends (myAttendance set). */
    items: MemberEventDto[];
}

const MyEvents: React.FC<MyEventsProps> = ({ items }) => {
    const sorted = useMemo(
        () => [...items].sort((a, b) => b.startsAt.localeCompare(a.startsAt)),
        [items]
    );

    return (
        <section className="my-events-card">
            <h4>My Events</h4>
            {sorted.length === 0 ? (
                <p className="my-events-empty">You haven't confirmed attendance at any events yet.</p>
            ) : (
                <div className="my-events-table-wrap">
                    <table className="my-events-table">
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Date &amp; time</th>
                                <th>Confirmed on</th>
                                <th>Reference</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((event) => (
                                <MyEventRow key={event.id} event={event} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default MyEvents;
