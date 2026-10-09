import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import "./BusinessLetter.css";
import type { RootState } from "../../../store";
import type {
  BusinessLetterLanguage,
  BusinessLetterRequestDto,
  BusinessLetterType,
  CreateBusinessLetterRequest,
} from "../../../../../src/types/businessLetter.types";
import {
  createBusinessLetterRequest,
  downloadBusinessLetterPdf,
  listBusinessLetterRequests,
} from "@/api/businessLetter";
import { useToast } from "@/Providers/ToastContext";
import Loader from "@/Components/Loader/Loader";

const LETTER_TYPE_OPTIONS: { value: BusinessLetterType; label: string }[] = [
  { value: "business_recommendation", label: "Business Recommendation" },
  { value: "partner_recommendation", label: "Partner Recommendation" },
];

const PURPOSE_MAX = 2000;
const PAGE_SIZE = 20;

interface FormValues {
  name: string;
  phone: string;
  company: string;
  letterType: BusinessLetterType | "";
  addresseeAddress: string;
  purpose: string;
  neededBy: string;
  language: BusinessLetterLanguage;
}

// Server field paths → form field names, for mapping 400 validation details.
const SERVER_FIELD_MAP: Record<string, keyof FormValues> = {
  "requester.name": "name",
  "requester.phone": "phone",
  "requester.company": "company",
  letterType: "letterType",
  "addressee.address": "addresseeAddress",
  purpose: "purpose",
  neededBy: "neededBy",
  language: "language",
};

const todayLocalISO = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const validationSchema = Yup.object({
  name: Yup.string().trim().required("Name is required").max(120, "Name must be at most 120 characters"),
  phone: Yup.string().trim().max(40, "Phone must be at most 40 characters"),
  company: Yup.string().trim().max(160, "Company must be at most 160 characters"),
  letterType: Yup.string().required("Please choose a letter type"),
  addresseeAddress: Yup.string().trim().max(500, "Address must be at most 500 characters"),
  purpose: Yup.string()
    .trim()
    .required("Purpose is required")
    .min(10, "Please give at least 10 characters")
    .max(PURPOSE_MAX, `Purpose must be at most ${PURPOSE_MAX} characters`),
  neededBy: Yup.string()
    .required("Needed-by date is required")
    .test("not-past", "Needed-by date cannot be in the past", (value) => !value || value >= todayLocalISO()),
  language: Yup.mixed<BusinessLetterLanguage>().oneOf(["en", "de"]).required(),
});

const toPayload = (values: FormValues): CreateBusinessLetterRequest => ({
  requester: {
    name: values.name.trim(),
    phone: values.phone.trim(),
    company: values.company.trim(),
  },
  letterType: values.letterType as BusinessLetterType,
  addressee: {
    address: values.addresseeAddress.trim(),
  },
  purpose: values.purpose.trim(),
  neededBy: values.neededBy,
  language: values.language,
});

const formatDate = (value: string, dateOnly = false) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  });

const FieldError: React.FC<{ name: keyof FormValues }> = ({ name }) => (
  <ErrorMessage name={name}>{(msg) => <div className="bl-error">{msg}</div>}</ErrorMessage>
);

