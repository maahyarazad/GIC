import React, { useEffect, useState } from "react";
import { ObjectId } from "mongodb";
import './GenericDataGrid.css';
export interface Column<T> {
    field?: keyof T;
    headerName: string;
    width: number | string;
    renderCell?: (row: T) => React.ReactNode;
    sortable?: boolean;
    filterable?: boolean;
}

export interface PaginationModel {
    page: number;       // current page (1-based)
    pageSize: number;   // items per page
}

export interface SortModel<T> {
    field: keyof T;
    sort: "asc" | "desc";
}

export interface FilterModel<T> {
    field: keyof T;
    operator: "contains" | "equals" | "startsWith" | "endsWith"; // extend as needed
    value: string | number;
}

interface DataGridProps<T> {
    rows: T[];
    columns: Column<T>[];
    rowCount: number;

    paginationModel: PaginationModel;
    onPaginationModelChange: (model: PaginationModel) => void;

    sortModel?: SortModel<T> | null;
    onSortModelChange?: (model: SortModel<T> | null) => void;

    filterModel?: FilterModel<T>[] | null;
    onFilterModelChange?: (model: FilterModel<T>[] | null) => void;

    rowsPerPageOptions?: number[];
    loading?: boolean;

    // New prop: function to get unique id from row
    getRowId: (row: T) => string | number;
    prevButtonClassName?: string;
    nextButtonClassName?: string;

}


export function GenericDataGrid<T extends { _id?: string | number | ObjectId }>({
    rows,
    columns,
    rowCount,

    paginationModel,
    onPaginationModelChange,

    sortModel,
    onSortModelChange,

    filterModel,
    onFilterModelChange,

    rowsPerPageOptions = [5, 10, 25],
    loading = false,
    prevButtonClassName,
    nextButtonClassName,
}: DataGridProps<T>) {
    // Handlers
    const handlePageChange = (newPage: number) => {
        if (newPage < 1) newPage = 1;
        const totalPages = Math.ceil(rowCount / paginationModel.pageSize);
        if (newPage > totalPages) newPage = totalPages;

        onPaginationModelChange({ ...paginationModel, page: newPage });
    };

    const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onPaginationModelChange({ page: 1, pageSize: parseInt(e.target.value, 10) });
    };


    const [copyFeedback, setCopyFeedback] = useState<{
        x: number;
        y: number;
        visible: boolean;
    } | null>(null);


    const copyToClipboard = (
        text: string,
        event: React.MouseEvent
    ) => {
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            setCopyFeedback({
                x: event.clientX,
                y: event.clientY,
                visible: true,
            });

            // Auto hide after 1.5s
            setTimeout(() => {
                setCopyFeedback(null);
            }, 1500);
        }).catch((err) => {
            console.error("Could not copy text: ", err);
        });
    };


    const handleSort = (field: keyof T) => {
        if (!onSortModelChange) return;
        if (!sortModel || sortModel.field !== field) {
            onSortModelChange({ field, sort: "asc" });
        } else if (sortModel.sort === "asc") {
            onSortModelChange({ field, sort: "desc" });
        } else {
            onSortModelChange(null); // remove sorting
        }
    };

    const handleFilterChange = (field: keyof T, value: string) => {
        if (!onFilterModelChange) return;

        let newFilters: FilterModel<T>[] = [];

        if (Array.isArray(filterModel)) {
            // Copy existing filters except the one being updated
            newFilters = filterModel.filter((f) => f.field !== field);
        }

        if (value) {
            // Add or update the filter for this field
            newFilters.push({
                field,
                operator: "contains",
                value,
            });
        }

        // If no filters left, send null
        onFilterModelChange(newFilters.length > 0 ? newFilters : null);
    };


    const totalPages = Math.ceil(rowCount / paginationModel.pageSize);

    return (
        <>
            {copyFeedback && (
                <div
                    className="copy-toast"
                    style={{
                        top: copyFeedback.y,
                        left: copyFeedback.x,
                    }}
                >
                    Copied ✓
                </div>
            )}
            <div className="table-wrapper">
                <table className="my-table" >
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={String(col.field ?? col.headerName)}
                                    style={{
                                        cursor: col.sortable ? "pointer" : "default",
                                        width: col.width,
                                    }}
                                    onClick={() => {
                                        if (col.sortable && col.field) {
                                            handleSort(col.field);
                                        }
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        <span>{col.headerName}</span>
                                        {col.sortable && sortModel?.field === col.field && (
                                            <span>{sortModel?.sort === "asc" ? "▲" : "▼"}</span>
                                        )}
                                    </div>

                                    {col.filterable && col.field && (
                                        <input
                                            onClick={(e) => e.stopPropagation()}
                                            type="text"
                                            value={
                                                Array.isArray(filterModel)
                                                    ? filterModel.find((f) => f.field === col.field)?.value ?? ""
                                                    : ""
                                            }
                                            onChange={(e) => {
                                                if (col.field) {

                                                    handleFilterChange(col.field!, e.target.value);
                                                }
                                            }}
                                            placeholder="Filter..."
                                            style={{ marginTop: 4, width: "90%" }}
                                        />
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="td-center">
                                    Loading...
                                </td>
                            </tr>
                        ) : rows?.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="td-center">
                                    No data found.
                                </td>
                            </tr>
                        ) : (
                            rows?.map((row) => (
                                <tr key={row._id?.toString()}>
                                    {columns.map((col, idx) => (
                                        <td className="td-scroll"
                                            title={String(col.field
                                                ? String(row[col.field])
                                                : null)}
                                            onClick={(e) => {
                                                if (!col.field || col.renderCell) return;
                                                if (col.field) {
                                                    copyToClipboard(String(row[col.field]), e)
                                                }
                                            }}
                                            key={String(col.field ?? idx)}
                                            data-label={col.headerName}
                                        >
                                            {col.renderCell
                                                ? col.renderCell(row)
                                                : col.field
                                                    ? String(row[col.field])
                                                    : null}


                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>


                </table>

                {/* Pagination Controls */}
                <div className="grid-pagination">
                    <span>
                        Page {paginationModel.page} of {totalPages} ({rowCount} items)
                    </span>

                    <div className="grid-pagination-controls">
                        <button
                            className={prevButtonClassName}
                            onClick={() => handlePageChange(paginationModel.page - 1)}
                            disabled={paginationModel.page <= 1}
                        >
                            Previous
                        </button>

                        <button
                            className={nextButtonClassName}
                            onClick={() => handlePageChange(paginationModel.page + 1)}
                            disabled={paginationModel.page >= totalPages}
                        >
                            Next
                        </button>
                    </div>

                    <div className="grid-pagination-size">
                        <label htmlFor="pageSizeSelect">Rows per page:</label>
                        <select
                            id="pageSizeSelect"
                            value={paginationModel.pageSize}
                            onChange={handlePageSizeChange}
                        >
                            {rowsPerPageOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </>
    );
}
