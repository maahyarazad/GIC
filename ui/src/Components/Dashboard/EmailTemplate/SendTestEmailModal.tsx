import React, { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { extractTemplateVariables } from './VriableExtractor';

export interface EmailTemplate {
    _id?: string;
    name: string;
    subject: string;
    html: string;
    text?: string;
    variables?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface SendTestEmailModalHandle {
    getValues: () => { testEmail: string; variables: Record<string, string> };
    isValid: () => boolean | undefined;
}

const SendTestEmailModal = forwardRef<SendTestEmailModalHandle, {
    row: EmailTemplate;
    onValidityChange?: (isValid: boolean) => void; // ✅ callback to notify parent
}>(({ row, onValidityChange }, ref) => {
       if (!row) return null;

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const extractedVars = extractTemplateVariables(row.html);

    // ✅ Declare state BEFORE any useEffect that references it
    const [variables, setVariables] = useState<Record<string, string>>(
        Object.fromEntries(extractedVars.map((v) => [v.name, ""]))
    );
    const [testEmail, setTestEmail] = useState("");

    
    useImperativeHandle(ref, () => ({
        getValues: () => ({ testEmail, variables }),
        isValid: () => isValidEmail(testEmail),
    }));
    
    // ✅ Notify parent whenever validity changes
    useEffect(() => {
        
        onValidityChange?.(isValidEmail(testEmail));
    }, [testEmail]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Test Email</label>
                <input
                    className="co-field"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter recipient email"
                />
            </div>
            {extractedVars.map((v) => (
                <div key={v.name}>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>
                        {v.name} {v.type === "G" ? "(System)" : ""}
                    </label>
                    <input
                        className="co-field"
                        value={variables[v.name] || ""}
                        onChange={(e) =>
                            setVariables((prev) => ({
                                ...prev,
                                [v.name]: e.target.value,
                            }))
                        }
                        disabled={v.type === "G"}
                        placeholder={
                            v.type === "G"
                                ? "System will fill automatically"
                                : `Enter ${v.name}`
                        }
                    />
                </div>
            ))}
        </div>
    );
});

export default SendTestEmailModal;