import React, { useState, Suspense, useRef, useContext } from "react";
import "./Register.css";
import axiosInstance from "../../api/axiosInstance";
import { useToast } from "../../providers/ToastContext";
import OtpTimer, {OtpTimerRef} from "../../Components/OTP/OtpTimer";
import OtpInput, { OtpInputRef } from "../../Components/OTP/OtpInput";
import { useNavigate } from "react-router-dom";
import { parsePhoneNumberFromString, isPossiblePhoneNumber } from "libphonenumber-js";
import Button from "../../Components/Button/Button";
import {EnvContext} from '../../EnvContext.js';


interface SendOtpBody {
    email?: string;
    mobile_number?: string;
    origin?: string;
}

interface PhoneOtpResponse {
    createdTimestamp: Date;
    destination: string;
    lastEventTimestamp: Date;
    requestId: string;
    status: string;
    validUnitlTimestamp: string;
}

interface RegisterModel {
    name: string;
    email: string;
    password: string;
    phone: string;
    authorize: boolean;
}


interface OtpCheckBody {
    otp: string;
    requestId?: string;
}


const Register: React.FC = () => {

    const env = useContext(EnvContext);
    const navigate = useNavigate();
    const { show } = useToast();
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [validOtpPhone, setValidOtpPhone] = useState(false);
    const [validOtpEmail, setValidOtpEmail] = useState(false);

    const [emailVerified, setEmailVerified] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [otpResonseData, setOtpResonseData] = useState<PhoneOtpResponse>();
    const otpRefEmail = useRef<OtpInputRef | null>(null);
    const otpRefPhone = useRef<OtpInputRef | null>(null);
    const statusRefEmail = useRef<HTMLDivElement>(null);
    const statusRefPhone = useRef<HTMLDivElement>(null);


        const timerRefEmail = useRef<OtpTimerRef>(null);
        const timerRefPhone = useRef<OtpTimerRef>(null);

        const ResetOTPTimerEmail = () => {timerRefEmail.current?.resetTimer()};
        const ResetOTPTimerPhone = () => {timerRefPhone.current?.resetTimer()};



    const [currentResponseStatusEmail, setCurrentResponseStatusEmail] = useState(null);
    const [currentResponseStatusPhone, setCurrentResponseStatusPhone] = useState(null);





    const [registrationProcess, setRegistrationProcess] = useState({ currentStep: 0 })
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;

        // Only apply for phone field
        if (name === "phone" && value && value[0] !== "+") {
            value = "+" + value;
        }

        setForm({ ...form, [name]: value });
    };



    const handleExpiredChange = () => {
        setValidOtpEmail(false);
        setValidOtpPhone(false);
    };



    const sendOTP_email = async () => {

        try {
            setLoading(true);

            const payload: SendOtpBody = {
                email: form.email,
                origin: "GIC"
            };

            const response = await axiosInstance.post("/otp/send-email", payload);
            
            if (response.status === 200) {

                setValidOtpEmail(true);
                otpRefEmail.current?.clear();
                ResetOTPTimerEmail();
            }

            setCurrentResponseStatusEmail(response.data.message);

        } catch (err: any) {

            show({ type: "error", message: err!.message })

        } finally {
            setLoading(false);
        }

    };


    const validatePhone = (value: string) => {
        setError(""); // reset error first

        if (!value) {
            setError("Phone number is required");
            return false;
        }


        const phone = parsePhoneNumberFromString(value);


        if (!phone) {
            setError("Invalid or missing country code");
            return false;
        }

        // Check if the number is valid internationally
        if (!phone.isValid()) {
            setError("Missing country code. Please start with +<country code>");
            return false;
        }


        setForm({ ...form, phone: phone.number });
        return true;
    };

    const sendOTP_phone = async () => {


        try {
            if (!validatePhone(form.phone)) return;
            setLoading(true);
            const payload: SendOtpBody = {
                mobile_number: form.phone,
                origin: "GIC"
            };

            const response = await axiosInstance.post("/otp/send-mobile", payload);
            if (response.status === 200) {

                setOtpResonseData(response.data.data)
                setValidOtpPhone(true);
                otpRefPhone.current?.clear();
                ResetOTPTimerPhone();
            }

            setCurrentResponseStatusPhone(response.data.message);

        } catch (err: any) {

            show({ type: "error", message: err!.message })
        } finally {
            setLoading(false);
        }

    };

    const handlePostOTP_email = async (val: any) => {

        try {
            setLoading(true);
            const payload: OtpCheckBody = {
                otp: val,

            };

            const response = await axiosInstance.post("/otp/check-email", payload);

            if (response.status === 200) {

                if (response.data.success) {

                    setRegistrationProcess({ currentStep: 2 });
                    setValidOtpEmail(true);
                    setEmailVerified(true);

                }

                setCurrentResponseStatusEmail(response.data.message);

            }


        } catch (err: any) {
            show({ type: "error", message: err!.message })
            // setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }

    };

    const handlePostOTP_phone = async (val: any) => {

        try {
            setLoading(true);
            const payload: OtpCheckBody = {
                otp: val,
                requestId: otpResonseData?.requestId
            };

            const response = await axiosInstance.post("/otp/check-mobile", payload);

            if (response.status === 200) {

                if (response.data.success) {

                    setValidOtpPhone(true);
                    registerUser();

                }
            }


            setCurrentResponseStatusPhone(response.data.message);

        } catch (err: any) {
            show({ type: "error", message: err!.message })

        } finally {
            setLoading(false);
        }

    };


    const registerUser = async () => {



        setLoading(true);

        try {
            const payload: RegisterModel = {
                name: form.name,
                email: form.email,
                password: form.password,
                phone: form.phone,
                authorize: false
            };

            const response = await axiosInstance.post("/users/", payload);

            show({
                type: "success",
                message: env.VITE_SERVER_ACCOUNT_REGISTER_SUCCESS,
            });


            navigate("/login");

        } catch (err: any) {
            show({ type: "error", message: err!.message })

        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // -----------------------
        // Password match check
        // -----------------------
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // -----------------------
        // Strong password validation
        // -----------------------
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

        if (!strongPasswordRegex.test(form.password)) {
            setError(
                "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
            );
            return;
        }

        // -----------------------
        // Registration steps
        // -----------------------
        switch (registrationProcess?.currentStep) {
            case 0:
                setRegistrationProcess({ currentStep: 1 });
                return;
            case 1:
                setRegistrationProcess({ currentStep: 2 });
                return;
            case 2:
                break;
        }


    };


    const isValidEmail = (email: any) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    return (
        <>
            <div className="login-container">
                <div className={`login-card ${registrationProcess?.currentStep === 0 ? "visible slide-in-right" : "hide"}`}>
                    <h2 className="login-title">Create an Account</h2>

                    {error && <div className="login-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                name="name"
                                type="text"
                                required
                                value={form.name}
                                onChange={handleChange}
                            />
                        </div>


                        <div className="form-group">
                            <label>Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                value={form.password}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                value={form.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary-contrast"
                        >
                            {(() => {
                                switch (registrationProcess?.currentStep) {
                                    case 0:
                                        return "Start Registration";
                                    case 1:
                                        return "Continue";
                                    case 2:
                                        return "Complete Registration";
                                    default:
                                        return "Register";
                                }
                            })()}
                        </button>
                    </form>

                    <p className="signup-text">
                        Already have an account? <a href="/login">Login</a>
                    </p>
                </div>

                <div className={`login-card otp-card ${registrationProcess?.currentStep === 1 ? "visible slide-in-right" : "hide"}`}>
                    <h2 className="login-title">Verify Email and Proceed</h2>
                    {error && <div className="login-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="login-form">


                        <div className="form-group">
                            <label>Email</label>
                            <input
                                disabled={emailVerified}
                                name="email"
                                type="email"
                                required
                                value={form.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className={`otp-slide ${showOtpInput ? "show" : ""}`}>
                            <div className="py-1" ref={statusRefEmail}>{currentResponseStatusEmail}</div>


                            <div className={`${currentResponseStatusEmail === null ? "d-none" : ""}`}>


                                <div className={`${emailVerified ? "d-none" : ""}`}>

                                    <OtpInput
                                        ref={otpRefEmail}
                                        onComplete={(val) => {
                                            handlePostOTP_email(val);
                                        }}
                                    />


                                    {validOtpEmail && (
                                        <OtpTimer
                                            ref={timerRefEmail}
                                            initialSeconds={300}
                                            onResend={sendOTP_email}
                                            loginResponseData={currentResponseStatusEmail}
                                            onExpiredChange={handleExpiredChange}
                                        />
                                    )}
                                </div>
                            </div>

                        </div>



                        <Button loading={loading}
                            type="button" disabled={!isValidEmail(form.email)} className="btn btn-primary-contrast" onClick={() => {

                                emailVerified
                                    ? setRegistrationProcess({ currentStep: 2 })
                                    : sendOTP_email();
                            }} >
                            {`${emailVerified ? "Next" : "Send OTP"}`}
                        </Button>

                        <button type="button" className="btn btn-primary-contrast-inverse" onClick={() => setRegistrationProcess({ currentStep: 0 })}>
                            Back
                        </button>
                    </form>
                </div>



                <div className={`login-card otp-card ${registrationProcess?.currentStep === 2 ? "visible slide-in-right" : "hide"}`}>
                    <h2 className="login-title">Verify Phone and Finish Registration</h2>
                    {error && <div className="login-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="login-form">


                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                disabled={phoneVerified}
                                name="phone"
                                placeholder="+971501234567"
                                required
                                value={form.phone}
                                onChange={handleChange}
                            />

                        </div>

                        <div className={`otp-slide ${showOtpInput ? "show" : ""}`}>
                            <div className="py-1" ref={statusRefPhone}>{currentResponseStatusPhone}</div>

                            <div className={`${currentResponseStatusPhone === null ? "d-none" : ""}`}>


                                <div className={`${phoneVerified ? "d-none" : ""}`}>

                                    <OtpInput
                                        ref={otpRefPhone}
                                        onComplete={(val) => {
                                            handlePostOTP_phone(val);
                                        }}
                                    />


                                    {validOtpPhone && (
                                        <OtpTimer
                                            ref={timerRefPhone}
                                            initialSeconds={300}
                                            onResend={sendOTP_phone}
                                            loginResponseData={currentResponseStatusPhone}
                                            onExpiredChange={handleExpiredChange}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>


                        <Button loading={loading}
                           type="button" disabled={!isValidEmail(form.email)} className="btn btn-primary-contrast" onClick={() => {

                            phoneVerified
                                ? setRegistrationProcess({ currentStep: 2 })
                                : sendOTP_phone();
                        }} >
                              {`${phoneVerified ? "Next" : "Send OTP"}`}
                        </Button>

                       
                        <button type="button" className="btn btn-primary-contrast-inverse" onClick={() => setRegistrationProcess({ currentStep: 1 })}>
                            Back
                        </button>
                    </form>
                </div>


            </div>



        </>

    );
};

export default Register;
