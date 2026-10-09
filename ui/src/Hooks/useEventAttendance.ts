import { useCallback, useRef, useState } from "react";
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import { useToast } from "@/Providers/ToastContext";
import { apiErrorCode, apiErrorMessage, confirmAttendance } from "@/api/events";
import { MemberEventDto } from "../../../src/types/event.types";

const formatDay = (date: string) => {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const ALREADY_ATTENDING = "You're already attending this event";
const FULLY_BOOKED = "This event is fully booked";

/**
 * Confirm → POST attendance → toast. Shared by Dashboard → Events and the public Events page.
 * `onChanged` runs after every server response so the caller can refetch.
 */
export function useEventAttendance(onChanged: () => void) {
    const { confirm: askConfirm } = useConfirm();
    const { show } = useToast();
    const inFlight = useRef(false);
    const [pendingId, setPendingId] = useState<string | null>(null);

    // Latest callbacks without making them dependencies: useConfirm's confirm is not memoized,
    // and a stable `confirm` keeps memoized cards from re-rendering.
    const onChangedRef = useRef(onChanged);
    onChangedRef.current = onChanged;
    const askConfirmRef = useRef(askConfirm);
    askConfirmRef.current = askConfirm;

    const confirm = useCallback(async (event: MemberEventDto) => {
        if (event.isPast || inFlight.current) return;

        if (event.myAttendance) {
            show({ type: "info", message: ALREADY_ATTENDING });
            return;
        }
        if (event.isFull) {
            show({ type: "info", message: FULLY_BOOKED });
            return;
        }

        inFlight.current = true;
        try {
            const confirmed = await askConfirmRef.current({
                title: "Confirm attendance",
                message: `Confirm your attendance at “${event.title}” on ${formatDay(event.date)} at ${event.time} (GST)?`,
                confirmText: "Confirm attendance",
                cancelText: "Cancel",
            });
            if (!confirmed) return;

            setPendingId(event.id);
            try {
                const result = await confirmAttendance(event.id);
                if (result.kind === "created") {
                    show({ type: "success", message: "Your attendance is confirmed. A confirmation email is on its way." });
                } else {
                    show({ type: "info", message: ALREADY_ATTENDING });
                }
            } catch (error) {
                const code = apiErrorCode(error);
                if (code === "EVENT_FULL" || code === "EVENT_PAST") {
                    show({ type: "info", message: apiErrorMessage(error, FULLY_BOOKED) });
                } else {
                    show({ type: "error", message: apiErrorMessage(error, "Failed to confirm your attendance. Please try again.") });
                }
            } finally {
                onChangedRef.current();
            }
        } finally {
            inFlight.current = false;
            setPendingId(null);
        }
    }, [show]);

    return { confirm, pendingId };
}
