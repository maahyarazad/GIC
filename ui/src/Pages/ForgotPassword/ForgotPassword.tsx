import { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import Button from "../../Components/Button/Button"; 

export default function ForgotPassword() {
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
          Remembered your password? <a href="/login">Go back to login</a>
        </p>

      </div>
    </div>
  );
}
