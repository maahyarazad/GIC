import React, { useState, useEffect } from "react";
import { loginUser, LoginModel } from "../../api/auth";
import "./Login.css";
import { setHasViewedTrue } from "@/features/authSlice";
import { useToast } from "../../providers/ToastContext";
import { login, setLoadingFalse, setLoadingTrue } from "../../features/authSlice";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import type { RootState } from "../../store";
import Button from "../../Components/Button/Button";
import { setReady } from "../../features/appSlice";
import { useSelector, useDispatch } from "react-redux";
import PasswordInput from "@/Components/PasswordInput";

const Login: React.FC = () => {
  const dispatch = useDispatch();
  const { show } = useToast();

const [searchParams] = useSearchParams();
const navigate = useNavigate();
const location = useLocation();
const _redirect = searchParams.get('redirect');
const [redirect, setRedirect] = useState(_redirect);




  const user = useSelector((state: RootState) => state.auth.user);
  const loading = useSelector((state: RootState) => state.auth.loading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");


  useEffect(() => {
    if (typeof window === "undefined") return;

    const loginContainer = document.querySelector(".login-container") as HTMLElement | null;
    if (!loginContainer) return;

    const vh = window.innerHeight;
    loginContainer.style.minHeight = `${vh - 80}px`;
  }, []);




useEffect(() => {
   
  if (user) {
    
    navigate(decodeURIComponent(redirect ?? '/dashboard'), { replace: true });
  } 
}, [user]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    dispatch(setLoadingTrue());

    try {
      const payload: LoginModel = {
        userName: email,
        userEmail: email,
        password,
        rememberMe,
      };

      const response = await loginUser(payload);

      if (response.success) {
        dispatch(setHasViewedTrue());
        dispatch(login(response.data));
        show({ type: "success", message: "Logged in successfully" });
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed");
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
            <label className="form-label fw-bold text-dark dark:text-white">Email</label>
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
            className="form-label fw-bold text-dark dark:text-white"
          />

          <div className="form-group remember-me">
            <div className="d-flex justify-content-between align-items-center">
              <label className="form-label fw-bold text-dark dark:text-white">
                <input
                  className="me-1"
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

          <Button
            type="submit"
            disabled={loading}
            className="btn btn-primary-contrast"
            loading={loading}
          >
            Login
          </Button>
        </form>

        <p className="signup-text form-label fw-bold text-dark dark:text-white">
          {/* Don’t have an account? <Link to="/register">Sign up</Link> */}
        </p>
      </div>
    </div>
  );
};

export default Login;