import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import Button from "../../Components/Button/Button";
import MainLoader from '../../Components/MainLoader';
import { setReady } from '../../features/appSlice'; 
import {  useDispatch } from "react-redux";
import PasswordInput from '@/Components/PasswordInput';

const ResetPassword: React.FC = () => {

    
          const dispatch = useDispatch();
        useEffect(()=>{
                dispatch(setReady(true));
               
        }, [dispatch])

    useEffect(() => {
    const login = document.querySelector(".login-container") as HTMLElement | null;
    if (!login) return;

    const vh = window.innerHeight;
    login.style.minHeight = `${vh - 80}px`;
    }, []);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [invalidToken, setInvalidToken] = useState(true);
  const [error, setError] = useState<string | null >(null);
  const [success, setSuccess] = useState<string | null >(null);

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  // -------------------------------
  // HANDLE INPUT CHANGE
  // -------------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // -----------------------------------
  // VERIFY TOKEN ON PAGE LOAD
  // -----------------------------------
  useEffect(() => {
    if (!token) {
      setError("Invalid reset link.");
      setChecking(false);
      return;
    }

    const verifyToken = async () => {
      try {
        
        const result = await axiosInstance.get("/auth/verify-reset-token", {
          params: { token },
        });

        if(result.data.success){
                setInvalidToken(false);
        }
        
        
      } catch (err: any) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            "This password reset link is invalid or expired."
        );
        
      }finally{
        setChecking(false);
      }
    };

    verifyToken();
  }, [token]);

  // -----------------------------------
  // SUBMIT NEW PASSWORD
  // -----------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
    
      setError("Passwords do not match.");
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

    setLoading(true);
    setError("");

    try {
      const res = await axiosInstance.post("/auth/reset-password", {
        token,
        newPassword: form.password,
      });
      if(res.data.success){

          setSuccess("Your password has been reset successfully.");
          setLoading(false);
    
          setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      setError(
        err?.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
    }
  };

  // -----------------------------------
  // LOADING TOKEN CHECK
  // -----------------------------------
  if (checking) {
    return <MainLoader />;
  }

  // -----------------------------------
  // INVALID TOKEN
  // -----------------------------------
  if (invalidToken) {
    return (
         <div className="login-container">
      <div className="login-card">
        <div className="form-group">
        <h2>Reset Password</h2>
        <div className="login-error">{error}</div>
        <a className="mt-3 d-block" href="/forgot-password">
          Request a new reset link
        </a>
      </div>
      </div>
    </div>
     
    );
  }

  // -----------------------------------
  // RESET PASSWORD FORM
  // -----------------------------------
  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Reset Password</h2>
             {error && <div className="login-error">{error}</div>}   
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
