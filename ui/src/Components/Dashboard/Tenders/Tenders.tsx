import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { checkAuthToken } from "@/features/authThunks";
import { setMyIndustrySectors } from "@/api/user";
import IndustrySectorWizard from "./IndustrySectorWizard";
import TenderBoard from "./TenderBoard";
import "./Tenders.css";

const REQUIRED_COUNT = 3;

const Tenders: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const userProfile = useSelector((state: RootState) => state.auth?.user);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const role = userProfile?.role;
    const sectors = (userProfile as any)?.industrySectors as string[] | undefined;
    const needsWizard = role === "user" && (!sectors || sectors.length !== REQUIRED_COUNT);

    const handleConfirm = async (selected: string[]) => {
        setSubmitting(true);
        setError(null);
        try {
            await setMyIndustrySectors(selected);
            await dispatch(checkAuthToken());
        } catch (err: any) {
            setError(
                err?.response?.data?.message || err?.message || "Failed to save your industry sectors."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (needsWizard) {
        return (
            <div className="dash-section tenders">
                <div className="dash-header">
                    <h3>Tenders</h3>
                </div>
                <IndustrySectorWizard
                    title="Select your industry sectors to access the Tender board"
                    submitting={submitting}
                    error={error}
                    onConfirm={handleConfirm}
                />
            </div>
        );
    }

    return <TenderBoard />;
};

export default Tenders;
