import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers, FormikProps } from "formik";
import * as Yup from "yup";
import { useToast } from "@/Providers/ToastContext";
import {
    apiErrorMessage,
    apiFieldErrors,
    fetchLetterPdf,
    saveLetter,
} from "@/api/recommendationLetters";
import type {
    LetterFields,
    LetterRequestDetail,
} from "../../../../../src/types/recommendationLetter.types";

// Characters the PDF's standard fonts (WinAnsi) can print; anything else becomes "?".
const NOT_PRINTABLE = /[^\x00-\xFF‘’“”–—…€•]/;

// Mirrors validateLetter() in src/services/recommendationLetterText.ts.
const text = (label: string, max: number) =>
    Yup.string().trim().max(max, `${label} must be at most ${max} characters`);
const required = (label: string, max: number) => text(label, max).required(`${label} is required`);

const base = {
    recipientCompany: text("Recipient company", 160),
    recipientStreet: text("Street", 200),
    recipientCity: text("City", 120),
    recipientCountry: text("Country", 120),
    letterDate: Yup.string().required("Date is required").matches(/^\d{4}-\d{2}-\d{2}$/, "Date is invalid"),
    companyName: required("Company name", 160).min(2, "Company name must be at least 2 characters"),
    reference: text("Reference", 200),
    salutation: required("Salutation", 160),
    companyLocation: required("Company location", 80),
    projectName: required("Project / business opportunity", 200),
    closing: required("Closing", 1000),
};

/** Save and send: everything the letter needs. */
const saveSchema = Yup.object({
    ...base,
    industry: required("Industry / business sector", 200),
    productsServices: required("Products / services", 300),
});

/** View and Download: an incomplete draft can still be previewed. */
const previewSchema = Yup.object({
    ...base,
    industry: text("Industry / business sector", 200),
    productsServices: text("Products / services", 300),
});

const formatSavedAt = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

interface TextFieldProps {
    name: keyof LetterFields;
    label: string;
    values: LetterFields;
    required?: boolean;
    type?: string;
    as?: "textarea";
    placeholder?: string;
}

const TextField = ({ name, label, values, required: isRequired, type = "text", as, placeholder }: TextFieldProps) => (
    <div className="rl-field">
        <label htmlFor={`rl-${name}`} className={isRequired ? "required" : undefined}>{label}</label>
        <Field
            id={`rl-${name}`}
            name={name}
            type={as ? undefined : type}
            as={as}
            rows={as ? 4 : undefined}
            className="form-control"
            placeholder={placeholder}
        />
        {NOT_PRINTABLE.test(values[name] ?? "") && (
            <div className="rl-hint">Some characters can't be printed in the PDF and will appear as “?”.</div>
        )}
        <ErrorMessage name={name}>{(msg) => <div className="rl-error">{msg}</div>}</ErrorMessage>
    </div>
);

/** Lets the page save the open letter before sending it ("Save & send"). */
export type SubmitLetter = () => Promise<LetterRequestDetail>;

interface LetterEditorProps {
    detail: LetterRequestDetail;
    onSaved(detail: LetterRequestDetail): void;
    onDirtyChange(dirty: boolean): void;
    submitRef?: React.MutableRefObject<SubmitLetter | null>;
}

