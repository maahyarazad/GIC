import React, { useState, useCallback, useEffect } from "react";

import axiosInstance from "../../../api/axiosInstance";
import { updateClientById } from "../../../api/client";
import { useToast } from "../../../providers/ToastContext";
import { JsonData, JsonEditor } from 'json-edit-react'
import './JsonViewer.css';
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import Loader from "@/Components/Loader/Loader";
export default function JsonViewer() {
    const [data, setData] = useState<any>({});
    const [editorKey, setEditorKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const { show } = useToast();
    const { confirm } = useConfirm();


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
            const response = await updateClientById(data._id, data);
            
            if (response.success) {

                setData(data);
                setEditorKey((k) => k + 1);
                show({
                    type: "success",
                    message: response.message,
                });
            }
        } catch (err: any) {
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


    const handleChange = (updatedJson: JsonData) => {


        setData(updatedJson);
    };


    // useEffect(() => {
    // if (!loading) {
    //     const timer = setTimeout(() => {
    //     document.querySelectorAll(".jer-collapse-icon.jer-accordion-icon.jer-rotate-90").forEach((btn) => {
    //         const parent = btn.closest(".json-edit-react__path-node"); // adjust if needed
    //         if (parent) {
    //         if (btn instanceof HTMLElement) {
    //             btn.click(); // collapse it
    //         }
    //         }
    //     });
    //     }, 50);

    //     return () => clearTimeout(timer);
    // }
    // }, [loading, editorKey]);





    return (
        <div style={{ position: 'relative' }}>
            <h3 className="mb">Website Key Values</h3>
            <button
                className="btn dashboard-btn mb-2"
                onClick={updateClient}
                style={{ position: 'sticky', top: 0, left: 0, paddingTop: 10, zIndex: 100 }}
            >
                Update
            </button>
            <div className="application-json-editor-continer">
                {loading ? (
                    <Loader />
                ) : (
                    <JsonEditor
                        data={data}
                        key={editorKey}
                        setData={handleChange}
                    />
                )}
            </div>
        </div>
    );
}
