import React, { useState, useEffect, } from "react";
import { loginUser, LoginModel, refreshToken } from "../../api/auth";
import "./Login.css";
import { setHasViewedTrue } from "@/features/authSlice";
import { useToast } from "../../providers/ToastContext";
import { login, setLoadingFalse, setLoadingTrue } from "../../features/authSlice";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import type { RootState } from "../../store";
import Button from "../../Components/Button/Button";
import { setReady } from '../../features/appSlice';
import { useSelector, useDispatch } from "react-redux";
import PasswordInput from '@/Components/PasswordInput';

const Login: React.FC = () => {


    const dispatch = useDispatch();
    const { show } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const user = useSelector((state: RootState) => state.auth.user);
    const loading = useSelector((state: RootState) => state.auth.loading);

    React.useEffect(() => {
        dispatch(setReady(true));

    }, [dispatch])

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    
    const [error, setError] = useState("");

    useEffect(() => {
        
        if (!user) return;
        

         const redirectTo = searchParams.get("redirect") || '/dashboard';
        if (redirectTo) {
            navigate(`${redirectTo}`);
        }
    }, [user]);


    useEffect(() => {
        const login = document.querySelector(".login-container") as HTMLElement | null;
        if (!login) return;

        const vh = window.innerHeight;
        login.style.minHeight = `${vh - 80}px`;
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();
        setError("");
        dispatch(setLoadingTrue());
        try {
            const payload: LoginModel = {
                userName: email,
                userEmail: email,
                password: password,
                rememberMe:rememberMe
            };


            const response = await loginUser(payload);


            if (response.success) {
                const redirectTo = searchParams.get("redirect") || '/dashboard';
                        dispatch(setHasViewedTrue());
                dispatch(login(response.data));
                show({ type: "success", message: "Logged in successfully" });
                navigate(`${redirectTo}`);
            }
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            dispatch(setLoadingFalse());
        }
    };

    return (
        <div className="login-container">

            <div className="login-card">

                <h2 className="login-title">Welcome Back</h2>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type={email === "admin" ? "text" : "email"}
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>



                    <PasswordInput
                        label="Password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />


                    <div className="form-group remember-me">
                        <div className=" d-flex justify-content-between align-items-center">

                        <label>
                            <input className="me-1"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            Remember Me
                        </label>
                        <div className="forgot-password">
                            <Link to="/forgot-password">Forgot your password?</Link>
                        </div>
                        </div>
                    </div>


                    <Button type="submit" disabled={loading} className="btn btn-primary-contrast" loading={loading}>
                        Login
                    </Button>

                </form>

                <p className="signup-text">
                    Don’t have an account?{" "}
                    <Link to="/register">Sign up</Link>
                </p>

            </div>
        </div>
    );
};

export default Login;
