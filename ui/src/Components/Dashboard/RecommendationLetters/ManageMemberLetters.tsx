import React from "react";
import RecommendationLetters from "./RecommendationLetters";
import BusinessLetter from "../BusinessLetter/BusinessLetter";

/**
 * Member "Manage Letter of Recommendation": the request form is the default (empty) view — it
 * creates a request and emails the admin group. Opening a request from "My requests" switches to
 * the admin-style editor/preview (with View / Download / Submit), where Submit notifies the admin.
 */
const ManageMemberLetters: React.FC = () => (
    <RecommendationLetters
        mode="member"
        emptyState={({ refresh }) => <BusinessLetter onCreated={refresh} />}
    />
);

export default ManageMemberLetters;
