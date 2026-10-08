import React, { useCallback, useEffect, useRef, useState } from "react";
import Loader from "@/Components/Loader/Loader";
import { useModal } from "@/Providers/ModalContext";
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import { useToast } from "@/Providers/ToastContext";
import { adminDeleteMeeting, adminListMeetings, apiErrorMessage } from "@/api/boardMeetings";
import type { AdminBoardMeetingDto } from "../../../../../src/types/boardMeeting.types";
import MeetingForm from "./MeetingForm";
import { formatDay } from "./format";

interface MeetingsTableProps {
    /** Called after any change, so the parent can refresh its pending-requests badge. */
    onChanged?: () => void;
}

const MeetingsTable: React.FC<MeetingsTableProps> = ({ onChanged }) => {
    const [meetings, setMeetings] = useState<AdminBoardMeetingDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { openModal, closeModal } = useModal();
    const { confirm } = useConfirm();
    const { show } = useToast();

    // The form is rendered from the modal provider with the callbacks captured at open time;
    // closeModal is only effective in its latest version, so call it through a ref.
    const closeModalRef = useRef(closeModal);
    closeModalRef.current = closeModal;

    const load = useCallback(async () => {
        try {
            setFailed(false);
            setMeetings(await adminListMeetings());
        } catch (error) {
            console.error("Failed to fetch board meetings", error);
            setFailed(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const changed = () => {
        load();
        onChanged?.();
    };

    const openForm = (meeting?: AdminBoardMeetingDto) =>
        openModal({
            title: meeting ? "Edit meeting" : "New meeting",
            content: (
                <MeetingForm
                    meeting={meeting}
                    onSaved={() => {
                        closeModalRef.current();
                        changed();
                    }}
                    onCancel={() => closeModalRef.current()}
                />
            ),
        });

    const remove = async (meeting: AdminBoardMeetingDto) => {
        const requests = meeting.counts.pending + meeting.counts.approved + meeting.counts.declined;
        const confirmed = await confirm({
            title: "Delete meeting",
            message: `Delete “${meeting.title}”? This also removes ${requests} request(s).`,
            confirmText: "Delete",
            cancelText: "Cancel",
        });
        if (!confirmed) return;

        setDeletingId(meeting.id);
        try {
            await adminDeleteMeeting(meeting.id);
            show({ type: "success", message: "Meeting deleted" });
            changed();
        } catch (error) {
            show({ type: "error", message: apiErrorMessage(error, "Failed to delete the meeting") });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section className="bm-card">
            <div className="bm-card__header">
                <h4>Meetings</h4>
                <button type="button" className="dashboard-btn" onClick={() => openForm()}>
                    New meeting
                </button>
            </div>

            {loading ? (
                <Loader />
            ) : failed ? (
                <p className="bm-empty">
                    Could not load meetings.
                    <button type="button" className="bm-action ms-2" onClick={load}>Retry</button>
                </p>
            ) : meetings.length === 0 ? (
                <p className="bm-empty">No meetings yet. Create the first one with “New meeting”.</p>
            ) : (
                <div className="bm-table-wrap">
                    <table className="bm-table">
                        <thead>
                            <tr>
                                <th>Date &amp; time</th>
                                <th>Title</th>
                                <th>Venue</th>
                                <th>Location</th>
                                <th>Approved</th>
                                <th>Pending</th>
                                <th aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {meetings.map((meeting) => (
                                <tr key={meeting.id} className={meeting.isPast ? "bm-row--past" : undefined}>
                                    <td className="bm-nowrap">
                                        {formatDay(meeting.date)}
                                        <div className="bm-muted">{meeting.time} GST{meeting.isPast ? " · past" : ""}</div>
                                    </td>
                                    <td>{meeting.title}</td>
                                    <td>{meeting.venue}</td>
                                    <td>{meeting.location}</td>
                                    <td className="bm-nowrap">{meeting.counts.approved} / {meeting.capacity}</td>
                                    <td>{meeting.counts.pending}</td>
                                    <td className="bm-actions">
                                        <button type="button" className="bm-action" onClick={() => openForm(meeting)}>
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="bm-action bm-action--danger"
                                            disabled={deletingId === meeting.id}
                                            onClick={() => remove(meeting)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default MeetingsTable;
