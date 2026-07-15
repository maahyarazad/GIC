import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { GenericDataGrid, Column, PaginationModel, SortModel, FilterModel } from "../../GenericDataGrid/GenericDataGrid";
import axiosInstance from "../../../api/axiosInstance";
import { useToast } from "../../../Providers/ToastContext";
import SendTestEmailModal, { SendTestEmailModalHandle } from './SendTestEmailModal';

import { useConfirm } from '@/Providers/ConfirmDialogProvider';
import debounce from "@/Hooks/useDebounce";
import Loader from "@/Components/Loader/Loader";
import { useSlideMenu } from "@/Providers/SlideMenuProvider"; // adjust path
import TemplateForm from "./TemplateForm";
import { useModal } from "@/Providers/ModalContext";
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

const buttonGroupStyle = { fontSize: 10, padding: 5 }
const EmailTemplatesDataGrid = () => {
    const { show } = useToast();
    const { openModal, setModalDisabled } = useModal();
    const { confirm } = useConfirm();

    const columns: Column<EmailTemplate>[] = [
        { field: "_id", headerName: "ID", width: '10%' },
        { field: "name", headerName: "Name", sortable: true, filterable: true, width: '10%' },
        { field: "subject", headerName: "Subject", sortable: true, filterable: true, width: '10%' },
        // { field: "variables", headerName: "Variables",  width: '10%', renderCell: row => (row.variables?.join(", ") || "—") },
        { field: "createdAt", headerName: "Created At", width: '10%', renderCell: row => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—" },
        { field: "updatedAt", headerName: "Updated At", width: '10%', renderCell: row => row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "—" },
        {
            headerName: "Actions",
            width: '30%',
            renderCell: (row) => (
                <div className="email-template-row-actions" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button style={buttonGroupStyle} className="btn btn-sm dashboard-btn" onClick={() => onEdit(row)}>Edit</button>
                    <button style={buttonGroupStyle} className="btn btn-sm dashboard-btn--delete-ghost" onClick={() => onDelete(row)}>Delete</button>
                    <button style={buttonGroupStyle} className="btn btn-sm dashboard-btn" onClick={() => onSendTestEmail(row)}>Send Test Email</button>
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
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const { openMenu, onClose } = useSlideMenu();


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




    const debouncedFetch = useMemo(() => debounce(fetchTemplates, 400), [fetchTemplates]);


    useEffect(() => {
        debouncedFetch();

        return () => {
            debouncedFetch.cancel();
        };
    }, [debouncedFetch]);


    const handleSaveTemplate = async (e: React.FormEvent<HTMLFormElement>) => {

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
            onClose();
            fetchTemplates();

        } catch (err: any) {
            show({ type: "error", message: err.message || "Operation failed" });
        }
    };


    const handleResetState = () => {
        setOpen(false); setHtml(""); setTemplateName(""); setSubject(""); setHeaderTitle(""); setId(null);
    }

    const onCreate = () => { setOpen(true); setHtml("<div>Hello {{USER_NAME}}</div>"); setTemplateName(""); setSubject(""); setHeaderTitle("New Email Template"); setId(null); }

    const onEdit = (row: EmailTemplate) => {

        setHeaderTitle(`Modify ${row.name}`)
        setId(row._id!);
        setTemplateName(row.name);
        setHtml(row.html);
        setSubject(row.subject);
        setOpen(true);


    };


    const onDelete = async (row: EmailTemplate) => {
        const isConfirmed = await confirm({
            title: "Delete Template",
            message: `Are you sure you want to delete the email template "${row.name}"? This action cannot be undone.`,
            confirmText: "Delete",
            cancelText: "Cancel",
        });

        if (!isConfirmed) return;

        try {
            await axiosInstance.delete(`/email-templates/${row._id}`);
            show({ type: "success", message: "Template deleted successfully" });

            fetchTemplates();
        } catch (err: any) {
            show({ type: "error", message: err.message || "Failed to delete template" });
        }
    };



    const modalRef = useRef<SendTestEmailModalHandle>(null);
    const [isModalValid, setIsModalValid] = useState(false);

    const onSendTestEmail = async (row: EmailTemplate) => {
        openModal({

            variant: "default",
            title: `Send Test Email - ${row.subject}`,
            // ✅ Pass the callback so modal can report validity upward
            content: <SendTestEmailModal
                ref={modalRef}
                row={row}
                onValidityChange={(valid) => setModalDisabled(!valid)}
            />,
            confirmText: "Send",
            disabled: true,   // initialState
            onConfirm: () => {
                const { testEmail, variables } = modalRef.current!.getValues();
                handleSendTestEmail(row, variables, testEmail);
            },
        });
    };

    const handleSendTestEmail = async (row: EmailTemplate, variables: Record<string, string>, email:string) => {
        try {
debugger;
            var res = await axiosInstance.post(`/email-templates/send-email-template/${row._id}`, {
                variables:variables , email:email
            });

            if (res.data.success) {
                show({ type: "success", message: res.data.message });
            }

        } catch (err: any) {
            show({ type: "error", message: err.message || "Failed to delete template" });
        }
    }

    const [html, setHtml] = useState("<div>Hello {{USER_NAME}}</div>");


    const [templateName, setTemplateName] = useState("");
    const [id, setId] = useState<string | null>(null);
    const [subject, setSubject] = useState("");
    const [headerTitle, setHeaderTitle] = useState("Add New Email Template");



    useEffect(() => {

        if (open) {

            openMenu(
                <TemplateForm
                    id={id}
                    templateName={templateName}
                    setTemplateName={setTemplateName}
                    subject={subject}
                    setSubject={setSubject}
                    html={html}
                    setHtml={setHtml}
                    handleSaveTemplate={handleSaveTemplate}
                />,
                headerTitle,
                handleResetState
            );
        }

    }, [id, templateName, subject, html, headerTitle]);


    return (
        <div className="dash-section">
            <div className="dash-header">
                <h3>Email Templates</h3>
                <button className="dashboard-btn" onClick={onCreate}>
                    Add New
                </button>
            </div>


            {loading ?
                <Loader />

                :

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
            }
        </div>
    );
};

export default EmailTemplatesDataGrid;