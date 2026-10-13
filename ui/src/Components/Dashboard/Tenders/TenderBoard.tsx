import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { EnvContext } from "@/EnvContext.jsx";
import Loader from "@/Components/Loader/Loader";
import { useToast } from "@/Providers/ToastContext";
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import ModalDialog from "@/Components/Generic/Dialog/Dialog";
import { apiErrorMessage, closeTender, createTender, listTenders } from "@/api/tenders";
import type { TenderListItem } from "../../../../../src/types/tender.types";
import { INDUSTRY_SECTORS } from "../../../../../src/config/industrySectors";

const SECTOR_GATED_ROLES = ["admin", "procurement"];
const EMPTY_FORM = { sector: "", publisher: "", announcement: "", publishedAt: "", deadline: "" };

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const TenderBoard: React.FC = () => {
    const userProfile = useSelector((state: RootState) => state.auth?.user);
    const { show } = useToast();
    const { confirm } = useConfirm();
    const env: any = useContext(EnvContext);

    const role = userProfile?.role ?? "user";
    const ownSectors = useMemo(
        () => ((userProfile as any)?.industrySectors as string[] | undefined) ?? [],
        [userProfile]
    );
    const isSectorGatedRole = SECTOR_GATED_ROLES.includes(role);
    const selectableSectors = isSectorGatedRole ? INDUSTRY_SECTORS : ownSectors;

    const [selectedSectors, setSelectedSectors] = useState<string[]>(
        selectableSectors[0] ? [selectableSectors[0]] : []
    );
    const [items, setItems] = useState<TenderListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [closingId, setClosingId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const isDirty = () =>
        Boolean(form.sector || form.publisher || form.announcement || form.publishedAt || form.deadline || file);

    const resetAndClose = () => {
        setForm(EMPTY_FORM);
        setFile(null);
        setFormError(null);
        setModalOpen(false);
    };

    // Escape, an outside click, or the ✕ all route here; unsaved work is confirmed first.
    const requestClose = async () => {
        if (submitting || confirming) return;
        if (isDirty()) {
            setConfirming(true);
            const discard = await confirm({
                title: "Discard this tender?",
                message: "You have unsaved work in this form. Do you want to close it and lose your changes?",
                confirmText: "Discard",
                cancelText: "Keep editing",
            });
            setConfirming(false);
            if (!discard) return;
        }
        resetAndClose();
    };

    const load = useCallback(async () => {
        if (selectedSectors.length === 0) {
            setItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // The API filters by a single sector, so fetch each selected sector and merge.
            const results = await Promise.all(selectedSectors.map((sector) => listTenders(sector)));
            const byId = new Map(results.flat().map((tender) => [tender.id, tender]));
            const merged = Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setItems(merged);
        } catch (error) {
            show({ type: "error", message: apiErrorMessage(error, "Failed to load tenders") });
        } finally {
            setLoading(false);
        }
    }, [selectedSectors, show]);

    useEffect(() => {
        load();
    }, [load]);

    // While the create modal is open, Escape asks before discarding unsaved work.
    useEffect(() => {
        if (!modalOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !confirming) {
                e.preventDefault();
                e.stopPropagation();
                requestClose();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalOpen, form, file, submitting, confirming]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCreate = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setFormError(null);

        if (!form.sector || !form.publisher || !form.announcement || !form.publishedAt || !form.deadline) {
            setFormError("Publisher, announcement, publish date and deadline are all required.");
            return;
        }

        setSubmitting(true);
        try {
            const created = await createTender(form, file);
            show({ type: "success", message: "Tender created" });
            if (selectedSectors.includes(created.sector)) {
                setItems((current) => [created, ...current]);
            }
            resetAndClose();
        } catch (error) {
            setFormError(apiErrorMessage(error, "Failed to create tender"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = async (id: string) => {
        setClosingId(id);
        try {
            const updated = await closeTender(id);
            setItems((current) => current.map((item) => (item.id === id ? updated : item)));
        } catch (error) {
            show({ type: "error", message: apiErrorMessage(error, "Failed to close tender") });
        } finally {
            setClosingId(null);
        }
    };

    return (
        <div className="dash-section tenders">
            <div className="dash-header">
                <h3>Tenders</h3>
                <button
                    type="button"
                    className="btn btn-primary-contrast"
                    onClick={() => setModalOpen(true)}
                >
                    Create Tender
                </button>
            </div>

            {!isSectorGatedRole && (
                <div className="tender-header">
                    <div className="tender-header__sectors">Your industry sectors</div>
                </div>
            )}

            <div className="tender-filter">
                <div className="tender-multiselect">
                    {selectedSectors.map((sector) => (
                        <span key={sector} className="tender-tag">
                            {sector}
                            <button
                                type="button"
                                className="tender-tag__remove"
                                aria-label={`Remove ${sector}`}
                                onClick={() =>
                                    setSelectedSectors((current) => current.filter((s) => s !== sector))
                                }
                            >
                                &times;
                            </button>
                        </span>
                    ))}
                    <select
                        className="tender-multiselect__select"
                        value=""
                        onChange={(event) => {
                            const sector = event.target.value;
                            if (sector && !selectedSectors.includes(sector)) {
                                setSelectedSectors((current) => [...current, sector]);
                            }
                        }}
                    >
                        <option value="">
                            {selectedSectors.length ? "Add a sector…" : "Select a sector…"}
                        </option>
                        {selectableSectors
                            .filter((sector) => !selectedSectors.includes(sector))
                            .map((sector) => (
                                <option key={sector} value={sector}>
                                    {sector}
                                </option>
                            ))}
                    </select>
                </div>
            </div>

            {modalOpen && (
                <ModalDialog
                    title="Create Tender"
                    content={
                        <form className="tender-create" onSubmit={handleCreate}>
                            {formError && <p className="tender-create__error">{formError}</p>}
                            <div className="tender-create__row">
                                <select name="sector" value={form.sector} onChange={handleFormChange} required>
                                    <option value="">Select sector…</option>
                                    {selectableSectors.map((sector) => (
                                        <option key={sector} value={sector}>
                                            {sector}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    name="publisher"
                                    placeholder="Who is publishing the tender"
                                    value={form.publisher}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                            <div className="tender-create__row">
                                <textarea
                                    name="announcement"
                                    placeholder="What is being publicly announced"
                                    value={form.announcement}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                            <div className="tender-create__row">
                                <label>
                                    Published on
                                    <input
                                        type="date"
                                        name="publishedAt"
                                        value={form.publishedAt}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </label>
                                <label>
                                    Submission deadline
                                    <input
                                        type="date"
                                        name="deadline"
                                        value={form.deadline}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </label>
                            </div>
                            <div className="tender-create__row">
                                <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                            </div>
                        </form>
                    }
                    confirmText={submitting ? "Creating…" : "Create Tender"}
                    disabled={submitting}
                    cancelText="Cancel"
                    onConfirm={() => handleCreate()}
                    onCancel={requestClose}
                />
            )}

            {loading ? (
                <Loader />
            ) : selectedSectors.length === 0 ? (
                <p className="tender-empty">Select a sector above to view tenders.</p>
            ) : items.length === 0 ? (
                <p className="tender-empty">No tenders yet for the selected sector(s).</p>
            ) : (
                <ul className="tender-list">
                    {items.map((item) => (
                        <li key={item.id} className="tender-row">
                            <div className="tender-row__top">
                                <span className="tender-row__sector">{item.sector}</span>
                                <span className={`tender-status tender-status--${item.status}`}>{item.status}</span>
                            </div>
                            <p className="tender-row__announcement">{item.announcement}</p>
                            <div className="tender-row__meta">
                                Published by {item.publisher} on {formatDate(item.publishedAt)} · Deadline{" "}
                                {formatDate(item.deadline)}
                                {item.attachment && (
                                    <>
                                        {" "}
                                        ·{" "}
                                        <a
                                            href={`${env.VITE_SERVER_API_URL}/uploads/${item.attachment.filename}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {item.attachment.originalName}
                                        </a>
                                    </>
                                )}
                            </div>
                            <div className="tender-row__contact">
                                {item.creator.email} — Please contact me for any further details.
                            </div>
                            {role === "admin" && item.status === "open" && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger tender-row__close"
                                    disabled={closingId === item.id}
                                    onClick={() => handleClose(item.id)}
                                >
                                    {closingId === item.id ? "Closing…" : "Close"}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TenderBoard;
