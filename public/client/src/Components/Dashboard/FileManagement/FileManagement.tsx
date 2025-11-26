import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../api/axiosInstance";
import { useToast } from "../../../providers/ToastContext";

export default function FileManager() {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const { show } = useToast();

  const fetchFiles = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/files");
      if (res.data.success) {
        setFiles(res.data.data);
      }
    } catch (err: any) {
      show({ type: "error", message: err.message });
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    try {
      const res = await axiosInstance.post("/files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        show({ type: "success", message: "File uploaded" });
        fetchFiles();
      }
    } catch (err: any) {
      show({ type: "error", message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/files/${id}`);
      if (res.data.success) {
        show({ type: "success", message: "File deleted" });
        fetchFiles();
      }
    } catch (err: any) {
      show({ type: "error", message: err.message });
    }
  };

  return (
    <div className="file-manager">
      <h3 className="mb-3">File Manager</h3>

      <label className="btn dashboard-btn mb-4">
        {uploading ? "Uploading..." : "Upload File"}
        <input
          type="file"
          onChange={handleFileUpload}
          hidden
        />
      </label>

      <div className="file-list">
        {files.length === 0 && <p>No files uploaded.</p>}

        {files.map((file) => (
          <div className="file-item" key={file._id}>
            <div>
              <strong>{file.filename}</strong>
              <div className="text-muted" style={{ fontSize: "12px" }}>
                {Math.round(file.size / 1024)} KB
              </div>
            </div>

            <button
              className="btn btn-sm dashboard-btn"
              onClick={() => deleteFile(file._id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
