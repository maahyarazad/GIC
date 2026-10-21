import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    GenericDataGrid,
    Column,
    PaginationModel,
    SortModel,
    FilterModel,
} from "../../GenericDataGrid/GenericDataGrid";
import axiosInstance from "../../../api/axiosInstance";
import { useToast } from "../../../Providers/ToastContext";
import { useModal } from "@/Providers/ModalContext";
import { FaEye } from "react-icons/fa6";
import debounce from "@/Hooks/useDebounce";
import Loader from "@/Components/Loader/Loader";
import type { EmailLog, EmailLogStatus } from "../../../../../src/types/emailLog.types";
import "./EmailLogs.css";

// GenericDataGrid rows must allow an optional _id; the API returns `id`.
type EmailLogRow = EmailLog & { _id?: string };

/** Local yyyy-mm-dd -> ISO instant at local midnight, optionally shifted by whole days. */
const localDateToIso = (date: string, addDays = 0): string => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + addDays);
    return d.toISOString();
};

const formatSize = (size?: number) =>
    size === undefined || size === null ? "size unknown" : `${Math.max(1, Math.round(size / 1024))} KB`;

const StatusBadge = ({ status }: { status: EmailLogStatus }) => (
    <span className={`email-log-status email-log-status--${status}`}>{status}</span>
);

const EmailLogDetails = ({ log }: { log: EmailLog }) => {
    const list = (values: string[]) => (values.length ? values.join(", ") : "—");
    const items: [string, React.ReactNode][] = [
        ["Status", <StatusBadge status={log.status} />],
        ["Sent at", new Date(log.createdAt).toLocaleString()],
        ["Finished at", log.finishedAt ? new Date(log.finishedAt).toLocaleString() : "—"],
        ["Kind", log.kind],
        ["Subject", log.subject || "—"],
        ["Sender", `${log.sender}${log.from ? ` (${log.from})` : ""}`],
        ["To", list(log.to)],
        ["Cc", list(log.cc)],
        ["Bcc", list(log.bcc)],
        ["Reply-to", log.replyTo || "—"],
        ["Run id", log.runId || "—"],
        ["Message id", log.messageId || "—"],
        [
            "Attachments",
            log.attachments.length
                ? log.attachments
                    .map((a) => `${a.filename || "unnamed"} (${a.contentType || "unknown type"}, ${formatSize(a.size)})`)
                    .join(", ")
                : "—",
        ],
    ];

    return (
        <div className="email-log-details">
            <dl>
                {items.map(([label, value]) => (
                    <React.Fragment key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                    </React.Fragment>
                ))}
            </dl>
            {log.error && (
                <>
                    <h4>Error</h4>
                    <div className="email-log-error">{log.error}</div>
                </>
            )}
        </div>
    );
};

