import React, { useState } from "react";
import "./ManageEvents.css";
import EventsTable from "./EventsTable";
import AttendeesTable from "./AttendeesTable";

type Tab = "events" | "attendees";

const ManageEvents: React.FC = () => {
    const [tab, setTab] = useState<Tab>("events");

    return (
        <div className="dash-section manage-events">
            <div className="dash-header">
                <h3>Manage Events</h3>
            </div>

            <div className="bm-tabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "events"}
                    className={`bm-tab${tab === "events" ? " active" : ""}`}
                    onClick={() => setTab("events")}
                >
                    Events
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "attendees"}
                    className={`bm-tab${tab === "attendees" ? " active" : ""}`}
                    onClick={() => setTab("attendees")}
                >
                    Attendees
                </button>
            </div>

            {tab === "events" ? <EventsTable /> : <AttendeesTable />}
        </div>
    );
};

export default ManageEvents;
