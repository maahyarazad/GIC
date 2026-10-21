import React, { useEffect, useState, useCallback, useRef } from "react";
import { GenericDataGrid, Column, PaginationModel, SortModel, FilterModel } from "../../GenericDataGrid/GenericDataGrid"; // import your generic grid
import axiosInstance from "../../../api/axiosInstance";
import { NewsletterSubscriber } from '../../../../../src/types/newsletterSubscriber.types';
import Loader from "@/Components/Loader/Loader";
import { useToast } from "../../../Providers/ToastContext";
import { useModal } from "@/Providers/ModalContext";
import { FaCheck, FaTimes } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import "./NewsletterSubscribers.css";
import type { BulkAddSubscribersResult } from '../../../../../src/types/newsletterSubscriber.types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BULK_EMAILS = 200;

/** Splits pasted text (commas, semicolons, spaces, new lines) into unique, lowercased candidates. */
const parseEmails = (text: string): string[] =>
  Array.from(new Set(text.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean)));

/** Textarea for the "Add subscribers" modal. Writes the raw text to a ref the parent reads on confirm. */
const AddSubscribersInput: React.FC<{
    textRef: React.MutableRefObject<string>;
    onValidityChange: (valid: boolean) => void;
}> = ({ textRef, onValidityChange }) => {
    const [value, setValue] = useState("");
    const emails = parseEmails(value);
    const validCount = emails.filter((e) => EMAIL_RE.test(e)).length;
    return (
        <div>
            <label className="form-label">Email addresses</label>
            <textarea
                className="form-control"
                rows={6}
                value={value}
                placeholder="name@example.com, other@example.com"
                onChange={(e) => {
                    setValue(e.target.value);
                    textRef.current = e.target.value;
                    onValidityChange(parseEmails(e.target.value).some((m) => EMAIL_RE.test(m)));
                }}
            />
            <small className="text-muted">
                {validCount} valid email{validCount === 1 ? "" : "s"} · separate with commas, spaces or new lines · up to {MAX_BULK_EMAILS} at a time
            </small>
        </div>
    );
};


export const NewsletterSubscribers = () => {
    const { show } = useToast();
    const { openModal, setModalDisabled } = useModal();
    const addTextRef = useRef("");
    
    const columns: Column<NewsletterSubscriber>[] = [
        {
            field: "_id",
            headerName: "ID",
            width: '10%',
        },
        {
            field: "active",
            headerName: "Active",
            width: '5%',
            sortable: true,
            // filterable: true,
            renderCell: (params) => (
                <div style={{ display: "flex", alignItems: "center" }}>
                    {params.active ? (
                        <FaCheck style={{ color: "green", fontSize: "18px" }} />
                    ) : (
                        <FaTimes style={{ color: "red", fontSize: "18px" }} />
                    )}
                </div>
            ),
        }
        ,
        {
            field: "email",
            headerName: "email",
            sortable: true,
            filterable: true,
            width: '10%',
        },


        {
            field: "type",
            headerName: "Type",
            width: '8%',
            renderCell: (row) => (
                <span
                    className={`subscriber-type subscriber-type--${row.type === "internal" ? "internal" : "external"}`}
                    title={row.type === "internal" ? "Registered user" : "Not a registered user"}
                >
                    {row.type === "internal" ? "Internal" : "External"}
                </span>
            ),
        },
        {
            field: "createdAt",
            headerName: "Created At",
            sortable: true,
            width: '10%',
            renderCell: (row) =>
                row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
        },
        {
            field: "updatedAt",
            headerName: "Updated At",
            sortable: true,
            width: '10%',
            renderCell: (row) =>
                row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "—",
        },


    ];

    const [rows, setRows] = useState<NewsletterSubscriber[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState<PaginationModel>({
        page: 1,
        pageSize: 10,
    });
    const [sortModel, setSortModel] = useState<SortModel<NewsletterSubscriber> | null>(null);
    const [filterModel, setFilterModel] = useState<FilterModel<NewsletterSubscriber>[] | null>(
        null
    );
    const [loading, setLoading] = useState(false);

    const fetchNewsletterSubscribers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            // Map pagination: limit & skip
            params.append("limit", paginationModel.pageSize.toString());
            params.append("skip", ((paginationModel.page - 1) * paginationModel.pageSize).toString());

            // Map sort
            if (sortModel) {
                params.append("sortBy", String(sortModel.field));
                params.append("sortOrder", sortModel.sort);
            }

            // Add filter
            if (filterModel && filterModel.length > 0) {
                params.append("filters", JSON.stringify(filterModel));
            }

            const response = await axiosInstance.get("/newsletter", { params });

            setRows(response.data.data.subscribers);
            setRowCount(response.data.data.total);
        } catch (err) {
            console.error("Failed to fetch newsletter subscribers:", err);
        } finally {
            setLoading(false);
        }
    }, [paginationModel, sortModel, filterModel]);

    useEffect(() => {
        fetchNewsletterSubscribers();
    }, [fetchNewsletterSubscribers]);

    const handleAddSubscribers = () => {
        addTextRef.current = "";
        openModal({
            variant: "default",
            title: "Add subscribers",
            content: (
                <AddSubscribersInput
                    textRef={addTextRef}
                    onValidityChange={(valid) => setModalDisabled(!valid)}
                />
            ),
            confirmText: "Add",
            disabled: true,
            onConfirm: async () => {
                const emails = parseEmails(addTextRef.current);
                if (emails.length === 0) return;
                if (emails.length > MAX_BULK_EMAILS) {
                    show({ type: "error", message: `Add up to ${MAX_BULK_EMAILS} emails at a time` });
                    return;
                }
                try {
                    const res = await axiosInstance.post("/newsletter/admin/bulk", { emails });
                    const r: BulkAddSubscribersResult = res.data.data;
                    show({
                        type: r.added + r.reactivated > 0 ? "success" : "error",
                        message:
                            `Added ${r.added}, re-activated ${r.reactivated}, already subscribed ${r.duplicates}` +
                            (r.invalid.length ? `, invalid ${r.invalid.length} (${r.invalid.slice(0, 3).join(", ")}${r.invalid.length > 3 ? "…" : ""})` : ""),
                    });
                    fetchNewsletterSubscribers();
                } catch (err: any) {
                    console.error("Failed to add subscribers:", err);
                    show({ type: "error", message: err.message || "Failed to add subscribers" });
                }
            },
        });
    };



    return (
        <div className="dash-section dash-section--grid">
            <div className="dash-header">
                <h3>Newsletter Subscribers</h3>
                <button type="button" className="dashboard-btn" onClick={handleAddSubscribers}>
                    <FaPlus /> Add subscribers
                </button>
            </div>

            {loading ? (
                <Loader />
            ) : (
                <GenericDataGrid<NewsletterSubscriber>
                    rows={rows}
                    prevButtonClassName="dashboard-btn--ghost-minimal"
                    nextButtonClassName="dashboard-btn--ghost-minimal"
                    columns={columns}
                    rowCount={rowCount}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    sortModel={sortModel}
                    onSortModelChange={setSortModel}
                    filterModel={filterModel}
                    onFilterModelChange={setFilterModel}
                    getRowId={(row) => row._id!.toString()}
                />
            )}
        </div>
    );
};
