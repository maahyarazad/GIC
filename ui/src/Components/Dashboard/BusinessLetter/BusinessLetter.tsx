import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import "./BusinessLetter.css";
import type { RootState } from "../../../store";
import type {
  BusinessLetterLanguage,
  BusinessLetterRequestDto,
  CreateBusinessLetterRequest,
} from "../../../../../src/types/businessLetter.types";
import {
  createBusinessLetterRequest,
  downloadBusinessLetterPdf,
  listBusinessLetterRequests,
} from "@/api/businessLetter";
import { useToast } from "@/Providers/ToastContext";
import Loader from "@/Components/Loader/Loader";
import CountryCitySelect from "./CountryCitySelect";

const PURPOSE_MAX = 2000;
const PAGE_SIZE = 20;

interface FormValues {
  name: string;
  phone: string;
  company: string;
  title: string;
  fullName: string;
  attn: string;
  city: string;
  country: string;
  address: string;
  reference: string;
  purpose: string;
  neededBy: string;
  language: BusinessLetterLanguage;
}

// Server field paths → form field names, for mapping 400 validation details.
const SERVER_FIELD_MAP: Record<string, keyof FormValues> = {
  "requester.name": "name",
  "requester.phone": "phone",
  "requester.company": "company",
  "addressee.title": "title",
  "addressee.fullName": "fullName",
  "addressee.attn": "attn",
  "addressee.city": "city",
  "addressee.country": "country",
  "addressee.address": "address",
  "addressee.reference": "reference",
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
  title: Yup.string().trim().required("Title is required").max(120, "Title must be at most 120 characters"),
  fullName: Yup.string().trim().required("Full name is required").max(160, "Full name must be at most 160 characters"),
  attn: Yup.string().trim().required("Attn is required").max(160, "Attn must be at most 160 characters"),
  city: Yup.string().trim().required("City is required").max(120, "City must be at most 120 characters"),
  country: Yup.string().trim().required("Country is required").max(120, "Country must be at most 120 characters"),
  address: Yup.string().trim().required("Address is required").max(300, "Address must be at most 300 characters"),
  reference: Yup.string().trim().required("Reference is required").max(200, "Reference must be at most 200 characters"),
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
  addressee: {
    title: values.title.trim(),
    fullName: values.fullName.trim(),
    attn: values.attn.trim(),
    city: values.city.trim(),
    country: values.country.trim(),
    address: values.address.trim(),
    reference: values.reference.trim(),
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
      title: "",
      fullName: "",
      attn: "",
      city: "",
      country: "",
      address: "",
      reference: "",
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

                <div className="bl-group-title">Addressee</div>
                <div className="bl-row">
                  <div className="bl-field">
                    <label htmlFor="bl-title" className="required">Title</label>
                    <Field id="bl-title" name="title" className="form-control" placeholder="Mr. / Ms. / Dr." />
                    <FieldError name="title" />
                  </div>
                  <div className="bl-field">
                    <label htmlFor="bl-fullname" className="required">Full name</label>
                    <Field id="bl-fullname" name="fullName" className="form-control" />
                    <FieldError name="fullName" />
                  </div>
                </div>
                <div className="bl-field">
                  <label htmlFor="bl-attn" className="required">Attn</label>
                  <Field id="bl-attn" name="attn" className="form-control" placeholder="Attention of / department" />
                  <FieldError name="attn" />
                </div>
                <div className="bl-field">
                  <label htmlFor="bl-address" className="required">Address</label>
                  <Field id="bl-address" name="address" className="form-control" />
                  <FieldError name="address" />
                </div>
                <CountryCitySelect />
                <div className="bl-field">
                  <label htmlFor="bl-reference" className="required">Reference</label>
                  <Field id="bl-reference" name="reference" className="form-control" placeholder="Project Name / Tender Number or Name / Business Initiative" />
                  <FieldError name="reference" />
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
                      <th>Needed by</th>
                      <th aria-label="Download" />
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id}>
                        <td className="bl-ref">{request.reference}</td>
                        <td>{formatDate(request.createdAt)}</td>
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
