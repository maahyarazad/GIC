import React from "react";
import { FaPen, FaTrash, FaEye } from "react-icons/fa6";

interface GridActionsProps {
    /** Pencil — edit the row. */
    onEdit?: () => void;
    /** Trash — delete the row (rendered with the danger style). */
    onDelete?: () => void;
    /** Eye — view the row's details. */
    onView?: () => void;
    /** Disable every rendered action (e.g. while a row operation is in flight). */
    disabled?: boolean;
}

/**
 * Consistent datagrid row actions for the dashboard. Each handler that is passed
 * renders one Font Awesome icon button, reusing the dashboard icon-button styles
 * (`dashboard-btn--icon` / `dashboard-btn--icon-danger`) so radius, focus ring and
 * pointer cursor come for free. Icons carry an accessible label via `aria-label` + `title`.
 */
const GridActions: React.FC<GridActionsProps> = ({ onEdit, onDelete, onView, disabled }) => (
    <div className="d-flex gap-2 flex-wrap">
        {onView && (
            <button
                type="button"
                className="dashboard-btn--icon"
                title="View"
                aria-label="View"
                disabled={disabled}
                onClick={onView}
            >
                <FaEye />
            </button>
        )}
        {onEdit && (
            <button
                type="button"
                className="dashboard-btn--icon"
                title="Edit"
                aria-label="Edit"
                disabled={disabled}
                onClick={onEdit}
            >
                <FaPen />
            </button>
        )}
        {onDelete && (
            <button
                type="button"
                className="dashboard-btn--icon-danger"
                title="Delete"
                aria-label="Delete"
                disabled={disabled}
                onClick={onDelete}
            >
                <FaTrash />
            </button>
        )}
    </div>
);

export default GridActions;
