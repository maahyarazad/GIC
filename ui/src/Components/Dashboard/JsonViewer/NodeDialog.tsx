import React, { useEffect, useRef, useState } from "react";
import {
    JsonPath,
    ValueType,
    blankOf,
    formatPath,
    parseValue,
    toEditableText,
    typeOf,
} from "./jsonPath";

const TYPE_OPTIONS: { value: ValueType; label: string }[] = [
    { value: "string", label: "Text" },
    { value: "number", label: "Number" },
    { value: "boolean", label: "True / false" },
    { value: "null", label: "Null" },
    { value: "json", label: "Object / array (JSON)" },
];

export type NodeDialogRequest =
    // Edit the value (and, for object properties, the key) of the node at `path`.
    | { mode: "edit"; path: JsonPath; value: unknown; siblingKeys: string[] }
    // Add a child to the object or array at `path`.
    | { mode: "add"; path: JsonPath; container: object };

export type NodeDialogResult =
    | { mode: "edit"; path: JsonPath; value: unknown; newKey?: string }
    | { mode: "add"; path: JsonPath; value: unknown; key?: string };

interface NodeDialogProps {
    request: NodeDialogRequest;
    onApply: (result: NodeDialogResult) => void;
    onClose: () => void;
}

const initialFor = (request: NodeDialogRequest): { key: string; type: ValueType; text: string } => {
    if (request.mode === "edit") {
        const key = request.path[request.path.length - 1];
        return { key: String(key), type: typeOf(request.value), text: toEditableText(request.value) };
    }
    // New array item: copy the shape of the last item, so a list of objects gets a blank object.
    if (Array.isArray(request.container) && request.container.length > 0) {
        const template = blankOf(request.container[request.container.length - 1]);
        return { key: "", type: typeOf(template), text: toEditableText(template) };
    }
    return { key: "", type: "string", text: "" };
};

const NodeDialog: React.FC<NodeDialogProps> = ({ request, onApply, onClose }) => {
    const initial = initialFor(request);
    const [key, setKey] = useState(initial.key);
    const [type, setType] = useState<ValueType>(initial.type);
    const [text, setText] = useState(initial.text);
    const [errors, setErrors] = useState<{ key?: string; value?: string }>({});
    const firstFieldRef = useRef<HTMLInputElement & HTMLTextAreaElement & HTMLSelectElement>(null);

    // Array items have no key of their own; object properties do.
    const isArrayItem =
        request.mode === "edit"
            ? typeof request.path[request.path.length - 1] === "number"
            : Array.isArray(request.container);
    const showKey = !isArrayItem;

    useEffect(() => {
        firstFieldRef.current?.focus();
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    const changeType = (next: ValueType) => {
        setType(next);
        setErrors({});
        // Switching to a structured type with an empty field: start from an empty object.
        if (next === "json" && text.trim() === "") setText("{}");
        if (next === "boolean" && text !== "true" && text !== "false") setText("false");
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const nextErrors: { key?: string; value?: string } = {};

        const trimmedKey = key.trim();
        if (showKey) {
            const taken =
                request.mode === "edit"
                    ? request.siblingKeys.filter((k) => k !== initial.key)
                    : Object.keys(request.container);
            if (!trimmedKey) nextErrors.key = "Key is required";
            else if (taken.includes(trimmedKey)) nextErrors.key = `“${trimmedKey}” already exists here`;
        }

        const parsed = parseValue(type, text);
        if ("error" in parsed) nextErrors.value = parsed.error;

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0 || "error" in parsed) return;

        if (request.mode === "edit") {
            onApply({
                mode: "edit",
                path: request.path,
                value: parsed.value,
                newKey: showKey ? trimmedKey : undefined,
            });
        } else {
            onApply({ mode: "add", path: request.path, value: parsed.value, key: showKey ? trimmedKey : undefined });
        }
    };

    const title =
        request.mode === "edit"
            ? `Edit ${formatPath(request.path)}`
            : Array.isArray(request.container)
                ? `Add item to ${formatPath(request.path)}`
                : `Add key to ${formatPath(request.path)}`;

    return (
        <div className="json-node-dialog-backdrop" onMouseDown={onClose}>
            <form
                className="json-node-dialog"
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onMouseDown={(e) => e.stopPropagation()}
                onSubmit={submit}
                noValidate
            >
                <h4 className="json-node-dialog__title">{title}</h4>

                {showKey && (
                    <div className="json-node-dialog__field">
                        <label htmlFor="json-node-key">Key</label>
                        <input
                            id="json-node-key"
                            ref={firstFieldRef}
                            className="form-control"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                        />
                        {errors.key && <div className="json-node-dialog__error">{errors.key}</div>}
                    </div>
                )}

                <div className="json-node-dialog__field">
                    <label htmlFor="json-node-type">Type</label>
                    <select
                        id="json-node-type"
                        className="form-select"
                        value={type}
                        onChange={(e) => changeType(e.target.value as ValueType)}
                        {...(!showKey ? { ref: firstFieldRef } : {})}
                    >
                        {TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                {type !== "null" && (
                    <div className="json-node-dialog__field">
                        <label htmlFor="json-node-value">Value</label>
                        {type === "boolean" ? (
                            <select
                                id="json-node-value"
                                className="form-select"
                                value={text === "true" ? "true" : "false"}
                                onChange={(e) => setText(e.target.value)}
                            >
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        ) : type === "number" ? (
                            <input
                                id="json-node-value"
                                className="form-control"
                                inputMode="decimal"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                        ) : (
                            <textarea
                                id="json-node-value"
                                className={`form-control${type === "json" ? " json-node-dialog__code" : ""}`}
                                rows={type === "json" ? 10 : 4}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                spellCheck={type !== "json"}
                            />
                        )}
                        {errors.value && <div className="json-node-dialog__error">{errors.value}</div>}
                        {type === "json" && (
                            <div className="json-node-dialog__hint">Enter an object like {"{ \"title\": \"\" }"} or an array like [ ].</div>
                        )}
                    </div>
                )}

                <div className="json-node-dialog__actions">
                    <button type="button" className="dashboard-btn dashboard-btn--ghost-minimal" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="dashboard-btn">
                        {request.mode === "edit" ? "Apply" : "Add"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NodeDialog;
