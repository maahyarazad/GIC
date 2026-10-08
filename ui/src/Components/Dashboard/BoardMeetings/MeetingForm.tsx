import React from "react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import type {
    AdminBoardMeetingDto,
    BoardMeetingInput,
} from "../../../../../src/types/boardMeeting.types";
import {
    adminCreateMeeting,
    adminUpdateMeeting,
    apiErrorMessage,
    apiFieldErrors,
} from "@/api/boardMeetings";
import type ToastOptions from "@/Providers/ToastContext";

const DESCRIPTION_MAX = 2000;
const IMAGE_URL = /^\/uploads\/[A-Za-z0-9._-]{1,128}$/;

interface FormValues {
    title: string;
    date: string;
    time: string;
    venue: string;
    location: string;
    capacity: number | "";
    imageUrl: string;
    description: string;
}

// Mirrors the server rules in boardMeetingAdmin.controller.ts.
const validationSchema = Yup.object({
    title: Yup.string().trim().required("Title is required").min(3, "Title must be at least 3 characters").max(160, "Title must be at most 160 characters"),
    date: Yup.string().required("Date is required"),
    time: Yup.string().required("Time is required").matches(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:mm (24h)"),
    venue: Yup.string().trim().required("Venue is required").min(2, "Venue must be at least 2 characters").max(160, "Venue must be at most 160 characters"),
    location: Yup.string().trim().required("Location is required").min(2, "Location must be at least 2 characters").max(300, "Location must be at most 300 characters"),
    capacity: Yup.number()
        .typeError("Capacity is required")
        .required("Capacity is required")
        .integer("Capacity must be a whole number")
        .min(1, "Capacity must be between 1 and 50")
        .max(50, "Capacity must be between 1 and 50"),
    imageUrl: Yup.string().trim().matches(IMAGE_URL, { message: "Use a File Management path like /uploads/<file>", excludeEmptyString: true }),
    description: Yup.string().trim().max(DESCRIPTION_MAX, `Description must be at most ${DESCRIPTION_MAX} characters`),
});

const toInitialValues = (meeting?: AdminBoardMeetingDto): FormValues => ({
    title: meeting?.title ?? "",
    date: meeting?.date ?? "",
    time: meeting?.time ?? "",
    venue: meeting?.venue ?? "",
    location: meeting?.location ?? "",
    capacity: meeting?.capacity ?? 10,
    imageUrl: meeting?.imageUrl ?? "",
    description: meeting?.description ?? "",
});

const toPayload = (values: FormValues): BoardMeetingInput => ({
    title: values.title.trim(),
    date: values.date,
    time: values.time,
    venue: values.venue.trim(),
    location: values.location.trim(),
    capacity: Number(values.capacity),
    imageUrl: values.imageUrl.trim() || null,
    description: values.description.trim(),
});

const FieldError = ({ name }: { name: keyof FormValues }) => (
    <ErrorMessage name={name}>{(msg) => <div className="bm-error">{msg}</div>}</ErrorMessage>
);

interface MeetingFormProps {
    meeting?: AdminBoardMeetingDto;
    onSaved: () => void;
    onCancel: () => void;
    // Passed in rather than read with useToast(): the form renders inside the modal
    // provider, which sits outside ToastProvider.
    notify: (options: ToastOptions) => void;
}

const MeetingForm: React.FC<MeetingFormProps> = ({ meeting, onSaved, onCancel, notify }) => {

    const handleSubmit = async (values: FormValues, helpers: FormikHelpers<FormValues>) => {
        try {
            const payload = toPayload(values);
            if (meeting) {
                await adminUpdateMeeting(meeting.id, payload);
                notify({ type: "success", message: "Meeting updated" });
            } else {
                await adminCreateMeeting(payload);
                notify({ type: "success", message: "Meeting created" });
            }
            onSaved();
        } catch (error) {
            const fieldErrors = apiFieldErrors(error);
            if (fieldErrors) helpers.setErrors(fieldErrors);
            notify({ type: "error", message: apiErrorMessage(error, "Failed to save the meeting") });
        } finally {
            helpers.setSubmitting(false);
        }
    };

    return (
        <Formik initialValues={toInitialValues(meeting)} validationSchema={validationSchema} onSubmit={handleSubmit}>
            {({ values, isSubmitting }) => (
                <Form className="bm-form" noValidate>
                    <div className="bm-field">
                        <label htmlFor="bm-title" className="required">Title</label>
                        <Field id="bm-title" name="title" className="form-control" />
                        <FieldError name="title" />
                    </div>

                    <div className="bm-row">
                        <div className="bm-field">
                            <label htmlFor="bm-date" className="required">Date (GST)</label>
                            <Field id="bm-date" name="date" type="date" className="form-control" />
                            <FieldError name="date" />
                        </div>
                        <div className="bm-field">
                            <label htmlFor="bm-time" className="required">Time (GST)</label>
                            <Field id="bm-time" name="time" type="time" className="form-control" />
                            <FieldError name="time" />
                        </div>
                    </div>

                    <div className="bm-row">
                        <div className="bm-field">
                            <label htmlFor="bm-venue" className="required">Venue</label>
                            <Field id="bm-venue" name="venue" className="form-control" placeholder="e.g. GIC Boardroom, Level 12" />
                            <FieldError name="venue" />
                        </div>
                        <div className="bm-field">
                            <label htmlFor="bm-capacity" className="required">Capacity</label>
                            <Field id="bm-capacity" name="capacity" type="number" min={1} max={50} className="form-control" />
                            <FieldError name="capacity" />
                        </div>
                    </div>

                    <div className="bm-field">
                        <label htmlFor="bm-location" className="required">Location</label>
                        <Field id="bm-location" name="location" className="form-control" placeholder="Address / city" />
                        <FieldError name="location" />
                    </div>

                    <div className="bm-field">
                        <label htmlFor="bm-image">Image path</label>
                        <Field id="bm-image" name="imageUrl" className="form-control" placeholder="/uploads/<file>" />
                        <div className="bm-hint">Upload in File Management, then paste the /uploads/… path.</div>
                        <FieldError name="imageUrl" />
                        {IMAGE_URL.test(values.imageUrl.trim()) && (
                            <img className="bm-image-preview" src={values.imageUrl.trim()} alt="" />
                        )}
                    </div>

                    <div className="bm-field">
                        <label htmlFor="bm-description">Description</label>
                        <Field id="bm-description" name="description" as="textarea" rows={4} className="form-control" />
                        <div className="bm-counter">{values.description.length}/{DESCRIPTION_MAX}</div>
                        <FieldError name="description" />
                    </div>

                    <div className="bm-form-actions">
                        <button type="button" className="dashboard-btn dashboard-btn--ghost-minimal" onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="dashboard-btn" disabled={isSubmitting}>
                            {isSubmitting ? "Saving…" : meeting ? "Save changes" : "Create meeting"}
                        </button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default MeetingForm;
