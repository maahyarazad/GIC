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

import NodeDialog, { NodeDialogRequest, NodeDialogResult } from "./NodeDialog";
import {
    JsonPath,
    addAtPath,
    formatPath,
    isContainer,
    isDocumentIdPath,
    removeAtPath,
    updateAtPath,
} from "./jsonPath";

const isDocumentId = ({ path }: { path: JsonPath }) => isDocumentIdPath(path);

export default function JsonViewer() {
    const [data, setData] = useState<any>({});
    // Unsaved changes (made in the viewer or in the editor); `data` stays
    // untouched until the save succeeds. null = no pending changes.
    const [draft, setDraft] = useState<any>(null);
    const [editing, setEditing] = useState(false);
    const [editorKey, setEditorKey] = useState(0);
    const [loading, setLoading] = useState(true);
    // Edit / add dialog for a node of the viewer.
    const [dialog, setDialog] = useState<NodeDialogRequest | null>(null);
    const { show } = useToast();
    const { confirm } = useConfirm();

    const current = draft ?? data;
    const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(data);


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

    const startEditing = () => {
        setDraft((pending: any) => pending ?? structuredClone(data));
        setEditing(true);
    };

    const discardChanges = async () => {
        if (dirty) {
            const discard = await confirm({
                title: "Discard changes",
                message: "Discard your unsaved changes to the site data?",
                confirmText: "Discard",
                cancelText: "Keep editing",
            });
            if (!discard) return;
        }
        setDraft(null);
        setEditing(false);
        setEditorKey((k) => k + 1);
    };

    // Changes made in the viewer (delete, edit, add) are pending until Update.
    const deleteNode = (path: JsonPath) => {
        setDraft((pending: any) => removeAtPath(pending ?? data, path));
    };

    const applyDialog = (result: NodeDialogResult) => {
        setDraft((pending: any) => {
            const base = pending ?? data;
            return result.mode === "edit"
                ? updateAtPath(base, result.path, result.value, result.newKey)
                : addAtPath(base, result.path, result.value, result.key);
        });
        setDialog(null);
    };

    const closeDialog = useCallback(() => setDialog(null), []);

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
                setEditing(false);
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
                <div className="d-flex align-items-center gap-2">
                    {dirty && <span className="json-viewer-unsaved">Unsaved changes</span>}
                    {!editing && (
                        <>
                            <button
                                className="dashboard-btn dashboard-btn--ghost-minimal"
                                onClick={() => setDialog({ mode: "add", path: [], container: current })}
                                disabled={loading}
                            >
                                Add key
                            </button>
                            <button className="dashboard-btn dashboard-btn--ghost-minimal" onClick={startEditing} disabled={loading}>
                                Edit
                            </button>
                        </>
                    )}
                    {(editing || dirty) && (
                        <>
                            <button className="dashboard-btn dashboard-btn--ghost-minimal" onClick={discardChanges} disabled={loading}>
                                {editing ? "Cancel" : "Discard"}
                            </button>
                            <button className="dashboard-btn" onClick={updateClient} disabled={loading || !dirty}>
                                Update
                            </button>
                        </>
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
                        value={current}
                        key={editorKey}
                        style={lightTheme}
                        collapsed={2}
                    >
                        {/* Every key / array index gets edit and delete buttons, objects and arrays an add button (shown on hover). */}
                        <JsonView.KeyName
                            render={(props: any, { keys, value, parentValue }: { keys?: JsonPath; value?: unknown; parentValue?: unknown }) => {
                                const path = keys ?? [];
                                const locked = path.length === 0 || isDocumentIdPath(path);
                                const label = formatPath(path);
                                // Buttons must not toggle the collapse state of the node.
                                const act = (action: () => void) => (e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    action();
                                };

                                return (
                                    <span {...props}>
                                        {props.children}
                                        {!locked && (
                                            <span className="json-viewer-actions">
                                                {isContainer(value) && (
                                                    <button
                                                        type="button"
                                                        className="json-viewer-action json-viewer-action--add"
                                                        title={`Add to ${label}`}
                                                        aria-label={`Add to ${label}`}
                                                        onClick={act(() => setDialog({ mode: "add", path, container: value }))}
                                                    >
                                                        +
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="json-viewer-action json-viewer-action--edit"
                                                    title={`Edit ${label}`}
                                                    aria-label={`Edit ${label}`}
                                                    onClick={act(() => setDialog({
                                                        mode: "edit",
                                                        path,
                                                        value,
                                                        siblingKeys: isContainer(parentValue) && !Array.isArray(parentValue)
                                                            ? Object.keys(parentValue)
                                                            : [],
                                                    }))}
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    type="button"
                                                    className="json-viewer-action json-viewer-action--delete"
                                                    title={`Delete ${label}`}
                                                    aria-label={`Delete ${label}`}
                                                    onClick={act(() => deleteNode(path))}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        )}
                                    </span>
                                );
                            }}
                        />
                    </JsonView>
                )}
            </div>

            {dialog && <NodeDialog request={dialog} onApply={applyDialog} onClose={closeDialog} />}
        </div>
    );
}
