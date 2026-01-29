import React, { useState, useEffect } from "react";
import { loginUser, LoginModel } from "../../api/auth";
import "./Login.css";

import { useToast } from "../../providers/ToastContext";
import { login, setLoadingFalse, setLoadingTrue } from "../../features/authSlice";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { RootState } from "../../store";
import Button  from "../../Components/Button/Button";
import { setReady } from '../../features/appSlice'; 
import { useSelector, useDispatch } from "react-redux";
const Login: React.FC = () => {


  const dispatch = useDispatch();
  const { show } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useSelector((state: RootState) => state.auth.user);
  const loading = useSelector((state: RootState) => state.auth.loading);
    
    React.useEffect(()=>{
            dispatch(setReady(true));
           
    }, [dispatch])


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [error, setError] = useState("");

    useEffect(() => {
    // wait until auth check is finished
    if (loading) return;

    // user is authenticated and currently on login page
    if (user && location.pathname === "/login") {
        navigate(redirectTo || "/", { replace: true });
    }
    }, [loading, user, location.pathname, navigate, redirectTo]);


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
      };


      const response = await loginUser(payload);
      

      if (response.success) {
        dispatch(login(response.data));
        show({type: "success",message: "Logged in successfully"});
        navigate(redirectTo, { replace: true });
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

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
      <div className="forgot-password">
        <a href="/forgot-password">Forgot your password?</a>
      </div>
    <Button type="submit" disabled={loading} className="btn btn-primary-contrast" loading={loading}>
       Login
    </Button>
          
        </form>

        <p className="signup-text">
          Don’t have an account?{" "}
          <a href="/register">Sign up</a>
        </p>

      </div>
    </div>
  );
};

export default Login;
