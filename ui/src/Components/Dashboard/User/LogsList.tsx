import React, { useState, useEffect, useCallback } from "react";
import ToastOptions from '@/Providers/ToastContext';
import './LogList.css';
import { useModal } from "@/Providers/ModalContext";

import { getLogs } from '../../../api/user'
import Loader from "@/Components/Loader/Loader";
interface UserDetails {
    name: string;
    role: string;
    email: string;
}

interface Log {
    _id: string | number;
    message: string;
    userDetails: UserDetails;
    createdAt: string | Date;
}

interface LogsListProps {
    userId: string;
    show: (options: ToastOptions) => void;
}

const LogsList: React.FC<LogsListProps> = ({ userId, show }) => {

    // const { show } = useToast();
    const [logs, setLogs] = useState<Log[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchLogDetails = useCallback(async (id: string) => {
        setLoading(true);
        try {

            const response = await getLogs(id);
            
            setLogs(response.data.logs);
        } catch (err: any) {
            show({
                type: "error",
                message: err.message,
            });
        } finally {
            setLoading(false);
        }

    }, []);

    useEffect(() => {
        if (userId) {
            fetchLogDetails(userId);
        }
    }, [userId, fetchLogDetails]);




    return (
       <div style={{ overflowY: "auto", padding: "8px" }}>
  {loading ? (
    <Loader />
  ) : logs!.length === 0 ? (
    <p className="logs-empty">No logs found.</p>
  ) : (
    <ul className="logs-list">
      {logs!.map((log) => (
        <li key={log._id.toString()} className="logs-item">
          <h5 className="logs-item__message">{log.message}</h5>
          <div className="logs-item__meta">
            <div className="logs-item__meta-row">
              <strong className="logs-item__meta-label">User:</strong> <br />
              {log.userDetails.name} ({log.userDetails.role})
            </div>
            <div className="logs-item__meta-row">
              <strong className="logs-item__meta-label">Email:</strong> <br />
              {log.userDetails.email}
            </div>
            <div className="logs-item__meta-row">
              <strong className="logs-item__meta-label">Time:</strong> <br />
              {new Date(log.createdAt).toLocaleString()}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )}
</div>
    );
};

export default LogsList;