export const EmailLogs = () => {
    const { show } = useToast();
    const { openModal } = useModal();

    const [rows, setRows] = useState<EmailLogRow[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState<PaginationModel>({
        page: 1,
        pageSize: 20,
    });
    const [sortModel, setSortModel] = useState<SortModel<EmailLogRow> | null>({
        field: "createdAt",
        sort: "desc",
    });
    const [filterModel, setFilterModel] = useState<FilterModel<EmailLogRow>[] | null>(null);
    const [status, setStatus] = useState<"" | EmailLogStatus>("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [loading, setLoading] = useState(true);

    const invalidRange = Boolean(fromDate && toDate && fromDate > toDate);

    // Any filter change starts again from the first page.
    useEffect(() => {
        setPaginationModel((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
    }, [status, fromDate, toDate, filterModel]);

    useEffect(() => {
        if (invalidRange) {
            show({ type: "error", message: "From date must be on or before To date" });
        }
    }, [invalidRange, show]);

    const columns: Column<EmailLogRow>[] = [
        {
            field: "createdAt",
            headerName: "Sent at",
            sortable: true,
            width: "15%",
            renderCell: (row) => new Date(row.createdAt).toLocaleString(),
        },
        {
            field: "to",
            headerName: "To",
            filterable: true,
            width: "20%",
            renderCell: (row) => row.to.join(", "),
        },
        {
            field: "subject",
            headerName: "Subject",
            sortable: true,
            filterable: true,
            width: "25%",
        },
        {
            field: "kind",
            headerName: "Kind",
            sortable: true,
            filterable: true,
            width: "14%",
        },
        {
            field: "sender",
            headerName: "Sender",
            sortable: true,
            width: "8%",
        },
        {
            field: "status",
            headerName: "Status",
            sortable: true,
            width: "10%",
            renderCell: (row) => <StatusBadge status={row.status} />,
        },
        {
            headerName: "View",
            width: "8%",
            sortable: false,
            filterable: false,
            renderCell: (row) => (
                <button
                    className="dashboard-btn--icon"
                    title="View"
                    aria-label="View"
                    onClick={() =>
                        openModal({
                            variant: "default",
                            title: `Email - ${row.subject || row.kind}`,
                            content: <EmailLogDetails log={row} />,
                            cancelText: "Close",
                            onCancel: () => { },
                        })
                    }
                >
                    <FaEye />
                </button>
            ),
        },
    ];

    const fetchEmailLogs = useCallback(async () => {
        if (invalidRange) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();

            params.append("limit", paginationModel.pageSize.toString());
            params.append(
                "skip",
                ((paginationModel.page - 1) * paginationModel.pageSize).toString()
            );

            if (sortModel) {
                params.append("sortBy", String(sortModel.field));
                params.append("sortOrder", sortModel.sort);
            }

            if (filterModel && filterModel.length > 0) {
                // The To column searches to, cc and bcc on the server.
                const filters = filterModel.map((f) =>
                    f.field === "to" ? { ...f, field: "recipient" } : f
                );
                params.append("filters", JSON.stringify(filters));
            }

            if (status) params.append("status", status);
            if (fromDate) params.append("from", localDateToIso(fromDate));
            if (toDate) params.append("to", localDateToIso(toDate, 1));

            const response = await axiosInstance.get("/email-logs", { params });

            setRows(response.data.data.logs || []);
            setRowCount(response.data.data.total || 0);
        } catch (err: any) {
            console.error("Failed to fetch email logs", err);
            show({
                type: "error",
                message: err?.message || "Failed to fetch email logs",
            });
        } finally {
            setLoading(false);
        }
    }, [paginationModel, sortModel, filterModel, status, fromDate, toDate, invalidRange, show]);

    const debouncedFetch = useMemo(
        () => debounce(fetchEmailLogs, 400),
        [fetchEmailLogs]
    );

    useEffect(() => {
        debouncedFetch();

        return () => {
            debouncedFetch.cancel();
        };
    }, [debouncedFetch]);

    return (
        <div className="dash-section dash-section--grid">
            <div className="dash-header">
                <h3>Email Logs</h3>
            </div>

            <div className="email-log-toolbar">
                <label>
                    Status
                    <select
                        className="co-field"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as "" | EmailLogStatus)}
                    >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="sent">Sent</option>
                        <option value="failed">Failed</option>
                    </select>
                </label>
                <label>
                    From
                    <input
                        className="co-field"
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                </label>
                <label>
                    To
                    <input
                        className="co-field"
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                    />
                </label>
            </div>

            {loading ? (
                <Loader />
            ) : (
                <GenericDataGrid<EmailLogRow>
                    rows={rows}
                    columns={columns}
                    rowCount={rowCount}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    sortModel={sortModel}
                    onSortModelChange={setSortModel}
                    filterModel={filterModel}
                    onFilterModelChange={setFilterModel}
                    prevButtonClassName="dashboard-btn--ghost-minimal"
                    nextButtonClassName="dashboard-btn--ghost-minimal"
                    getRowId={(row) => row.id}
                />
            )}
        </div>
    );
};

export default EmailLogs;
