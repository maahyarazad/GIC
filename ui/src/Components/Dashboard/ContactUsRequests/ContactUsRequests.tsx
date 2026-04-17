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
import { Field } from "formik";
import { ContactUsSubmission } from "../../../../../src/models/contactus.model";


interface RegisterModel {
    name: string;
    email: string;
    password: string | null;
    phone: string | null;
    authorize: boolean;
    remark: string | null;
    rowId: string;
}


export const ContactUsRequests = () => {
    const { show } = useToast();
    const { openModal } = useModal();
    const env = useContext(EnvContext);
    const [authorizationMessage, setAuthorizationMessage] = useState("");
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
            width: "8%",
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
            width: "12%",
            sortable: false,
            filterable: false,
         renderCell: (row) => {
    if (row.userId) {
        return (
            <span className="">Request Approved</span> 
        );
    }

    return authorizingRows[row.id] ? (
        <div className="d-flex justify-content-center align-items-center">
            <Loader size={15} />
        </div>
    ) : (
        <button
            className="btn btn-sm dashboard-btn"
            onClick={() =>
                openModal({
                    variant: "default",
                    title: `Comment for Authorizing Access to This Request - ${row.fullName}`,
                    content: (
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                            <input
                                className="co-field"
                                value={authorizationMessage}
                                onChange={(e) => setAuthorizationMessage(e.target.value)}
                            />
                        </div>
                    ),
                    cancelText: "Close",
                    confirmText: "Authorize User Access",
                    onCancel: () => {},
                    onConfirm: () => {
                        const payload: RegisterModel = {
                            name: row.fullName,
                            email: row.email,
                            password: "",
                            phone: row.phone?.toString() || "",
                            authorize: true,
                            remark: authorizationMessage,
                            rowId: row.id
                        };
                        registerUser(payload);
                    },
                })
            }
        >
            Authorize Access
        </button>
    );
}
        },
    ];

    const registerUser = async (payload: RegisterModel) => {


        try {

            setAuthorizingRows(prev => ({ ...prev, [payload.rowId]: true }));
            const response = await axiosInstance.post("/contact-us/authorize-user", payload);

            show({
                type: "success",
                message: response?.data?.message,
            });




        } catch (err: any) {
            show({ type: "error", message: err!.message })

        } finally {
            setAuthorizingRows(prev => ({ ...prev, [payload.rowId]: false }));
        }
    }

    const [authorizingRows, setAuthorizingRows] = useState<Record<string, boolean>>({});

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
            debugger;
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