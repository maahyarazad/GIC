import React, { useState, useEffect, useCallback } from "react";
import ToastOptions from '../../../Providers/ToastContext';


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

import { getLogs } from '../../../api/user'
import Loader from "@/Components/Loader/Loader";

const LogsList: React.FC<LogsListProps> = ({ userId , show }) => {

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
                <p>No logs found.</p>
            ) : (
                <ul style={{ padding: 0, listStyle: "none" }}>
                    {logs!.map((log) => (
                        <li
                            key={log._id.toString()}
                            style={{
                                marginBottom: "12px",
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                                borderRadius: "4px",
                                backgroundColor: "#f9f9f9",
                            }}
                        >
                            <strong>{log.message}</strong>
                            <div style={{ fontSize: "0.9rem", marginTop: "4px", color: "#555" }}>
                                <div>
                                    <strong>User:</strong> <br />
                                    {log.userDetails.name} ({log.userDetails.role})
                                </div>
                                <div>
                                    <strong>Email:</strong> <br />
                                    {log.userDetails.email}
                                </div>
                                <div>
                                    <strong>Time:</strong> <br />
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
