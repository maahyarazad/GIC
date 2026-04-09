import React, { useContext, useEffect, useRef, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import './ContactUs.css'
import { EnvContext } from "../EnvContext";
import { usePage } from "../providers/PageContext";
import { useToast } from "../Providers/ToastContext";

const ContactUs = ({ siteData }) => {
  const env = useContext(EnvContext);
  const { activePage } = usePage();
  const { show } = useToast();

  const server_endpoint = env.VITE_SERVER_API_URL;
  const fileInputRef = useRef(null);
  const [attachedFileName, setAttachedFileName] = useState("");

  const initialValues = {
    fullName: "",
    company: "",
    email: "",
    phone: "",
    industry: "",
    countryOfInterest: "",
    meaObjective: "",
    referredBy: "",
    attachment: null,
  };

  const validationSchema = Yup.object({
    fullName: Yup.string().trim().required("Full Name is required"),
    email: Yup.string()
      .trim()
      .email("Invalid email address")
      .required("Email is required"),
    industry: Yup.string().trim().required("Industry / Sector is required"),
    meaObjective: Yup.string()
      .trim()
      .required("Your MEA Objective is required"),
  });

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event, setFieldValue) => {
    const file = event.currentTarget.files?.[0] || null;
    setFieldValue("attachment", file);
    setAttachedFileName(file ? file.name : "");
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const form = new FormData();

    form.append("fullName", values.fullName);
    form.append("company", values.company);
    form.append("email", values.email);
    form.append("phone", values.phone);
    form.append("industry", values.industry);
    form.append("countryOfInterest", values.countryOfInterest);
    form.append("meaObjective", values.meaObjective);
    form.append("referredBy", values.referredBy);

    if (values.attachment) {
      form.append("attachment", values.attachment);
    }

    try {
      const response = await axios.post(
        `${server_endpoint}/api/v1/contact-us`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      show({
        type: "success",
        message:
          response?.data?.message || "Application submitted successfully.",
      });

      setAttachedFileName("");
      resetForm();
    } catch (error) {
      console.error("Submission error:", error);

      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";

      show({ type: "error", message: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div
      id="page-contact"
      className={`page ${activePage === "/contact-us" ? "active" : ""}`}
    >
      <div className="co-wrap">
        <div className="co-left">
          <div>
            <div className="slbl">Get in Touch</div>
            <h1 className="co-title">
              Request
              <br />
              <em>Access.</em>
            </h1>
          </div>

          <p className="co-body">
            Membership is by invitation and application only. We assess each
            request individually &mdash; based on industry relevance, seniority,
            and alignment with the Club&apos;s strategic mandate.
          </p>

          <div className="co-dets">
            <div>
              <div className="co-dl">Email</div>
              <div className="co-dv">
                <span style={{ color: "var(--ora)" }}>info&#64;GIC.com</span>
              </div>
            </div>

            <div>
              <div className="co-dl">Headquarters</div>
              <div className="co-dv">
                Building C1, Office 1208
                <br />
                Ajman FreeZone, Ajman, UAE
              </div>
            </div>

            <div>
              <div className="co-dl">Response Time</div>
              <div className="co-dv">Within 5 business days</div>
            </div>
          </div>

          <div className="co-crit">
            <div className="co-ct">Typical Admission Profiles</div>
            <div className="co-ci">
              <div className="co-cm">
                C-Suite executives of DACH industrial companies with active or
                planned MEA operations
              </div>
              <div className="co-cm">
                DACH family business principals with MEA strategic focus
              </div>
              <div className="co-cm">
                Professional investors with a MEA infrastructure or industrial
                mandate
              </div>
              <div className="co-cm">
                Brand owners seeking to correct MEA market share deficits
              </div>
              <div className="co-cm">
                Individuals referred by existing Club members in good standing
              </div>
            </div>
          </div>
        </div>

        <div className="co-right">
          <div className="slbl" style={{ marginBottom: "32px" }}>
            Membership Application
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, setFieldValue }) => (
              <Form className="co-form" noValidate>
                <div className="co-row">
                  <div className="co-group">
                    <label className="co-label" htmlFor="fullName">
                      Full Name <span>*</span>
                    </label>
                    <Field
                      id="fullName"
                      name="fullName"
                      type="text"
                      className="co-field"
                      placeholder="Dr. Max Mustermann"
                    />
                    <ErrorMessage
                      name="fullName"
                      component="div"
                      className="co-error"
                    />
                  </div>

                  <div className="co-group">
                    <label className="co-label" htmlFor="company">
                      Company
                    </label>
                    <Field
                      id="company"
                      name="company"
                      type="text"
                      className="co-field"
                      placeholder="Mustermann GmbH"
                    />
                  </div>
                </div>

                <div className="co-row">
                  <div className="co-group">
                    <label className="co-label" htmlFor="email">
                      Email <span>*</span>
                    </label>
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      className="co-field"
                      placeholder="m.mustermann@company.com"
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="co-error"
                    />
                  </div>

                  <div className="co-group">
                    <label className="co-label" htmlFor="phone">
                      Phone
                    </label>
                    <Field
                      id="phone"
                      name="phone"
                      type="tel"
                      className="co-field"
                      placeholder="+49 / +971"
                    />
                  </div>
                </div>

                <div className="co-group">
                  <label className="co-label" htmlFor="industry">
                    Industry / Sector <span>*</span>
                  </label>
                  <Field
                    id="industry"
                    name="industry"
                    type="text"
                    className="co-field"
                    placeholder="e.g. Manufacturing, Energy, Logistics"
                  />
                  <ErrorMessage
                    name="industry"
                    component="div"
                    className="co-error"
                  />
                </div>

                <div className="co-group">
                  <label className="co-label" htmlFor="countryOfInterest">
                    Country of Primary MEA Interest
                  </label>
                  <Field
                    id="countryOfInterest"
                    name="countryOfInterest"
                    type="text"
                    className="co-field"
                    placeholder="e.g. UAE, Saudi Arabia, Egypt, Nigeria"
                  />
                </div>

                <div className="co-group">
                  <label className="co-label" htmlFor="meaObjective">
                    Your MEA Objective <span>*</span>
                  </label>
                  <Field
                    as="textarea"
                    id="meaObjective"
                    name="meaObjective"
                    className="co-textarea"
                    placeholder="Briefly describe your strategic interest in the MEA region and what you hope to achieve through Club membership"
                  />
                  <ErrorMessage
                    name="meaObjective"
                    component="div"
                    className="co-error"
                  />
                </div>

                <div className="co-group">
                  <label className="co-label" htmlFor="referredBy">
                    Referred by (if applicable)
                  </label>
                  <Field
                    id="referredBy"
                    name="referredBy"
                    type="text"
                    className="co-field"
                    placeholder="Name of referring Club member"
                  />
                </div>

                <div className="co-group">
                  <label className="co-label">Attachment</label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    onChange={(event) =>
                      handleFileChange(event, setFieldValue)
                    }
                  />

                  <button
                    type="button"
                    className="co-upload"
                    onClick={triggerFileInput}
                  >
                    <span className="co-upload__text">
                      {attachedFileName || "Choose file"}
                    </span>
                  </button>
                </div>

                <div>
                  <button
                    type="submit"
                    className="co-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application →"}
                  </button>
                </div>

                <p className="co-note">
                  By submitting, you consent to the collection of your details
                  for membership evaluation. All enquiries are treated with
                  strict confidentiality.
                </p>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;