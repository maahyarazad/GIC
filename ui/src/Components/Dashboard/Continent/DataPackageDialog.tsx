import React, { useEffect, useState } from "react";
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
    }, []);

    const runImport = async () => {
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
    };

    const renderReport = (result: UpdateReport) => (
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
    );

    const renderPicker = () => {
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
                        <label
                            key={pkg.name}
                            className={`data-pkg-option ${
                                selected === pkg.name ? "data-pkg-option--selected" : ""
                            }`}
                        >
                            <input
                                type="radio"
                                name="data-package"
                                checked={selected === pkg.name}
                                onChange={() => setSelected(pkg.name)}
                            />
                            <div>
                                <div className="data-pkg-option__name">{pkg.name}</div>
                                <div className="data-pkg-option__meta">
                                    {pkg.fileCount} chapter files · updates existing records in
                                    place
                                </div>
                            </div>
                        </label>
                    ))}

                    <label
                        className={`data-pkg-option data-pkg-option--danger ${
                            selected === FULL_RESEED ? "data-pkg-option--selected" : ""
                        }`}
                    >
                        <input
                            type="radio"
                            name="data-package"
                            checked={selected === FULL_RESEED}
                            onChange={() => setSelected(FULL_RESEED)}
                        />
                        <div>
                            <div className="data-pkg-option__name">
                                Full re-seed (legacy root files)
                            </div>
                            <div className="data-pkg-option__meta">
                                Rebuilds everything from the .xlsx files in the project root
                            </div>
                        </div>
                    </label>
                </div>

                {selected === FULL_RESEED && (
                    <div className="data-pkg-warning">
                        This deletes every continent and country record and rebuilds them from
                        scratch. Any edit made in the dashboard will be lost.
                    </div>
                )}
            </>
        );
    };

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
                content={renderReport(report)}
                confirmText="Done"
                onConfirm={onClose}
                onCancel={onClose}
            />
        );
    }

    return (
        <ModalDialog
            title="Update Country Intelligence Data"
            content={renderPicker()}
            confirmText={selected === FULL_RESEED ? "Re-seed database" : "Import"}
            confirmClassName={
                selected === FULL_RESEED ? "dashboard-btn--delete-ghost" : undefined
            }
            disabled={!selected}
            cancelText="Cancel"
            onConfirm={runImport}
            onCancel={onClose}
        />
    );
};

export default DataPackageDialog;
