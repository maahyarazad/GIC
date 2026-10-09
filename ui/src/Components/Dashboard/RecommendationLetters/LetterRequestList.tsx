import React, { memo } from "react";
import {
    LETTER_STATUS_LABELS,
    type LetterRequestListItem,
} from "../../../../../src/types/recommendationLetter.types";

const formatDay = (value?: string | null) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
    if (!match) return "—";
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatShort = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "";

interface RowProps {
    item: LetterRequestListItem;
    selected: boolean;
    busy: boolean;
    onSelect(id: string): void;
    onSend?(item: LetterRequestListItem): void;
}

const LetterRequestRow = memo(({ item, selected, busy, onSelect, onSend }: RowProps) => (
    <li
        className={`rl-row${selected ? " is-selected" : ""}`}
        onClick={() => onSelect(item.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(item.id);
            }
        }}
        aria-current={selected ? "true" : undefined}
    >
        <div className="rl-row__main">
            <div className="rl-row__top">
                <span className="rl-ref">{item.reference}</span>
                <span className={`rl-status rl-status--${item.letterStatus}`}>
                    {LETTER_STATUS_LABELS[item.letterStatus]}
                    {item.letterStatus === "sent" && item.sentAt ? ` · ${formatShort(item.sentAt)}` : ""}
                </span>
                {item.editedSinceSent && <span className="rl-tag">edited since</span>}
                {item.language === "de" && <span className="rl-tag">DE requested</span>}
            </div>
            <div className="rl-row__company">{item.requester.company || "—"}</div>
            <div className="rl-muted">
                {item.requester.name} · {item.requester.email}
            </div>
            <div className="rl-muted">Needed by {formatDay(item.neededBy)}</div>
        </div>
        {onSend && (
            <button
                type="button"
                className="rl-action"
                disabled={busy}
                onClick={(e) => {
                    e.stopPropagation();
                    onSend(item);
                }}
            >
                {busy ? "Sending…" : "Send"}
            </button>
        )}
    </li>
));
LetterRequestRow.displayName = "LetterRequestRow";

interface LetterRequestListProps {
    items: LetterRequestListItem[];
    selectedId: string | null;
    onSelect(id: string): void;
    onSend?(item: LetterRequestListItem): void;
    busyId?: string | null;
}

const LetterRequestList: React.FC<LetterRequestListProps> = ({ items, selectedId, onSelect, onSend, busyId }) =>
    items.length === 0 ? (
        <p className="rl-empty">No letter requests yet.</p>
    ) : (
        <ul className="rl-list">
            {items.map((item) => (
                <LetterRequestRow
                    key={item.id}
                    item={item}
                    selected={item.id === selectedId}
                    busy={busyId === item.id}
                    onSelect={onSelect}
                    onSend={onSend}
                />
            ))}
        </ul>
    );

export default LetterRequestList;
