
import { useField } from "formik";


const CustomTextarea = ({ label, ...props }) => {
    const [field, meta] = useField(props);
    const hasError = meta.touched && meta.error;

    return (
        <div className="row mb-3">

            <div className="col-12 col-md-2 d-flex justify-content-md-start align-items-top mb-2 mb-md-0">
                <label htmlFor={props.id || props.name} className="form-label mb-0 text-md-start text-nowrap">
                    {label}
                </label>
            </div>


            <div className="col-12 col-md-10 position-relative">
                <textarea

                    className={`form-control${hasError ? " is-invalid" : ""}`}
                    {...field}
                    {...props}
                />
                {/* Reserved space for error */}
                <div style={{ minHeight: '1.5em' }}>
                    {hasError && (
                        <span className="text-danger small">{meta.error}</span>
                    )}
                </div>
            </div>
        </div>

    );
};

export default CustomTextarea