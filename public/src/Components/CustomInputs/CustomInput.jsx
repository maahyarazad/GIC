
import { useField } from "formik";

const CustomInput = ({ label, ...props }) => {
    const [field, meta] = useField(props);
    const hasError = meta.touched && meta.error;

    return (
        <div className="row align-items-center mb-3">

            <div className="col-12 col-md-2 d-flex justify-content-md-start mb-2 mb-md-0">
                <label htmlFor={props.id || props.name} className="form-label mb-0 text-md-end text-nowrap">
                    {label}
                </label>
            </div>


            <div className="col-12 col-md-10 position-relative">
                <input
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

export default CustomInput
