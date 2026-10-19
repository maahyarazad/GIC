import React, { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage, FormikHelpers, useFormikContext } from "formik";
import * as Yup from "yup";
import "./BusinessLetter.css";
import type { RootState } from "../../../store";
import type { CreateBusinessLetterRequest } from "../../../../../src/types/businessLetter.types";
import type { LetterFields } from "../../../../../src/types/recommendationLetter.types";
import {
  DEFAULT_BODY_CLOSING,
  DEFAULT_SALUTATION,
  defaultBodyIntro,
  defaultBodyMain,
} from "../../../../../src/types/recommendationLetter.types";
import { createBusinessLetterRequest, previewBusinessLetterPdf } from "@/api/businessLetter";
import { useToast } from "@/Providers/ToastContext";
import LetterPreview from "../RecommendationLetters/LetterPreview";

// Characters the PDF's standard fonts (WinAnsi) can print; anything else becomes "?". Mirrors LetterEditor.
const NOT_PRINTABLE = /[^\x00-\xFF‘’“”–—…€•]/;

const todayLocalISO = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// Validation mirrors LetterEditor's saveSchema: the full recipient block + reference are required to submit.
const text = (label: string, max: number) =>
  Yup.string().trim().max(max, `${label} must be at most ${max} characters`);
const required = (label: string, max: number) => text(label, max).required(`${label} is required`);

const validationSchema = Yup.object({
  recipientTitle: required("Title", 120),
  recipientFullName: required("Full name", 160),
  recipientAttn: required("Attn", 160),
  recipientAddress: required("Address", 300),
  recipientCity: required("City", 120),
  recipientCountry: required("Country", 120),
  letterDate: Yup.string().required("Date is required").matches(/^\d{4}-\d{2}-\d{2}$/, "Date is invalid"),
  reference: required("Reference", 200),
  salutation: required("Salutation", 160),
  companyName: required("Company name", 160).min(2, "Company name must be at least 2 characters"),
  projectName: required("Project / business opportunity", 200),
  bodyIntro: required("Intro paragraph", 600),
  bodyMain: required("Body", 4000),
  bodyClosing: required("Closing line", 1000),
});

// Fields in the order they appear on the form, so "first invalid" means the topmost one.
const FIELD_ORDER: (keyof LetterFields)[] = [
  "recipientTitle",
  "recipientFullName",
  "recipientAttn",
  "recipientAddress",
  "recipientCity",
  "recipientCountry",
  "letterDate",
  "reference",
  "salutation",
  "companyName",
  "projectName",
  "bodyIntro",
  "bodyMain",
  "bodyClosing",
];

/**
 * On a failed submit, scrolls the first invalid field into view and focuses it. Runs once per submit
 * attempt (tracked via submitCount) and only after validation has settled (isValidating === false),
 * so it reads the final errors rather than firing on every field-level revalidation.
 */
