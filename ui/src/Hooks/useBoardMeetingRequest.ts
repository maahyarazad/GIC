import { useCallback, useRef, useState } from "react";
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import { useToast } from "@/Providers/ToastContext";
import { apiErrorMessage, requestToJoin } from "@/api/boardMeetings";
import {
    MemberBoardMeetingDto,
    REQUEST_STATUS_LABELS,
    BoardMeetingRequestStatus,
} from "../../../src/types/boardMeeting.types";

const formatDay = (date: string) => {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const alreadyRequested = (status: BoardMeetingRequestStatus) =>
    `You already requested this meeting (${REQUEST_STATUS_LABELS[status]})`;

/**
 * Confirm → POST join request → toast. Shared by Dashboard → Events and the Boardroom page.
 * `onChanged` runs after every server response so the caller can refetch.
 */
export function useBoardMeetingRequest(onChanged: () => void) {
    const { confirm } = useConfirm();
    const { show } = useToast();
    const inFlight = useRef(false);
    const [pendingId, setPendingId] = useState<string | null>(null);

    // Latest callbacks without making them dependencies: useConfirm's confirm is not memoized,
    // and a stable `request` keeps memoized cards from re-rendering.
    const onChangedRef = useRef(onChanged);
    onChangedRef.current = onChanged;
    const confirmRef = useRef(confirm);
    confirmRef.current = confirm;

    const request = useCallback(async (meeting: MemberBoardMeetingDto) => {
        if (meeting.isPast || inFlight.current) return;

        if (meeting.myRequest) {
            show({ type: "info", message: alreadyRequested(meeting.myRequest.status) });
            return;
        }

        inFlight.current = true;
        try {
            const confirmed = await confirmRef.current({
                title: "Request to join",
                message: `Send a request to join “${meeting.title}” on ${formatDay(meeting.date)} at ${meeting.time} (GST)?`,
                confirmText: "Send request",
                cancelText: "Cancel",
            });
            if (!confirmed) return;

            setPendingId(meeting.id);
            try {
                const result = await requestToJoin(meeting.id);
                if (result.kind === "created") {
                    show({ type: "success", message: "Your request has been sent to the board meeting" });
                } else {
                    show({ type: "info", message: alreadyRequested(result.status) });
                }
            } catch (error) {
                show({ type: "error", message: apiErrorMessage(error, "Failed to send your request. Please try again.") });
            } finally {
                onChangedRef.current();
            }
        } finally {
            inFlight.current = false;
            setPendingId(null);
        }
    }, [show]);

    return { request, pendingId };
}
