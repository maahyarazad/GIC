import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";

import HtmlCodeEditor from "../HtmlEditor/HtmlEditor";

interface TemplateFormProps {
  id?: string;
  templateName: string;
  setTemplateName: (value: string) => void;
  subject: string;
  setSubject: (value: string) => void;
  html: string;
  setHtml: (value: string) => void;
  handleSaveTemplate: (e: React.FormEvent<HTMLFormElement>) => void;
}

// Add a type for the imperative handle, with a submitForm method
export interface TemplateFormRef {
  submitForm: () => void;
}

const TemplateForm = forwardRef<TemplateFormRef, TemplateFormProps>(({
  id,
  templateName,
  setTemplateName,
  subject,
  setSubject,
  html,
  setHtml,
  handleSaveTemplate,
}, ref) => {
  const formRef = useRef<HTMLFormElement>(null);

  // Expose submitForm() method to parent via ref
  useImperativeHandle(ref, () => ({
    submitForm: () => {
        debugger;
      // This triggers the native form submit event and calls handleSaveTemplate
      formRef.current?.requestSubmit();
    }
  }));

  return (
    <form
      ref={formRef}
      onSubmit={handleSaveTemplate}
      className="d-flex flex-column gap-3"
    >
      <button
        type="submit"
        className="btn dashboard-btn align-self-start"
        disabled={!templateName || !subject || !html}
      >
        Save
      </button>

      <div className="d-flex justify-content-between">
        <div className="d-flex">
          <div>
            <input type="hidden" value={id ?? ""} />
            <label className="form-label fw-bold">Template Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. otp_verification"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginLeft: "1rem" }}>
            <label className="form-label fw-bold">Subject *</label>
            <input
              type="text"
              className="form-control"
              placeholder="{{EVENT_NAME}}"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="form-label fw-bold">HTML Content *</label>
        <HtmlCodeEditor value={html} onChange={setHtml} />
      </div>
    </form>
  );
});

export default TemplateForm;
