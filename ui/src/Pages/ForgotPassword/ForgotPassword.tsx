import { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import Button from "../../Components/Button/Button"; 
import { setReady } from '../../features/appSlice'; 
import {  useDispatch } from "react-redux";
import { Link } from "react-router-dom";
export default function ForgotPassword() {



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



  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
       const _email = {email: email.trim().toLowerCase()};
       
       
       const response = await axiosInstance.post("/auth/forgot-password", _email);

      setSuccess(
        response.data?.message || "If this email exists, a reset link was sent."
      );
    } catch (err: any) {
      setError(
        err.message || "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        <h2 className="login-title">Reset Password</h2>

        {error && <div className="login-error">{error}</div>}
        {success && <div className="login-success">{success}</div>}

        <form onSubmit={handleSubmit} className="login-form">

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              value={email}
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            className="btn btn-primary-contrast"
          >
            Send Reset Link
          </Button>
        </form>

        <p className="signup-text">
          Remembered your password? <Link to="/login">Go back to login</Link>
        </p>

      </div>
    </div>
  );
}
