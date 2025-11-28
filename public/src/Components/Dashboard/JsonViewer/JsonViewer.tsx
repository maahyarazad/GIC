import React, { useState, useCallback, useEffect } from "react";

import axiosInstance from "../../../api/axiosInstance";
import { updateClientById } from "../../../api/client";
import { useToast } from "../../../providers/ToastContext";
import { JsonData, JsonEditor } from 'json-edit-react'
import './JsonViewer.css';


export default function JsonViewer() {
  const [data, setData] = useState<any>({});
  const [editorKey, setEditorKey] = useState(0);
  const { show } = useToast();

  const fetchClient = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/client");

      if (response.status === 200) {

        setData(response?.data?.data);
      }
    } catch (err: any) {
      show({
        type: "error",
        message: err.message,
      });
    }
  }, []);

  const updateClient = async () => {
    try {

      const response = await updateClientById(data._id, data);

      if (response.success) {
        debugger;
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
    }
  }


  useEffect(() => {
    fetchClient();
  }, [fetchClient, ]);


  const handleChange = (updatedJson: JsonData) => {
    
    
    setData(updatedJson);
  };


  return (
    <>
      <h3 className="mb-3">Email Template</h3>
      <button className="btn dashboard-btn mb-2" onClick={updateClient}>
        Update Sitedata
      </button>
      <div className="application-json-editor-continer">

        <JsonEditor
          data={data}
          key={editorKey}
          setData={handleChange}
        />
      </div>
    </>
  );
}
