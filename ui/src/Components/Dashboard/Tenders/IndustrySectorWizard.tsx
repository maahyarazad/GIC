import React, { useState } from "react";
import { INDUSTRY_SECTORS, SECTOR_PERMANENCE_NOTICE } from "../../../../../src/config/industrySectors";

const REQUIRED_COUNT = 3;

interface IndustrySectorWizardProps {
    title?: string;
    confirmLabel?: string;
    submitting?: boolean;
    error?: string | null;
    onConfirm(sectors: string[]): void;
}

/**
 * Shared by both the registration flow and the one-time Tenders-tab wizard for
 * existing members. Exactly 3 of the fixed sectors must be picked, and the
 * irreversibility notice is always shown — this component never offers an
 * "edit later" path.
 */
const IndustrySectorWizard: React.FC<IndustrySectorWizardProps> = ({
    title = "Select your industry sectors",
    confirmLabel = "Confirm selection",
    submitting = false,
    error,
    onConfirm,
}) => {
    const [selected, setSelected] = useState<string[]>([]);

    const toggle = (sector: string) => {
        setSelected((current) => {
            if (current.includes(sector)) return current.filter((s) => s !== sector);
            if (current.length >= REQUIRED_COUNT) return current;
            return [...current, sector];
        });
    };

    const canConfirm = selected.length === REQUIRED_COUNT && !submitting;

    return (
        <div className="sector-wizard">
            <h4>{title}</h4>
            <p className="sector-wizard__notice">{SECTOR_PERMANENCE_NOTICE}</p>
            <p className="sector-wizard__count">
                {selected.length} / {REQUIRED_COUNT} selected
            </p>

            <ul className="sector-wizard__list">
                {INDUSTRY_SECTORS.map((sector) => {
                    const checked = selected.includes(sector);
                    const disabled = !checked && selected.length >= REQUIRED_COUNT;
                    return (
                        <li key={sector}>
                            <label className={`sector-wizard__option${disabled ? " is-disabled" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => toggle(sector)}
                                />
                                <span>{sector}</span>
                            </label>
                        </li>
                    );
                })}
            </ul>

            {error && <p className="sector-wizard__error">{error}</p>}

            <button
                type="button"
                className="btn btn-primary-contrast sector-wizard__confirm"
                disabled={!canConfirm}
                onClick={() => onConfirm(selected)}
            >
                {submitting ? "Saving…" : confirmLabel}
            </button>
        </div>
    );
};

export default IndustrySectorWizard;
