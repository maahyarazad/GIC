import React, { useCallback, useEffect, useRef, useState } from "react";
import "./RecommendationLetters.css";
import Loader from "@/Components/Loader/Loader";
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import { useToast } from "@/Providers/ToastContext";
import {
    apiErrorCode,
    apiErrorMessage,
    getLetterRequest,
    listLetterRequests,
    sendLetter,
} from "@/api/recommendationLetters";
import type {
    LetterRequestDetail,
    LetterRequestListItem,
} from "../../../../../src/types/recommendationLetter.types";
import LetterRequestList from "./LetterRequestList";
import LetterEditor, { type SubmitLetter } from "./LetterEditor";

const NOT_SAVED_MESSAGE = "Complete and save the letter before sending";

const formatDay = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const RecommendationLetters: React.FC = () => {
    const [items, setItems] = useState<LetterRequestListItem[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [listFailed, setListFailed] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<LetterRequestDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const dirtyRef = useRef(false);
    const submitRef = useRef<SubmitLetter | null>(null);

    const { confirm } = useConfirm();
    const { show } = useToast();

    const loadList = useCallback(async () => {
        try {
            setListFailed(false);
            setItems(await listLetterRequests());
        } catch (error) {
            console.error("Failed to fetch letter requests", error);
            setListFailed(true);
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const onDirtyChange = useCallback((dirty: boolean) => {
        dirtyRef.current = dirty;
    }, []);

    // Reloading or closing the browser with unsaved edits asks first.
    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => {
            if (!dirtyRef.current) return;
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, []);

    const loadDetail = async (id: string) => {
        setDetailLoading(true);
        try {
            setDetail(await getLetterRequest(id));
        } catch (error) {
            setDetail(null);
            show({ type: "error", message: apiErrorMessage(error, "Failed to load the letter") });
        } finally {
            setDetailLoading(false);
        }
    };

    const select = async (id: string) => {
        if (id === selectedId) return;
        if (dirtyRef.current) {
            const discard = await confirm({
                title: "Unsaved changes",
                message: "Discard your unsaved changes to this letter?",
                confirmText: "Discard",
                cancelText: "Keep editing",
            });
            if (!discard) return;
        }
        dirtyRef.current = false;
        setSelectedId(id);
        await loadDetail(id);
    };

    const onSaved = (updated: LetterRequestDetail) => {
        setDetail(updated);
        loadList();
    };

    const send = async (item: LetterRequestListItem) => {
        if (item.letterStatus === "new") {
            await select(item.id);
            show({ type: "info", message: NOT_SAVED_MESSAGE });
            return;
        }

        const isOpenAndDirty = item.id === selectedId && dirtyRef.current;
        const alreadySent =
            item.letterStatus === "sent" && item.sentAt ? ` It was already sent on ${formatDay(item.sentAt)}.` : "";

        const confirmed = await confirm(
            isOpenAndDirty
                ? {
                    title: "Unsaved changes",
                    message: `Save your changes and send the letter to ${item.requester.email}?${alreadySent}`,
                    confirmText: "Save & send",
                    cancelText: "Cancel",
                }
                : {
                    title: "Send letter",
                    message: `Email the letter (${item.reference}.pdf) to ${item.requester.email}?${alreadySent}`,
                    confirmText: "Send",
                    cancelText: "Cancel",
                }
        );
        if (!confirmed) return;

        setBusyId(item.id);
        try {
            if (isOpenAndDirty) {
                if (!submitRef.current) throw new Error("The editor is not ready. Please try again.");
                await submitRef.current();
            }
            const { message, detail: updated } = await sendLetter(item.id);
            show({ type: "success", message });
            if (item.id === selectedId) setDetail(updated);
        } catch (error) {
            if (apiErrorCode(error) === "LETTER_NOT_SAVED") {
                await select(item.id);
                show({ type: "info", message: NOT_SAVED_MESSAGE });
            } else {
                show({ type: "error", message: apiErrorMessage(error, (error as Error)?.message || "Failed to send the letter") });
            }
            // A failed send is recorded on the request; show it.
            if (item.id === selectedId) loadDetail(item.id);
        } finally {
            setBusyId(null);
            loadList();
        }
    };

    return (
        <div className="dash-section recommendation-letters">
            <div className="dash-header">
                <h3>Recommendation Letters</h3>
            </div>

            <div className="rl-grid">
                <section className="rl-card">
                    <h4>Requests</h4>
                    {listLoading ? (
                        <Loader />
                    ) : listFailed ? (
                        <p className="rl-empty">
                            Could not load letter requests.
                            <button type="button" className="rl-action ms-2" onClick={loadList}>Retry</button>
                        </p>
                    ) : (
                        <LetterRequestList
                            items={items}
                            selectedId={selectedId}
                            onSelect={select}
                            onSend={send}
                            busyId={busyId}
                        />
                    )}
                </section>

                <section className="rl-card">
                    {detailLoading ? (
                        <Loader />
                    ) : detail ? (
                        <LetterEditor
                            key={`${detail.id}:${detail.savedAt ?? ""}`}
                            detail={detail}
                            onSaved={onSaved}
                            onDirtyChange={onDirtyChange}
                            submitRef={submitRef}
                        />
                    ) : (
                        <p className="rl-empty">Select a request to edit its letter.</p>
                    )}
                </section>
            </div>
        </div>
    );
};

export default RecommendationLetters;
