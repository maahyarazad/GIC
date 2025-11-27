import React, { useState, useEffect } from "react";
import { loginUser, LoginModel } from "../../api/auth";
import "./Boardroom.css";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../../providers/ToastContext";
import { login, setLoadingFalse, setLoadingTrue } from "../../features/authSlice";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { RootState } from "../../store";
import Button  from "../../Components/Button/Button";
import LockOverlay from '../../Components/LockOverlay/LockOverlay'
import './Boardroom.css'
const Boardroom: React.FC = () => {



  const dispatch = useDispatch();
  const { show } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useSelector((state: RootState) => state.auth.user);
  const loading = useSelector((state: RootState) => state.auth.loading);



  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      
    }
  }, [loading, user, location.pathname]);




  return (
    <div className="boardroom">
        <LockOverlay/>
    <div className="login-container">

      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>

        

       

        <p className="signup-text">
          Don’t have an account?{" "}
          <a href="/register">Sign up</a>
        </p>

      </div>
    </div>
    </div>
  );
};

export default Boardroom;