const ScrollToFirstError: React.FC<{ containerRef: React.RefObject<HTMLElement | null> }> = ({ containerRef }) => {
  const { submitCount, isValidating, errors } = useFormikContext<LetterFields>();
  const handledRef = useRef(0);

  useEffect(() => {
    if (isValidating || submitCount === handledRef.current) return;
    handledRef.current = submitCount;

    const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
    if (!firstInvalid) return;

    const el = containerRef.current?.querySelector<HTMLElement>(`#bl-${firstInvalid}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });
    }
  }, [submitCount, isValidating, errors, containerRef]);

  return null;
};

/** Trims every value so the stored letter and the preview stay tidy. */
const trimmedLetter = (values: LetterFields): LetterFields => {
  const out = {} as LetterFields;
  (Object.keys(values) as (keyof LetterFields)[]).forEach((key) => {
    out[key] = (values[key] ?? "").trim();
  });
  return out;
};

interface TextFieldProps {
  name: keyof LetterFields;
  label: string;
  values: LetterFields;
  required?: boolean;
  type?: string;
  as?: "textarea";
  rows?: number;
  placeholder?: string;
}

const TextField: React.FC<TextFieldProps> = ({ name, label, values, required: isRequired, type = "text", as, rows, placeholder }) => (
  <div className="bl-field">
    <label htmlFor={`bl-${name}`} className={isRequired ? "required" : undefined}>{label}</label>
    <Field
      id={`bl-${name}`}
      name={name}
      type={as ? undefined : type}
      as={as}
      rows={as ? rows ?? 4 : undefined}
      className="form-control"
      placeholder={placeholder}
    />
    {NOT_PRINTABLE.test(values[name] ?? "") && (
      <div className="bl-hint">Some characters can't be printed in the PDF and will appear as “?”.</div>
    )}
    <ErrorMessage name={name}>{(msg) => <div className="bl-error">{msg}</div>}</ErrorMessage>
  </div>
);

interface BusinessLetterProps {
  /** Called after a request is created, so the parent can refetch the requests list. */
  onCreated?: () => void;
}

const BusinessLetter: React.FC<BusinessLetterProps> = ({ onCreated }) => {
  const user = useSelector((state: RootState) => state.auth?.user);
  const { show } = useToast();
  // Scopes the "scroll to first invalid field" lookup to this form.
  const formCardRef = useRef<HTMLDivElement>(null);

  // Preset the letter the way the admin editor seeds a fresh draft: today's date, a generic greeting,
  // and the template body (with [Company Name] / [Project] placeholders until the member fills them).
  const initialValues = useMemo<LetterFields>(
    () => ({
      recipientTitle: "",
      recipientFullName: "",
      recipientAttn: "",
      recipientAddress: "",
      recipientCity: "",
      recipientCountry: "",
      letterDate: todayLocalISO(),
      companyName: "",
      reference: "",
      salutation: DEFAULT_SALUTATION,
      companyLocation: "",
      industry: "",
      productsServices: "",
      projectName: "",
      bodyIntro: defaultBodyIntro(""),
      bodyMain: defaultBodyMain("", ""),
      bodyClosing: DEFAULT_BODY_CLOSING,
      closing: "",
    }),
    []
  );

  const handleSubmit = async (values: LetterFields, helpers: FormikHelpers<LetterFields>) => {
    const letter = trimmedLetter(values);
    const payload: CreateBusinessLetterRequest = {
      requester: {
        name: user?.name ?? "",
        phone: user?.phone ?? "",
        company: letter.companyName,
      },
      addressee: {
        title: letter.recipientTitle,
        fullName: letter.recipientFullName,
        attn: letter.recipientAttn,
        address: letter.recipientAddress,
        city: letter.recipientCity,
        country: letter.recipientCountry,
        reference: letter.reference,
      },
      // The real content now lives in `letter`; purpose is kept as a short request summary.
      purpose: `Letter of recommendation for ${letter.companyName || "the member"} — ${letter.projectName}`.slice(0, 2000),
      neededBy: todayLocalISO(),
      language: "en",
      letter,
    };

    try {
      const res = await createBusinessLetterRequest(payload);
      show({ type: "success", message: `Request submitted – ${res.data.reference}` });
      helpers.resetForm({ values: initialValues });
      onCreated?.();
    } catch (err: any) {
      console.error("Failed to submit the business letter request:", err);
      show({
        type: "error",
        message: err?.response?.data?.message || "Failed to submit your request. Please try again.",
      });
    } finally {
      helpers.setSubmitting(false);
    }
  };

  return (
    <div className="dash-section business-letter">
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting }) => (
          <div className="bl-grid">
            <div className="bl-card" ref={formCardRef}>

                <h4 className="">New request</h4>
              <Form noValidate>
                <ScrollToFirstError containerRef={formCardRef} />
                <div className="bl-row">
                  <TextField name="recipientTitle" label="Title" required values={values} placeholder="Mr. / Ms. / Dr." />
                  <TextField name="recipientFullName" label="Full name" required values={values} />
                </div>
                <TextField name="recipientAttn" label="Attn" required values={values} placeholder="Attention of / department" />
                <TextField name="recipientAddress" label="Address" required values={values} />
                <div className="bl-row">
                  <TextField name="recipientCity" label="City" required values={values} />
                  <TextField name="recipientCountry" label="Country" required values={values} />
                </div>

                <div className="bl-group-title">Letter</div>
                <div className="bl-row">
                  <TextField name="letterDate" label="Date" type="date" required values={values} />
                  <TextField name="reference" label="Reference" required values={values} placeholder="Project Name / Tender Number or Name / Business Initiative" />
                </div>
                <TextField name="salutation" label="Salutation" required values={values} placeholder="Dear Mr. Smith," />

                <div className="bl-group-title">Company</div>
                <TextField name="companyName" label="Company name" required values={values} />
                <TextField name="projectName" label="Project / business opportunity" required values={values} />

                <div className="bl-group-title">Body</div>
                <TextField name="bodyIntro" label="Intro paragraph (bold)" required as="textarea" rows={3} values={values} />
                <TextField name="bodyMain" label="Body" required as="textarea" rows={12} values={values} />
                <TextField name="bodyClosing" label="Closing line" required as="textarea" rows={3} values={values} />

                <button type="submit" className="btn-p bl-submit justify-content-center" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting…" : "Submit request"}
                </button>
              </Form>
            </div>

            <div className="bl-card bl-preview-card">
              <h4>Preview</h4>
              <LetterPreview<LetterFields>
                requestId="preview"
                fields={values}
                pdf={(_id, v) => previewBusinessLetterPdf(v)}
                classPrefix="bl-preview"
                emptyText="Fill in the form to preview the letter."
                errorText="Fill in Company name and Project to preview the letter."
              />
            </div>
          </div>
        )}
      </Formik>
    </div>
  );
};

export default BusinessLetter;
