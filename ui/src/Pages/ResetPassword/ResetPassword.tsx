import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import Button from "../../Components/Button/Button";
import MainLoader from "../../Components/MainLoader";
import PasswordInput from "@/Components/PasswordInput";
import "./ResetPassword.css";

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");
    

    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [invalidToken, setInvalidToken] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [form, setForm] = useState({
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const verify = useCallback(async () => {
        
        if (!token) {
            debugger;
            setError("Invalid reset link.");
            setInvalidToken(true);
            setChecking(false);
            return;
        }

        try {
            setChecking(true);
            setError(null);
            const result = await axiosInstance.get("/auth/verify-reset-token", {
                params: { token },
            });

            if (result?.data?.success) {
                setInvalidToken(false);
            } else {
                setInvalidToken(true);
                setError("This password reset link is invalid or expired.");
            }
        } catch (err: any) {
            console.error(err);
            setInvalidToken(true);
            setError(
                err?.response?.data?.message ||
                "This password reset link is invalid or expired."
            );
        } finally {
            setChecking(false);
        }
    }, [token]);

    useEffect(() => {
        verify();
    }, [verify]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
debugger;
        if (!token) {
            setError("Invalid reset link.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

        if (!strongPasswordRegex.test(form.password)) {
            setError(
                "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
            );
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await axiosInstance.post("/auth/reset-password", {
                token,
                newPassword: form.password,
            });

            if (res?.data?.success) {
                setSuccess("Your password has been reset successfully.");
                setTimeout(() => navigate("/login"), 2000);
            }
        } catch (err: any) {
            console.error(err);
            setError(
                err?.response?.data?.message ||
                "Failed to reset password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return <MainLoader />;
    }

    if (invalidToken) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="form-group">
                        <h2 className="text-black">Reset Password</h2>
                        {error && <div className="login-error">{error}</div>}
                        <a className="mt-3 d-block" href="/forgot-password">
                            Request a new reset link
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Reset Password</h2>
                <div className={`login-error ${error ? "" : "d-none"}`}>{error}</div>
                {success && <div className="login-success">{success}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <PasswordInput
                        label="Password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                    />

                    <PasswordInput
                        label="Confirm Password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        required
                    />

                    <Button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary-contrast"
                        loading={loading}
                    >
                        Reset Password
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;