import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useDispatch } from 'react-redux';
import {logout } from '../../features/authSlice';

export default function LogoutComponent() {


    const navigate = useNavigate();
    const dispatch = useDispatch();
    const handleLogout = useCallback(async () => {
        try {
            await axiosInstance.post("/auth/logout");

            dispatch(logout());

            navigate("/login");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    }, [navigate]);

    useEffect(() => {
        handleLogout(); // call once on mount
    }, [handleLogout]);

    return <p>Logging out...</p>;
}
