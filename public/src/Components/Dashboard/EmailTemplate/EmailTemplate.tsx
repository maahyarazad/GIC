import React, { useEffect, useState, useCallback } from "react";
import { GenericDataGrid, Column, PaginationModel, SortModel, FilterModel } from "../../GenericDataGrid/GenericDataGrid";
import axiosInstance from "../../../api/axiosInstance";
import { useToast } from "../../../providers/ToastContext";
import SlideMenu from '../../../Components/Generic/SlideMenu/SlideMenu';
import HtmlCodeEditor from "../HtmlEditor/HtmlEditor";

export interface EmailTemplate {
    _id?: string;
    name: string;
    subject: string;
    html: string;
    text?: string;
    variables?: string[];
    createdAt?: string;
    updatedAt?: string;
}

const EmailTemplatesDataGrid = () => {
    const { show } = useToast();

    const columns: Column<EmailTemplate>[] = [
        { field: "_id", headerName: "ID", width: 180 },
        { field: "name", headerName: "Name", sortable: true, filterable: true, width: 150 },
        { field: "subject", headerName: "Subject", sortable: true, filterable: true, width: 250 },
        { field: "variables", headerName: "Variables", width: 200, renderCell: row => (row.variables?.join(", ") || "—") },
        { field: "createdAt", headerName: "Created At", width: 180, renderCell: row => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—" },
        { field: "updatedAt", headerName: "Updated At", width: 180, renderCell: row => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "—" },
        {
            headerName: "Actions",
            width: 250,
            renderCell: (row) => (
                <div className="btn-group" role="group">
                    <button className="btn btn-sm dashboard-btn" onClick={() => onEdit(row)}>Edit</button>
                    <button className="btn btn-sm dashboard-btn--delete-ghost" onClick={() => onDelete(row)}>Delete</button>
                    <button className="btn btn-sm dashboard-btn" onClick={() => onSendTestEmail(row)}>Send Test Email</button>
                </div>
            ),
            sortable: false,
            filterable: false,
        },
    ];

    const [rows, setRows] = useState<EmailTemplate[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 1, pageSize: 10 });
    const [sortModel, setSortModel] = useState<SortModel<EmailTemplate> | null>(null);
    const [filterModel, setFilterModel] = useState<FilterModel<EmailTemplate>[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("limit", paginationModel.pageSize.toString());
            params.append("skip", ((paginationModel.page - 1) * paginationModel.pageSize).toString());

            if (sortModel) {
                params.append("sortBy", String(sortModel.field));
                params.append("sortOrder", sortModel.sort);
            }

            if (filterModel && filterModel.length > 0) {
                params.append("filters", JSON.stringify(filterModel));
            }

            const response = await axiosInstance.get("/email-templates", { params });
            setRows(response.data.data);
            setRowCount(response.data.data.length);
        } catch (err) {
            console.error("Failed to fetch email templates", err);
        } finally {
            setLoading(false);
        }
    }, [paginationModel, sortModel, filterModel]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);



 const handleSaveTemplate = async (e: any) => {
    e.preventDefault();

    if (!templateName || !subject || !html) {
        show({
            type: "error",
            message: "Please fill all required fields.",
        });
        return;
    }

    try {
        const payload = {
            name: templateName,
            subject,
            html,
        };

        let res;

        // 👉 If id exists → UPDATE
        if (id) {
            res = await axiosInstance.put(`/email-templates/${id}`, payload);
            
            if (res.data.success) {
                show({ type: "success", message: res.data.message });
            }
        } 
        // 👉 If no id → CREATE
        else {
            res = await axiosInstance.post("/email-templates", payload);
            
            if (res.data.success) {
                show({ type: "success", message: res.data.message });
            }
        }

        // Close modal and reload table
        setOpen(false);
        fetchTemplates();
        
    } catch (err: any) {
        show({ type: "error", message: err.message || "Operation failed" });
    }
};




    const onEdit = (row: EmailTemplate) => {
        // Open modal or navigate to template edit page
        setHeaderTitle(`Modify ${row.name}`)
        setId(row._id!);
        setTemplateName(row.name);
        setHtml(row.html);
        setSubject(row.subject);
        setOpen(true);
    };

    const onDelete = async (row: EmailTemplate) => {
        try {
            await axiosInstance.delete(`/email-templates/${row._id}`);
            show({ type: "success", message: "Template deleted successfully" });

            fetchTemplates();
        } catch (err: any) {
            show({ type: "error", message: err.message || "Failed to delete template" });
        }
    };

    const onSendTestEmail = async (row: EmailTemplate) => {

    };

    const [html, setHtml] = useState("<div>Hello {{USER_NAME}}</div>");


    const [templateName, setTemplateName] = useState("");
    const [id, setId] = useState<string | null>(null);
    const [subject, setSubject] = useState("");
    const [headerTitle, setHeaderTitle] = useState("Add New Email Template");

    return (
        <>
            <h3 className="mb-3">Email Template</h3>
            <SlideMenu
                isOpen={open}
                onClose={() => setOpen(false)}
                headerTitle={`${headerTitle}`}
            >
                <form onSubmit={handleSaveTemplate} className="d-flex flex-column gap-3">
                    <button
                        type="submit"
                        className="btn dashboard-btn align-self-start"
                        disabled={!templateName || !subject || !html}
                    >
                        Save
                    </button>
                    <div className="d-flex justifify-content-between ">

                        <div className="d-flex">

                            <div>
                                <input type="hidden" value={id!}></input>
                                <label className="form-label fw-bold">Template Name *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. otp_verification"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="form-label fw-bold">Subject *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="{{EVENT_NAME}}"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>




                    <div>
                        <label className="form-label fw-bold">HTML Content *</label>
                        <HtmlCodeEditor value={html} onChange={setHtml} />
                    </div>




                </form>
            </SlideMenu>

            <button className={`btn btn-sm dashboard-btn`}
                onClick={() => { setOpen(true); setHtml("<div>Hello {{USER_NAME}}</div>"); setTemplateName(""); setSubject(""); setHeaderTitle("Add New Email Template"); setId(null) }}>Add New</button>
            <GenericDataGrid<EmailTemplate>
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
                getRowId={(row) => row._id!}
            />
        </>
    );
};

export default EmailTemplatesDataGrid;