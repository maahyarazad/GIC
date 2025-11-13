import React, { useRef, useState, useEffect } from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import CustomInput from "../CustomInputs/CustomInput";
import CustomTextarea from "../CustomInputs/CustomTextArea";
import './ContactUsForm.css';
import { Paperclip } from 'lucide-react';
import { toast } from 'react-toastify';
import { IoMdClose } from "react-icons/io";
const server_endpoint = import.meta.env.VITE_SERVER_API_URL;
const ContactForm = ({ siteData, sectionId }) => {


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

            toast.success(response.data.message);
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

            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="container py-5 request-form-section" id={sectionId}>

            <div className="row">
                <div className="col-12 col-md-6 p-lg-4 p-2">

                    <h2 className="h3 fw-bold mb-2 lets-start">{siteData.h2}</h2>
                    <p className="fw-semibold mb-3">{siteData.p}</p>
                    <ul className="mb-4 ps-3 list-unstyled">
                        {siteData.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                        ))}
                        
                    </ul>

                    <p className="mb-4">
                        {siteData.questionText}
                        <a href="mailto:hallo@palm-x.com" className="ms-1 text-decoration-underline text-primary">
                            hallo@palm-x.com
                        </a>
                    </p>
                </div>
                <div className="col-12 col-md-6 p-2">

                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ setFieldValue, isSubmitting }) => (
                            <Form className="mb-5">
                                <CustomInput name="name" type="text" label={siteData.form.nameLabel} placeholder="John Smith" />

                                <CustomInput name="email" type="email" label={siteData.form.emailLabel} placeholder="name@company.com" />

                                <CustomTextarea name="message" rows={3} label={siteData.form.messageLabel} placeholder="Describe your idea" />

                                <div className="d-flex justify-content-between mb-3">
                                    {/* <label htmlFor="attachment" className="form-label">Attach Files</label> */}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        id="attachment"
                                        name="attachment"
                                        className="d-none"
                                        accept=".pdf, .doc, .docx, .xls, .xlsx, .csv, .ppt, .pptx, .md, .txt, .odt, .ods, .odp, .rtf"

                                        onChange={(e) => handleFileChange(e, setFieldValue)}
                                    />


                                    <div onClick={triggerFileInput}
                                        className="attachment-button">
                                        <Paperclip size={18} />
                                         {siteData.form.attachFile}

                                    </div>


                                    <ErrorMessage name="attachment" component="span" className="text-danger d-block mt-1" />

                                    <button type="submit" className="btn btn-primary-contrast" style={{ backgroundColor: 'var(--primary-color)' }} disabled={isSubmitting}>
                                        {isSubmitting ? "Sending..." : siteData.sendYourRequest}
                                    </button>
                                </div>

                                <div className="d-flex justify-content-between" style={{ minHeight: '40px' }}>
                                    {attachedFileName && (
                                        <div className="attached-file-name text-white d-flex align-items-center" style={{ marginTop: "0.5em" }}>
                                            <span>
                                               <strong> Selected File: {attachedFileName}</strong>
                                            </span>
                                            
                                            <button
                                                type="button"
                                                className="btn btn-sm text-white"
                                                style={{ minHeight: '28px' }}
                                                onClick={() => {
                                                    setAttachedFileName("");
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = "";
                                                    }
                                                    setFieldValue("attachment", null);
                                                }}
                                            >
                                                <IoMdClose size={20} />
                                            </button>

                                        </div>
                                    )}


                                </div>

                                <p className="form-text mt-3">
                                     {siteData.privacy}
                                    {/* <a
                                        onClick={()=> console.log()}
                                        href=""
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-decoration-underline">
                                        
                                    </a>. */}
                                </p>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>

        </section>
    );
};

export default ContactForm;
