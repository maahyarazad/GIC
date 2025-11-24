import React, { useState, Suspense, useRef } from "react";
import "./Register.css";
import axiosInstance from "../../api/axiosInstance";
import { useToast } from "../../providers/ToastContext";
import OtpTimer from "./../../Components/OTP/OtpTimer";
import OtpInput from "../../Components/OTP/OtpInput";


interface SendOtpBody {
    email?: string;
    mobile_number?: string;
    origin?: string;
}

interface RegisterModel {
    name: string;
    email: string;
    password: string;
}


interface OtpCheckBody {
    otp: string;
    registration_code?: string;
}


const Register: React.FC = () => {
    const { show } = useToast();
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [validOtp, setValidOtp] = useState(false);
    const otpRefEmail = useRef(null);
    const otpRefPhone = useRef(null);
    const statusRef = useRef<HTMLDivElement>(null);
    const [currentResponseStatus, setCurrentResponseStatus] = useState(null);
    const [currentResponseMessage, setCurrentResponseMessage] = useState("");

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
        setForm({ ...form, [e.target.name]: e.target.value });
    };


    const handleExpiredChange = (val) => {
        setValidOtp(false);
    };



    const sendOTP_email = async () => {

        try {
            const payload: SendOtpBody = {
                email: form.email,
                origin: "GIC"
            };

            const response = await axiosInstance.post("/otp/send-email", payload);
            if (response.status === 200) {
                setValidOtp(true);
                setCurrentResponseStatus(response.data.message);
                statusRef.current!.innerHTML = response.data.message
            }


        } catch (err: any) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }

    };


    const sendOTP_phone = async () => {

        try {
            const payload: SendOtpBody = {
                email: form.email,
                origin: "GIC"
            };

            const response = await axiosInstance.post("/otp/send-mobile", payload);
            if (response.status === 200) {
                 setCurrentResponseStatus(response.data.message);
                statusRef.current!.innerHTML = response.data.message
            }


        } catch (err: any) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }

    };

    const handlePostOTP_email = async (val) => {

        try {
            debugger;
            const payload: OtpCheckBody = {
                otp: val,

            };

            const response = await axiosInstance.post("/otp/check-email", payload);
            if (response.status === 200) {
                
                if (response.data.success) {
                    setRegistrationProcess({ currentStep: 2 });
                }

                setValidOtp(true);
                setCurrentResponseStatus(response.data.message);
                statusRef.current!.innerHTML = response.data.message
            }


        } catch (err: any) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }

    };

    const handlePostOTP_phone = async (val) => {

        try {
            const payload: OtpCheckBody = {
                otp: val,

            };

            const response = await axiosInstance.post("/otp/check-mobile", payload);
            if (response.status === 200) {
                debugger;
                setValidOtp(true);
                setCurrentResponseStatus(response.data.message);
                statusRef.current!.innerHTML = response.data.message
            }


        } catch (err: any) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }

    };
    const handleSubmit = async (e: React.FormEvent) => {



        e.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        debugger;
        switch (registrationProcess?.currentStep) {
            case 0:
                setRegistrationProcess({ currentStep: 1 });
                sendOTP_email();
                return;


            case 1:
                setRegistrationProcess({ currentStep: 2 });
                sendOTP_phone()
                return;
            case 2:
                break;




        }
        setLoading(true);

        try {
            const payload: RegisterModel = {
                name: form.name,
                email: form.email,
                password: form.password,
            };

            const response = await axiosInstance.post("/user/", payload);

            show({
                type: "success",
                message: "Account created successfully",
            });

            // redirect user after success
            window.location.href = "/login";

        } catch (err: any) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="login-container">
                <div className={`login-card ${registrationProcess?.currentStep > 0 ? "hide slide-out-left" : ""}`}>
                    <h2 className="login-title">Create an Account</h2>

                    {error && <div className="login-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                name="name"
                                type="text"
                                required
                                value={form.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                name="email"
                                type="email"
                                required
                                value={form.email}
                                onChange={handleChange}
                            />
                        </div>


                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                name="phone"
                                type="phone"
                                required
                                value={form.phone}
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

                <div className={`login-card otp-card ${registrationProcess?.currentStep === 1 ? "show slide-in-right" : "hide"}`}>
                    <h2 className="login-title">Enter OTP</h2>
                    {error && <div className="login-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="login-form">

                        <div className={`otp-slide ${showOtpInput ? "show" : ""}`}>
                            <div ref={statusRef}></div>

                            {currentResponseStatus && (
                                <>
                                    <OtpInput
                                        ref={otpRefEmail}
                                        onComplete={(val) => {
                                            handlePostOTP_email(val);
                                        }}
                                    />

                                    {validOtp && (
                                        <OtpTimer
                                            initialSeconds={300}
                                            onResend={sendOTP_email}
                                            loginResponseData={currentResponseStatus}
                                            onExpiredChange={handleExpiredChange}
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        <button type="submit" disabled={loading} className="btn btn-primary-contrast">
                            Verify OTP & Register
                        </button>
                    </form>
                </div>
                <div className={`login-card otp-card ${registrationProcess?.currentStep === 2 ? "show slide-in-right" : "hide"}`}>
                    <h2 className="login-title">Enter OTP</h2>
                    {error && <div className="login-error">{error}</div>}

                    <form onSubmit={handleSubmit} className="login-form">

                        <div className={`otp-slide ${showOtpInput ? "show" : ""}`}>
                            <div ref={statusRef}></div>

                            {currentResponseStatus && (
                                <>
                                    <OtpInput
                                        ref={otpRefPhone}
                                        onComplete={(val) => {
                                            handlePostOTP_phone(val);
                                        }}
                                    />

                                    {validOtp && (
                                        <OtpTimer
                                            onResend={sendOTP_phone}
                                            initialSeconds={300}
                                            loginResponseData={currentResponseStatus}
                                            onExpiredChange={handleExpiredChange}
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        <button type="submit" disabled={loading} className="btn btn-primary-contrast">
                            Verify OTP & Register
                        </button>
                    </form>
                </div>


            </div>



        </>

    );
};

export default Register;
