import React, { useCallback, useEffect, useState } from "react";
import "./BoardMeetings.css";
import { adminListRequests } from "@/api/boardMeetings";
import MeetingsTable from "./MeetingsTable";
import RequestsTable from "./RequestsTable";

type Tab = "meetings" | "requests";

const BoardMeetings: React.FC = () => {
    const [tab, setTab] = useState<Tab>("meetings");
    const [pendingCount, setPendingCount] = useState(0);

    const refreshPending = useCallback(async () => {
        try {
            setPendingCount((await adminListRequests({ status: "pending" })).length);
        } catch (error) {
            console.error("Failed to count pending requests", error);
        }
    }, []);

    useEffect(() => {
        refreshPending();
    }, [refreshPending]);

    return (
        <div className="dash-section board-meetings">
            <div className="dash-header">
                <h3>Board Meetings</h3>
            </div>

            <div className="bm-tabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "meetings"}
                    className={`bm-tab${tab === "meetings" ? " active" : ""}`}
                    onClick={() => setTab("meetings")}
                >
                    Meetings
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "requests"}
                    className={`bm-tab${tab === "requests" ? " active" : ""}`}
                    onClick={() => setTab("requests")}
                >
                    Requests
                    {pendingCount > 0 && <span className="bm-tab__badge">{pendingCount}</span>}
                </button>
            </div>

            {tab === "meetings" ? (
                <MeetingsTable onChanged={refreshPending} />
            ) : (
                <RequestsTable onChanged={refreshPending} />
            )}
        </div>
    );
};

export default BoardMeetings;
