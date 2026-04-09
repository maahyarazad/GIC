import React, { useRef, useState, useContext } from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import CustomInput from "../CustomInputs/CustomInput";
import CustomTextarea from "../CustomInputs/CustomTextArea";
import './ContactUsForm.css';
import { Paperclip } from 'lucide-react';
import { useToast } from '../Providers/ToastContext';
import { IoMdClose } from "react-icons/io";
import { EnvContext } from "../../EnvContext";

const ContactForm = ({ siteData, sectionId }) => {

    const env = useContext(EnvContext);
    const server_endpoint = env.VITE_SERVER_API_URL;
    const { show } = useToast();
    const fileInputRef = useRef(null);
    const [attachedFileName, setAttachedFileName] = useState("");
    const initialValues = {
        name: "",
        email: "",
        message: "",
        attachment: null,
    };

    const validationSchema = Yup.object({
        name: Yup.string().required("Name is required"),
        email: Yup.string().email("Invalid email address").required("Email is required"),
        message: Yup.string().required("Message is required"),
        // attachment: Yup.mixed(), // add validation if needed
    });

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event, setFieldValue) => {
        const file = event.currentTarget.files[0];


        if (file) {
            setFieldValue("attachment", file);
            setAttachedFileName(file.name);
        } else {
            setAttachedFileName("");
        }
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        const form = new FormData();
        form.append("name", values.name);
        form.append("email", values.email);
        form.append("message", values.message);
        if (values.attachment) {
            form.append("attachment", values.attachment);
        }

        try {


            const response = await axios.post(`${server_endpoint}/api/contact-us`, form, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            show({ type: "success", message: response.data.message });
            setAttachedFileName("");;
            resetForm();
        } catch (error) {
            console.error("Submission error:", error);

            // Safe access for backend-defined error
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
        <div id="page-contact" className={`page ${activePage === "home" ? "active" : ""}`}>
            <div className="co-wrap">
                <div className="co-left">
                    <div>
                        <div className="slbl">Get in Touch</div>
                        <h1 className="co-title">
                            Request<br />
                            <em>Access.</em>
                        </h1>
                    </div>
                    <p className="co-body">
                        Membership is by invitation and application only. We assess each request individually &mdash; based on industry relevance, seniority, and alignment with the Club's strategic mandate.
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
                                Building C1, Office 1208<br />
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
                            <div className="co-cm">C-Suite executives of DACH industrial companies with active or planned MEA operations</div>
                            <div className="co-cm">DACH family business principals with MEA strategic focus</div>
                            <div className="co-cm">Professional investors with a MEA infrastructure or industrial mandate</div>
                            <div className="co-cm">Brand owners seeking to correct MEA market share deficits</div>
                            <div className="co-cm">Individuals referred by existing Club members in good standing</div>
                        </div>
                    </div>
                </div>

                <div className="co-right">
                    <div className="slbl" style={{ marginBottom: "32px" }}>Membership Application</div>
                    <div className="co-form">
                        <div className="frow">
                            <div className="fg">
                                <label className="fl">
                                    Full Name <span>*</span>
                                </label>
                                <input className="fi" type="text" placeholder="Dr. Max Mustermann" />
                            </div>
                            <div className="fg">
                                <label className="fl">Company</label>
                                <input className="fi" type="text" placeholder="Mustermann GmbH" />
                            </div>
                        </div>

                        <div className="frow">
                            <div className="fg">
                                <label className="fl">
                                    Email <span>*</span>
                                </label>
                                <input className="fi" type="email" placeholder="m.mustermann@company.com" />
                            </div>
                            <div className="fg">
                                <label className="fl">Phone</label>
                                <input className="fi" type="tel" placeholder="+49 / +971" />
                            </div>
                        </div>

                        <div className="fg">
                            <label className="fl">
                                Industry / Sector <span>*</span>
                            </label>
                            <input className="fi" type="text" placeholder="e.g. Manufacturing, Energy, Logistics" />
                        </div>

                        <div className="fg">
                            <label className="fl">Country of Primary MEA Interest</label>
                            <input className="fi" type="text" placeholder="e.g. UAE, Saudi Arabia, Egypt, Nigeria" />
                        </div>

                        <div className="fg">
                            <label className="fl">
                                Your MEA Objective <span>*</span>
                            </label>
                            <textarea
                                className="fta"
                                placeholder="Briefly describe your strategic interest in the MEA region and what you hope to achieve through Club membership"
                            ></textarea>
                        </div>

                        <div className="fg">
                            <label className="fl">Referred by (if applicable)</label>
                            <input className="fi" type="text" placeholder="Name of referring Club member" />
                        </div>

                        <div>
                            <button className="fsub">Submit Application &rarr;</button>
                        </div>

                        <p className="fnote">
                            By submitting, you consent to the collection of your details for membership evaluation. All enquiries are treated with strict confidentiality.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactForm;
