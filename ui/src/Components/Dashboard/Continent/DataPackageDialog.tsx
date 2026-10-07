import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import ModalDialog from "@/Components/Generic/Dialog/Dialog";
import Loader from "@/Components/Loader/Loader";
import axiosInstance from "../../../api/axiosInstance";
import { useToast } from "../../../Providers/ToastContext";
import "./DataPackageDialog.css";

interface DataPackage {
    name: string;
    fileCount: number;
    files: string[];
}

interface NewColumnGroup {
    chapter: string;
    sheet: string;
    columns: string[];
}

interface UpdateReport {
    package: string;
    filesProcessed: string[];
    countriesUpdated: number;
    countriesNotMatched: string[];
    newColumns: NewColumnGroup[];
    totalNewColumns: number;
}

/** The legacy destructive path: wipe both collections and reseed from the root .xlsx files. */
const FULL_RESEED = "__full_reseed__";

interface DataPackageDialogProps {
    onClose: () => void;
    /** Called once an import succeeds, so the caller can refresh its grid. */
    onImported: () => void;
}

interface PackageOptionProps {
    value: string;
    name: string;
    meta: string;
    checked: boolean;
    danger?: boolean;
    onSelect: (value: string) => void;
}

// Memoized so a selection change re-renders only the two options whose `checked` flipped.
const PackageOption = memo(({ value, name, meta, checked, danger = false, onSelect }: PackageOptionProps) => (
    <label
        className={`data-pkg-option${danger ? " data-pkg-option--danger" : ""} ${
            checked ? "data-pkg-option--selected" : ""
        }`}
    >
        <input
            type="radio"
            name="data-package"
            checked={checked}
            onChange={() => onSelect(value)}
        />
        <div>
            <div className="data-pkg-option__name">{name}</div>
            <div className="data-pkg-option__meta">{meta}</div>
        </div>
    </label>
));
PackageOption.displayName = "PackageOption";

const UpdateReportView = memo(({ result }: { result: UpdateReport }) => (
    <div className="data-pkg-report">
        <div>
            <span className="data-pkg-report__stat">{result.countriesUpdated}</span>{" "}
            countries updated from{" "}
            <span className="data-pkg-report__stat">{result.filesProcessed.length}</span>{" "}
            chapter files.
        </div>
        <div style={{ marginTop: 4 }}>
            <span className="data-pkg-report__stat">{result.totalNewColumns}</span> new
            columns detected. Existing data was left in place.
        </div>

        {result.countriesNotMatched.length > 0 && (
            <div className="data-pkg-warning">
                No matching record for {result.countriesNotMatched.length} country(ies):{" "}
                {result.countriesNotMatched.join(", ")}
            </div>
        )}

        {result.newColumns.map((group) => (
            <div
                className="data-pkg-report__group"
                key={`${group.chapter}.${group.sheet}`}
            >
                <div className="data-pkg-report__stat">
                    {group.chapter} › {group.sheet}
                </div>
                <div className="data-pkg-report__cols">{group.columns.join(", ")}</div>
            </div>
        ))}
    </div>
));
UpdateReportView.displayName = "UpdateReportView";

const DataPackageDialog: React.FC<DataPackageDialogProps> = ({ onClose, onImported }) => {
    const { show } = useToast();

    const [packages, setPackages] = useState<DataPackage[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [report, setReport] = useState<UpdateReport | null>(null);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const { data } = await axiosInstance.get("/continents/data_packages");
                const found: DataPackage[] = data?.data?.packages ?? [];

                setPackages(found);
                if (found.length > 0) setSelected(found[0].name);
            } catch (err: any) {
                show({
                    type: "error",
                    message:
                        err.response?.data?.message || "Failed to load data packages",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, [show]);

    const isFullReseed = selected === FULL_RESEED;

    const runImport = useCallback(async () => {
        if (!selected) return;

        setImporting(true);

        try {
            if (selected === FULL_RESEED) {
                const { data } = await axiosInstance.get("/continents/initialize_db");
                show({
                    type: "success",
                    message: data?.message || "Database reseeded.",
                });
                onImported();
                onClose();
                return;
            }

            const { data } = await axiosInstance.post(
                "/continents/data_packages/import",
                { package: selected }
            );

            setReport(data?.data ?? null);
            show({ type: "success", message: data?.message || "Import completed." });
            onImported();
        } catch (err: any) {
            show({
                type: "error",
                message: err.response?.data?.message || "Failed to import data package",
            });
        } finally {
            setImporting(false);
        }
    }, [selected, show, onImported, onClose]);

    const pickerContent = useMemo(() => {
        if (loading) return <Loader />;

        return (
            <>
                <div className="data-pkg-list">
                    {packages.length === 0 && (
                        <div style={{ color: "var(--mu)" }}>
                            No update packages found in <code>chapter_data/</code>.
                        </div>
                    )}

                    {packages.map((pkg) => (
                        <PackageOption
                            key={pkg.name}
                            value={pkg.name}
                            name={pkg.name}
                            meta={`${pkg.fileCount} chapter files · updates existing records in place`}
                            checked={selected === pkg.name}
                            onSelect={setSelected}
                        />
                    ))}

                    <PackageOption
                        value={FULL_RESEED}
                        name="Full re-seed (legacy root files)"
                        meta="Rebuilds everything from the .xlsx files in the project root"
                        checked={isFullReseed}
                        danger
                        onSelect={setSelected}
                    />
                </div>

                {isFullReseed && (
                    <div className="data-pkg-warning">
                        This deletes every continent and country record and rebuilds them from
                        scratch. Any edit made in the dashboard will be lost.
                    </div>
                )}
            </>
        );
    }, [loading, packages, selected, isFullReseed]);

    if (importing) {
        return (
            <ModalDialog
                title="Importing…"
                content={<Loader />}
                cancelText={undefined}
            />
        );
    }

    if (report) {
        return (
            <ModalDialog
                title={`Imported ${report.package}`}
                content={<UpdateReportView result={report} />}
                confirmText="Done"
                onConfirm={onClose}
                onCancel={onClose}
            />
        );
    }

    return (
        <ModalDialog
            title="Update Country Intelligence Data"
            content={pickerContent}
            confirmText={isFullReseed ? "Re-seed database" : "Import"}
            confirmClassName={isFullReseed ? "dashboard-btn--delete-ghost" : undefined}
            disabled={!selected}
            cancelText="Cancel"
            onConfirm={runImport}
            onCancel={onClose}
        />
    );
};

export default memo(DataPackageDialog);
