import React, { useState, useCallback, useEffect } from "react";

import axiosInstance from "../../../api/axiosInstance";
import {updateClientById} from "../../../api/client";
import { useToast } from "../../../providers/ToastContext";
import { JsonData, JsonEditor } from 'json-edit-react'
import './JsonViewer.css';


export default function JsonViewer() {
  const [data, setData] = useState<any>({});
  // const [id, setID] = useState<string>();
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

  const updateClient = async () =>{
  try {
    
        const response = await updateClientById(data._id, data);
        
        if (response.success) {
          setData(response.data); 
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
  }, [fetchClient]);

  
const handleChange = (updatedJson: JsonData) => {
    console.log("Updated:", updatedJson);
    setData(updatedJson);
  };


  return (
    <>
      <button className="btn dashboard-btn mb-2" onClick={updateClient}>
        Update Sitedata
      </button>
    <JsonEditor
      data={data}
    
      setData={handleChange}
    />
    </>
  );
}
