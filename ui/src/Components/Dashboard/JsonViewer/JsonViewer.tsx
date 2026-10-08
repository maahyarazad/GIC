import React, { useState, useCallback, useEffect } from "react";

import axiosInstance from "../../../api/axiosInstance";
import { updateClientById } from "../../../api/client";
import { useToast } from "../../../Providers/ToastContext";
import JsonView from '@uiw/react-json-view';
import { lightTheme } from '@uiw/react-json-view/light';
import { JsonData, JsonEditor } from 'json-edit-react';
import './JsonViewer.css';
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import Loader from "@/Components/Loader/Loader";

// The document id identifies the record being saved: it can't be edited or deleted.
const isDocumentId = ({ path }: { path: (string | number)[] }) =>
    path.length === 1 && path[0] === "_id";

export default function JsonViewer() {
    const [data, setData] = useState<any>({});
    // Working copy while editing; `data` stays untouched until the save succeeds.
    const [draft, setDraft] = useState<any>(null);
    const [editorKey, setEditorKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const { show } = useToast();
    const { confirm } = useConfirm();

    const editing = draft !== null;


    const fetchClient = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/client");

            if (response.status === 200) {

                setData(response?.data?.data);
            }
        } catch (err: any) {
            show({
                type: "error",
                message: err.message,
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const startEditing = () => setDraft(structuredClone(data));

    const cancelEditing = async () => {
        if (JSON.stringify(draft) !== JSON.stringify(data)) {
            const discard = await confirm({
                title: "Discard changes",
                message: "Discard your unsaved changes to the site data?",
                confirmText: "Discard",
                cancelText: "Keep editing",
            });
            if (!discard) return;
        }
        setDraft(null);
    };

    const updateClient = async () => {
        const isConfirmed = await confirm({
            title: "Update Client Data",
            message: `This JSON file contains the entire site data blueprint. An invalid JSON file could break the website. Are you sure you want to proceed?`,
            confirmText: "Proceed",
            cancelText: "Cancel",
        });

        if (!isConfirmed) return;
        try {
            setLoading(true);
            const response = await updateClientById(draft._id, draft);

            if (response.success) {

                setData(draft);
                setDraft(null);
                setEditorKey((k) => k + 1);
                show({
                    type: "success",
                    message: response.message,
                });
            }
        } catch (err: any) {
            // Stay in edit mode so the changes are not lost.
            show({
                type: "error",
                message: err.message,
            });
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        fetchClient();
    }, [fetchClient,]);


    return (
        <div className="dash-section">
            <div className="dash-header">
                <h3>Website Key Values</h3>
                <div className="d-flex gap-2">
                    {editing ? (
                        <>
                            <button className="dashboard-btn dashboard-btn--ghost-minimal" onClick={cancelEditing} disabled={loading}>
                                Cancel
                            </button>
                            <button className="dashboard-btn" onClick={updateClient} disabled={loading}>
                                Update
                            </button>
                        </>
                    ) : (
                        <button className="dashboard-btn" onClick={startEditing} disabled={loading}>
                            Edit
                        </button>
                    )}
                </div>
            </div>
            <div className="application-json-editor-continer" style={{ position: 'relative', height: '78dvh', overflow: 'scroll'}}>
                {loading ? (
                    <Loader />
                ) : editing ? (
                    <JsonEditor
                        data={draft}
                        setData={(updated: JsonData) => setDraft(updated)}
                        rootName="siteData"
                        collapse={2}
                        restrictEdit={isDocumentId}
                        restrictDelete={isDocumentId}
                        minWidth="100%"
                        maxWidth="100%"
                    />
                ) : (
                    <JsonView
                        value={data}
                        key={editorKey}
                        style={lightTheme}
                        collapsed={2}
                    />
                )}
            </div>
        </div>
    );
}
