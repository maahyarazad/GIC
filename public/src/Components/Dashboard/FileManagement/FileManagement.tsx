import React, { useState, useEffect, useCallback, useContext } from "react";
import { GenericDataGrid, Column, PaginationModel, SortModel, FilterModel } from "../../GenericDataGrid/GenericDataGrid";
import axiosInstance from "../../../api/axiosInstance";
import { useToast } from "../../../Providers/ToastContext";
import {EnvContext} from '../../../../src/EnvContext.js';
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
  const { show } = useToast();

  const env = useContext(EnvContext);

  const fetchFiles = useCallback(async () => {
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

      const response = await axiosInstance.get("/files", { params });
      
      setFiles(response.data.data.files);
      setRowCount(response.data.data.total); // adjust if server returns total count
    } catch (err) {
      console.error("Failed to fetch files", err);
    }
  }, [paginationModel, sortModel, filterModel]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      const response = await axiosInstance.post("/files", formData, { headers: { "Content-Type": "multipart/form-data" } });
      
      const message: string = response.data.message;
      if (response.data.success) {

        show({ type: "success", message });
        fetchFiles();
      } else {
        show({ type: "error", message });
      }
    } catch (err: any) {
      console.error("Upload failed", err);
      show({ type: "error", message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (id: string) => {
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
    { field: "_id", headerName: "ID", sortable: true, filterable: true },
    { field: "filename", headerName: "Filename", sortable: true, filterable: true },
    { field: "mimetype", headerName: "Type", sortable: true },
    {
    headerName: "Preview",
    width: 50, // adjust width
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
            <source  src={`${env.VITE_SERVER_API_URL}/uploads/${row._id}.${row.extension}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );
      }
      return "—";
    }
  },
    { field: "size", headerName: "Size (KB)", sortable: true, renderCell: (row) => Math.round(row.size / 1024) },
    { field: "createdAt", headerName: "Uploaded At", sortable: true, renderCell: (row) => new Date(row.createdAt).toLocaleString() },
    {
      headerName: "Actions",
      renderCell: (row) => (
        <button type="button" className="btn btn-sm dashboard-btn--delete-ghost" onClick={() => deleteFile(row._id)}>
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="file-manager">
      <h3 className="mb-3">File Manager</h3>

      <label className="btn dashboard-btn mb-4">
        {uploading ? "Uploading..." : "Upload File"}
        <input type="file" onChange={handleFileUpload} hidden />
      </label>

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
    </div>
  );
};


export default FileManagement;