const LetterEditor: React.FC<LetterEditorProps> = ({ detail, onSaved, onDirtyChange, submitRef }) => {
    const { show } = useToast();
    const [pdfBusy, setPdfBusy] = useState<"view" | "download" | null>(null);

    // Throws on validation or server errors, so "Save & send" can stop before sending.
    const save = async (values: LetterFields, helpers: FormikHelpers<LetterFields>): Promise<LetterRequestDetail> => {
        try {
            const updated = await saveLetter(detail.id, values);
            show({ type: "success", message: "Letter saved" });
            helpers.resetForm({ values: updated.letter });
            onSaved(updated);
            return updated;
        } catch (error) {
            const fieldErrors = apiFieldErrors(error);
            if (fieldErrors) helpers.setErrors(fieldErrors);
            show({ type: "error", message: apiErrorMessage(error, "Failed to save the letter") });
            throw error;
        }
    };

    /** Validates with the preview rules; shows the errors and returns false when invalid. */
    const validForPreview = async (form: FormikProps<LetterFields>): Promise<boolean> => {
        try {
            await previewSchema.validate(form.values, { abortEarly: false });
            return true;
        } catch (error) {
            const errors: Record<string, string> = {};
            for (const issue of (error as Yup.ValidationError).inner) {
                if (issue.path && !errors[issue.path]) errors[issue.path] = issue.message;
            }
            form.setErrors(errors);
            form.setTouched(Object.fromEntries(Object.keys(errors).map((key) => [key, true])), false);
            return false;
        }
    };

    const showPdfError = (form: FormikProps<LetterFields>, error: unknown) => {
        const fieldErrors = apiFieldErrors(error);
        if (fieldErrors) form.setErrors(fieldErrors);
        show({ type: "error", message: apiErrorMessage(error, "Failed to generate the PDF") });
    };

    const view = async (form: FormikProps<LetterFields>) => {
        // Opened synchronously in the click so the popup blocker allows it.
        const tab = window.open("", "_blank");
        if (!tab) {
            show({ type: "warning", message: "Allow pop-ups for this site to view the PDF" });
            return;
        }
        if (!(await validForPreview(form))) {
            tab.close();
            return;
        }
        tab.document.write('<p style="font-family:sans-serif;padding:1rem">Generating PDF…</p>');

        setPdfBusy("view");
        try {
            const url = URL.createObjectURL(await fetchLetterPdf(detail.id, form.values, "inline"));
            tab.location.href = url;
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            tab.close();
            showPdfError(form, error);
        } finally {
            setPdfBusy(null);
        }
    };

    const download = async (form: FormikProps<LetterFields>) => {
        if (!(await validForPreview(form))) return;

        setPdfBusy("download");
        try {
            const url = URL.createObjectURL(await fetchLetterPdf(detail.id, form.values, "attachment"));
            const link = document.createElement("a");
            link.href = url;
            link.download = `${detail.reference}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            showPdfError(form, error);
        } finally {
            setPdfBusy(null);
        }
    };

    return (
        <Formik<LetterFields>
            initialValues={detail.letter}
            validationSchema={saveSchema}
            onSubmit={(values, helpers) => save(values, helpers).catch(() => undefined)}
        >
            {(form) => (
                <EditorBody
                    form={form}
                    detail={detail}
                    pdfBusy={pdfBusy}
                    onDirtyChange={onDirtyChange}
                    submitRef={submitRef}
                    save={save}
                    onView={() => view(form)}
                    onDownload={() => download(form)}
                />
            )}
        </Formik>
    );
};

interface EditorBodyProps {
    form: FormikProps<LetterFields>;
    detail: LetterRequestDetail;
    pdfBusy: "view" | "download" | null;
    onDirtyChange(dirty: boolean): void;
    submitRef?: React.MutableRefObject<SubmitLetter | null>;
    save(values: LetterFields, helpers: FormikHelpers<LetterFields>): Promise<LetterRequestDetail>;
    onView(): void;
    onDownload(): void;
}

// Separate component so hooks can depend on the Formik state.
const EditorBody: React.FC<EditorBodyProps> = ({ form, detail, pdfBusy, onDirtyChange, submitRef, save, onView, onDownload }) => {
    const { values, dirty, isSubmitting } = form;

    useEffect(() => {
        onDirtyChange(dirty);
    }, [dirty, onDirtyChange]);

    // Validates with the save rules, then saves; rejects when the letter can't be saved.
    useEffect(() => {
        if (!submitRef) return;
        submitRef.current = async () => {
            const errors = await form.validateForm();
            if (Object.keys(errors).length > 0) {
                form.setTouched(Object.fromEntries(Object.keys(errors).map((key) => [key, true])), false);
                throw new Error("The letter has errors. Fix them before sending.");
            }
            form.setSubmitting(true);
            try {
                return await save(form.values, form);
            } finally {
                form.setSubmitting(false);
            }
        };
        return () => {
            submitRef.current = null;
        };
    });

    return (
        <Form className="rl-editor" noValidate>
            <div className="rl-editor__header">
                <h4>{detail.reference}</h4>
                <div className="rl-muted">
                    for {detail.requester.name} ({detail.requester.email})
                    {detail.requester.company ? ` · ${detail.requester.company}` : ""}
                </div>
                <div className="rl-muted">
                    {detail.isDraftSaved && detail.savedAt
                        ? `Last saved${detail.savedBy?.name ? ` by ${detail.savedBy.name}` : ""} at ${formatSavedAt(detail.savedAt)}`
                        : "Not saved yet"}
                </div>
            </div>

            <div className="rl-group-title">Recipient</div>
            <div className="rl-row2">
                <TextField name="recipientCompany" label="Company" values={values} />
                <TextField name="recipientStreet" label="Street" values={values} />
            </div>
            <div className="rl-row2">
                <TextField name="recipientCity" label="City" values={values} />
                <TextField name="recipientCountry" label="Country" values={values} />
            </div>

            <div className="rl-group-title">Letter</div>
            <div className="rl-row2">
                <TextField name="letterDate" label="Date" type="date" required values={values} />
                <TextField name="reference" label="Reference" values={values} placeholder="RFQ, Tender, Project" />
            </div>
            <TextField name="salutation" label="Salutation" required values={values} placeholder="Dear Mr. Smith," />

            <div className="rl-group-title">Company</div>
            <div className="rl-row2">
                <TextField name="companyName" label="Company name" required values={values} />
                <TextField name="companyLocation" label="Company location" required values={values} placeholder="Dubai-based" />
            </div>
            <TextField name="industry" label="Industry / business sector" required values={values} />
            <TextField name="productsServices" label="Products / services / solutions" required values={values} />
            <TextField name="projectName" label="Project / business opportunity" required values={values} />

            <div className="rl-group-title">Closing</div>
            <TextField name="closing" label="Closing line" required as="textarea" values={values} />

            <div className="rl-editor__actions">
                <button type="submit" className="dashboard-btn" disabled={isSubmitting}>
                    {isSubmitting ? "Saving…" : "Save"}
                </button>
                <button type="button" className="dashboard-btn dashboard-btn--ghost-minimal" disabled={pdfBusy !== null} onClick={onView}>
                    {pdfBusy === "view" ? "Generating…" : "View"}
                </button>
                <button type="button" className="dashboard-btn dashboard-btn--ghost-minimal" disabled={pdfBusy !== null} onClick={onDownload}>
                    {pdfBusy === "download" ? "Generating…" : "Download PDF"}
                </button>
            </div>
        </Form>
    );
};

export default LetterEditor;
