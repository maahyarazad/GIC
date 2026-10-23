import React, { useState, useEffect, useCallback, useContext, useMemo } from "react";
import { GenericDataGrid, Column, PaginationModel, SortModel, FilterModel } from "../../GenericDataGrid/GenericDataGrid";
import GridActions from "@/Components/Generic/GridActions/GridActions";
import axiosInstance from "../../../api/axiosInstance";
import { useToast } from "../../../Providers/ToastContext";
import { EnvContext } from '../../../EnvContext.jsx';
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import debounce from "@/Hooks/useDebounce";
import Loader from "@/Components/Loader/Loader";
import { uploadFile, apiErrorMessage } from "@/api/files";
import UploadOverlay, { UploadItem, batchPercentOf } from "./UploadOverlay";
import "./FileManagement.css";

interface UploadedFileDoc {
    _id: string;
    filename: string;
    mimetype: string;
    extension: string;
    path: string;
    size: number;
    createdAt: string;
}

const FileManagement = () => {
    const [files, setFiles] = useState<UploadedFileDoc[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 1, pageSize: 10 });
    const [sortModel, setSortModel] = useState<SortModel<UploadedFileDoc> | null>(null);
    const [filterModel, setFilterModel] = useState<FilterModel<UploadedFileDoc>[] | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
    const { show } = useToast();
    const { confirm } = useConfirm();
    const env = useContext(EnvContext);
    const [loading, setLoading] = useState(true);

    const fetchFiles = useCallback(async () => {
        try {
            setLoading(true);
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

            const response = await axiosInstance.get("/files", { params });

            setFiles(response.data.data.files);
            setRowCount(response.data.data.total); // adjust if server returns total count
        } catch (err) {
            console.error("Failed to fetch files", err);
        }finally{
            setLoading(false);
        }
    }, [paginationModel, sortModel, filterModel]);




        const debouncedFetch = useMemo(() => debounce(fetchFiles, 400),[fetchFiles]);
    
    
        useEffect(() => {
            debouncedFetch();
    
            return () => {
                debouncedFetch.cancel();
            };
        }, [debouncedFetch]);

        

    // Leaving the page would abort the requests still in flight.
    useEffect(() => {
        if (!uploading) return;
        const warn = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [uploading]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files ?? []);
        // Reset so picking the same files again still fires onChange.
        e.target.value = "";
        if (!selected.length || uploading) return;

        const patch = (index: number, change: Partial<UploadItem>) =>
            setUploadItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...change } : item)));

        setUploadItems(selected.map((file) => ({ name: file.name, size: file.size, loaded: 0, status: "queued" })));
        setUploading(true);

        // One request per file, in order: a failure only affects its own file.
        const failures: string[] = [];
        for (const [index, file] of selected.entries()) {
            patch(index, { status: "uploading" });
            try {
                await uploadFile(file, (loaded, total) =>
                    patch(index, { loaded, status: loaded >= total ? "processing" : "uploading" })
                );
                patch(index, { loaded: file.size, status: "done" });
            } catch (err) {
                const reason = apiErrorMessage(err, "Upload failed");
                console.error(`Upload failed for ${file.name}`, err);
                failures.push(`${file.name} (${reason})`);
                patch(index, { status: "failed", error: reason });
            }
        }

        setUploading(false);
        setUploadItems([]);
        fetchFiles();

        const uploaded = selected.length - failures.length;
        const files = (n: number) => `${n} file${n === 1 ? "" : "s"}`;
        if (!failures.length) {
            show({ type: "success", message: `${files(uploaded)} uploaded` });
        } else if (!uploaded) {
            show({ type: "error", message: `Upload failed: ${failures.join(", ")}` });
        } else {
            show({ type: "warning", message: `${uploaded} uploaded, ${failures.length} failed: ${failures.join(", ")}` });
        }
    };

    const deleteFile = async (id: string) => {
        const isConfirmed = await confirm({
            title: "Delete File",
            message: `Are you sure you want to delete this file? This action cannot be undone.`,
            confirmText: "Delete",
            cancelText: "Cancel",
        });

        if (!isConfirmed) return;

        try {
            const response = await axiosInstance.delete(`/files/${id}`);
            const message: string = response.data.message;
            if (response.data.success) {

                show({ type: "success", message });

                fetchFiles();
            } else {
                show({ type: "error", message });
            }
        } catch (err: any) {
            show({ type: "error", message: err.message });
            console.error("Delete failed", err);
        }
    };

    const columns: Column<UploadedFileDoc>[] = [
        { field: "_id", headerName: "ID", sortable: true, filterable: true , width:"10%"},
        { field: "filename", headerName: "Filename", sortable: true, filterable: true , width:"20%"},
        { field: "mimetype", headerName: "Type", sortable: true , width:"10%"},
        {
            headerName: "Preview",
            width: '5%', // adjust width
            renderCell: (row) => {
                if (row.mimetype.startsWith("image/")) {
                    return (
                        <img
                            src={`${env.VITE_SERVER_API_URL}/uploads/${row._id}.${row.extension}`}
                            alt={row.filename}
                            style={{ width: 40, height: 20, objectFit: "cover" }}
                        />
                    );
                } else if (row.mimetype.startsWith("video/")) {
                    return (
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{ width: 40, height: 20 }}

                        >
                            <source src={`${env.VITE_SERVER_API_URL}/uploads/${row._id}.${row.extension}`} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    );
                }
                return "—";
            }
        },
        { field: "size", headerName: "Size (KB)", sortable: true , width:"10%", renderCell: (row) => Math.round(row.size / 1024) },
        { field: "createdAt", headerName: "Uploaded At", sortable: true , width:"10%", renderCell: (row) => new Date(row.createdAt).toLocaleString() },
        {
                       headerName: "Actions",
            width: "8%",
            sortable: false,
            filterable: false,
            renderCell: (row) => (
                <GridActions onDelete={() => deleteFile(row._id)} />
            ),
        },
    ];

    return (
        <div className="dash-section file-management-section">
            <div className="dash-header">
                <h3>File Manager</h3>
                <label
                    className={`dashboard-btn${uploading ? " file-upload-btn--disabled" : ""}`}
                    style={{ cursor: "pointer" }}
                    aria-disabled={uploading}
                >
                    {uploading ? "Uploading…" : "Upload Files"}
                    <input type="file" multiple onChange={handleFileUpload} disabled={uploading} hidden />
                </label>
            </div>

            {loading ?
                <Loader/>

             : 
            <GenericDataGrid
                rows={files}
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
                getRowId={(row) => row._id}
            />
             }

            {uploading && <UploadOverlay items={uploadItems} batchPercent={batchPercentOf(uploadItems)} />}
        </div>
    );
};


export default FileManagement;