const BusinessLetter: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth?.user);
  const { show } = useToast();

  const [requests, setRequests] = useState<BusinessLetterRequestDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const initialValues = useMemo<FormValues>(
    () => ({
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      company: "",
      letterType: "",
      addresseeAddress: "",
      purpose: "",
      neededBy: "",
      language: "en",
    }),
    [user?.name, user?.phone]
  );

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listBusinessLetterRequests({ limit: PAGE_SIZE, skip: 0 });
      setRequests(data.items);
      setTotal(data.total);
    } catch (err) {
      // Show the empty state rather than an error; the history is secondary to the form.
      console.error("Failed to fetch business letter requests", err);
      setRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const loadMore = async () => {
    try {
      setLoadingMore(true);
      const data = await listBusinessLetterRequests({ limit: PAGE_SIZE, skip: requests.length });
      setRequests((prev) => [...prev, ...data.items]);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load more business letter requests", err);
      show({ type: "error", message: "Failed to load more requests" });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSubmit = async (values: FormValues, helpers: FormikHelpers<FormValues>) => {
    try {
      const res = await createBusinessLetterRequest(toPayload(values));
      show({ type: "success", message: `Request submitted – ${res.data.reference}` });
      helpers.resetForm({ values: initialValues });
      fetchRequests();
    } catch (err: any) {
      const error = err?.response?.data?.error;
      if (error?.code === "VALIDATION_ERROR" && error.details) {
        const formErrors: Partial<Record<keyof FormValues, string>> = {};
        Object.entries(error.details as Record<string, string>).forEach(([field, message]) => {
          const formField = SERVER_FIELD_MAP[field];
          if (formField) formErrors[formField] = message;
        });
        helpers.setErrors(formErrors);
      }
      show({
        type: "error",
        message: err?.response?.data?.message || "Failed to submit your request. Please try again.",
      });
    } finally {
      helpers.setSubmitting(false);
    }
  };

  const handleDownload = async (request: BusinessLetterRequestDto) => {
    try {
      setDownloadingId(request.id);
      await downloadBusinessLetterPdf(request.id, request.reference);
    } catch (err) {
      console.error("Failed to download business letter request", err);
      show({ type: "error", message: "Failed to download the PDF" });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="dash-section business-letter">
      <div className="dash-header">
        <h3>Request for Letter of Recommendation</h3>
      </div>

      <div className="bl-grid">
        <div className="bl-card">
          <h4>New request</h4>
          <Formik
            initialValues={initialValues}
            enableReinitialize
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, isSubmitting }) => (
              <Form noValidate>
                <div className="bl-group-title">Your details</div>
                <div className="bl-field">
                  <label htmlFor="bl-name" className="required">Name</label>
                  <Field id="bl-name" name="name" className="form-control" />
                  <FieldError name="name" />
                </div>
                <div className="bl-field">
                  <label htmlFor="bl-email">Email</label>
                  <input id="bl-email" className="form-control" value={user?.email ?? ""} readOnly disabled />
                </div>
                <div className="bl-row">
                  <div className="bl-field">
                    <label htmlFor="bl-phone">Phone</label>
                    <Field id="bl-phone" name="phone" className="form-control" />
                    <FieldError name="phone" />
                  </div>
                  <div className="bl-field">
                    <label htmlFor="bl-company">Company</label>
                    <Field id="bl-company" name="company" className="form-control" />
                    <FieldError name="company" />
                  </div>
                </div>

                <div className="bl-group-title">Letter</div>
                <div className="bl-field">
                  <label htmlFor="bl-type" className="required">Letter type</label>
                  <Field as="select" id="bl-type" name="letterType" className="form-select">
                    <option value="">Select a letter type…</option>
                    {LETTER_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Field>
                  <FieldError name="letterType" />
                </div>
                <div className="bl-field">
                  <label htmlFor="bl-address">Address</label>
                  <Field id="bl-address" name="addresseeAddress" className="form-control" />
                  <FieldError name="addresseeAddress" />
                </div>
                <div className="bl-field">
                  <label htmlFor="bl-purpose" className="required">Purpose</label>
                  <Field
                    as="textarea"
                    id="bl-purpose"
                    name="purpose"
                    rows={5}
                    maxLength={PURPOSE_MAX}
                    className="form-control"
                    placeholder="What is the letter for? Include any details it should mention."
                  />
                  <div className="bl-counter">{values.purpose.length}/{PURPOSE_MAX}</div>
                  <FieldError name="purpose" />
                </div>
                <div className="bl-row">
                  <div className="bl-field">
                    <label htmlFor="bl-needed" className="required">Needed by</label>
                    <Field id="bl-needed" name="neededBy" type="date" min={todayLocalISO()} className="form-control" />
                    <FieldError name="neededBy" />
                  </div>
                  <div className="bl-field">
                    <label>Language</label>
                    <div className="bl-radios" role="radiogroup">
                      <label>
                        <Field type="radio" name="language" value="en" /> English
                      </label>
                      <label>
                        <Field type="radio" name="language" value="de" /> German
                      </label>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-p bl-submit justify-content-center" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting…" : "Submit request"}
                </button>
              </Form>
            )}
          </Formik>
        </div>

        <div className="bl-card">
          <h4>My requests</h4>
          {loading ? (
            <Loader />
          ) : requests.length === 0 ? (
            <p className="bl-empty">You haven't requested any business letters yet.</p>
          ) : (
            <>
              <div className="bl-table-wrap">
                <table className="bl-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Submitted</th>
                      <th>Letter type</th>
                      <th>Needed by</th>
                      <th aria-label="Download" />
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id}>
                        <td className="bl-ref">{request.reference}</td>
                        <td>{formatDate(request.createdAt)}</td>
                        <td>{request.letterTypeLabel}</td>
                        <td>{formatDate(request.neededBy, true)}</td>
                        <td>
                          <button
                            type="button"
                            className="bl-download"
                            onClick={() => handleDownload(request)}
                            disabled={downloadingId === request.id}
                          >
                            {downloadingId === request.id ? "Downloading…" : "Download PDF"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {total > requests.length && (
                <button type="button" className="bl-download bl-more" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessLetter;
