import React, { useState, useEffect } from "react";
import "./LockOverlay.css";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const LockOverlay: React.FC = () => {
    const userProfile = useSelector((state: any) => state.auth?.user);
    const navigate = useNavigate();

    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (!userProfile) {
            document.body.style.overflow = "hidden";
        } else {

            setClosing(true);

            const timer = setTimeout(() => {
                document.body.style.overflow = "";
            }, 800);

            return () => clearTimeout(timer);
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [userProfile]);

    return (
        <div
            className={`lock-overlay ${closing ? "hide" : ""} ${closing ? "slide-out" : ""}`}
            onClick={() => navigate("/login?redirect=/boardroom")}>
            <h1 className="s-font">Restricted Access</h1>
            <h2 className="s-font">By Invitation Only</h2>
        </div>
    );
};

export default LockOverlay;
