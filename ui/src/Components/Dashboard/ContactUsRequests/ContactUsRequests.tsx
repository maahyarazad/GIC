import React, { useEffect, useState, useCallback, useMemo, useContext } from "react";
import {
    GenericDataGrid,
    Column,
    PaginationModel,
    SortModel,
    FilterModel,
} from "../../GenericDataGrid/GenericDataGrid";
import axiosInstance from "../../../api/axiosInstance";
import { useToast } from "../../../providers/ToastContext";
import { useModal } from "@/Providers/ModalContext";
import debounce from "@/Hooks/useDebounce";
import Loader from "@/Components/Loader/Loader";
import { EnvContext } from '@/EnvContext.js';

import { ContactUsSubmission } from "../../../../../src/models/contactus.model";
export const ContactUsRequests = () => {
    const { show } = useToast();
    const { openModal } = useModal();
const env = useContext(EnvContext);
console.log(env)
    const columns: Column<ContactUsSubmission>[] = [
        {
            field: "fullName",
            headerName: "Full Name",
            sortable: true,
            filterable: true,
            width: "14%",
        },
        {
            field: "company",
            headerName: "Company",
            sortable: true,
            filterable: true,
            width: "12%",
            renderCell: (row) => row.company || "—",
        },
        {
            field: "email",
            headerName: "Email",
            sortable: true,
            filterable: true,
            width: "15%",
        },
        {
            field: "phone",
            headerName: "Phone",
            sortable: true,
            filterable: true,
            width: "10%",
            renderCell: (row) => row.phone || "—",
        },
        {
            field: "industry",
            headerName: "Industry",
            sortable: true,
            filterable: true,
            width: "12%",
        },
        {
            field: "countryOfInterest",
            headerName: "Country of Interest",
            sortable: true,
            filterable: true,
            width: "12%",
            renderCell: (row) => row.countryOfInterest || "—",
        },
        {
            field: "referredBy",
            headerName: "Referred By",
            sortable: true,
            filterable: true,
            width: "10%",
            renderCell: (row) => row.referredBy || "—",
        },
        {
            field: "createdAt",
            headerName: "Created At",
            sortable: true,
            filterable: false,
            width: "10%",
            renderCell: (row) =>
                row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
        },
        {
            headerName: "Attachment",
            width: "8%",
            sortable: false,
            filterable: false,
            renderCell: (row) =>
                row.attachment?.filename ? (
                    <button
                        className="btn btn-sm dashboard-btn"
                        onClick={() =>
                            window.open(
                                row.attachment?.path
                                    ? `${env.VITE_SERVER_API_URL}/uploads/${row.attachment.filename}`
                                    : "#",
                                "_blank"
                            )
                        }
                    >
                        View
                    </button>
                ) : (
                    "—"
                ),
        },
        {
            headerName: "Objective",
            width: "8%",
            sortable: false,
            filterable: false,
            renderCell: (row) => (
                <button
                    className="btn btn-sm dashboard-btn"
                    onClick={() =>
                        openModal({
                            variant: "default",
                            title: `Objective - ${row.fullName}`,
                            content: (
                                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                                    {row.meaObjective || "No objective provided"}
                                </div>
                            ),
                            cancelText: "Close",
                            onCancel: () => { },
                        })
                    }
                >
                    View
                </button>
            ),
        },
        {
            headerName: "Actions",
            width: "8%",
            sortable: false,
            filterable: false,
            renderCell: (row) => (
                <button
                    className="btn btn-sm dashboard-btn"
                    onClick={() =>
                        openModal({
                            variant: "default",
                            title: `Objective - ${row.fullName}`,
                            content: (
                                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                                    {row.meaObjective || "No objective provided"}
                                </div>
                            ),
                            cancelText: "Close",
                            onCancel: () => { },
                        })
                    }
                >
                    View
                </button>
            ),
        },
    ];

    const [rows, setRows] = useState<ContactUsSubmission[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState<PaginationModel>({
        page: 1,
        pageSize: 10,
    });
    const [sortModel, setSortModel] =
        useState<SortModel<ContactUsSubmission> | null>({
            field: "createdAt",
            sort: "desc",
        });
    const [filterModel, setFilterModel] = useState<
        FilterModel<ContactUsSubmission>[] | null
    >(null);
    const [loading, setLoading] = useState(true);

    const fetchContactUsSubmissions = useCallback(async () => {
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
                params.append("filters", JSON.stringify(filterModel));
            }

            const response = await axiosInstance.get("/contact-us", { params });

            setRows(response.data.data.submissions || []);
            setRowCount(response.data.data.total || 0);
        } catch (err: any) {
            console.error("Failed to fetch contact us submissions", err);
            show({
                type: "error",
                message: err?.message || "Failed to fetch contact us submissions",
            });
        } finally {
            setLoading(false);
        }
    }, [paginationModel, sortModel, filterModel, show]);

    const debouncedFetch = useMemo(
        () => debounce(fetchContactUsSubmissions, 400),
        [fetchContactUsSubmissions]
    );

    useEffect(() => {
        debouncedFetch();

        return () => {
            debouncedFetch.cancel();
        };
    }, [debouncedFetch]);

    return (
        <>
            <h3 className="mb">Contact Us Submissions</h3>

            {loading ? (
                <Loader />
            ) : (
                <GenericDataGrid<ContactUsSubmission>
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
        </>
    );
};