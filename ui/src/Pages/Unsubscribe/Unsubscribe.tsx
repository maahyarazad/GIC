import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import Button from "../../Components/Button/Button";


interface VerifyUnsubscribeTokenResponse {
    valid: boolean;
    subscription_id: string;

}

import {  useDispatch } from "react-redux";
import { setReady } from '../../features/appSlice'; 
const Unsubscribe: React.FC = () => {




    
          const dispatch = useDispatch();
        useEffect(()=>{
                dispatch(setReady(true));
               
        }, [dispatch])

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");

    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [invalidToken, setInvalidToken] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [user, setUser] = useState<VerifyUnsubscribeTokenResponse | null>(null);



    const verifyToken = useCallback(async () => {
        try {

            const res = await axiosInstance.get("/auth/verify-unsubscribe-token", {
                params: { token },
            });

            if (res.data.success) {

                setUser(res.data.data);
                console.log(res.data.data);
                setInvalidToken(false);


            }
        } catch (err: any) {
            console.error(err);
            setError(
                err?.response?.data?.message ||
                "This unsubscribe link is invalid or expired."
            );
        } finally {
            setChecking(false);
        }
    }, [])




    useEffect(() => {
        if (!token) {
            setError("Invalid unsubscribe link.");
            setChecking(false);
            return;
        }


        verifyToken();



    }, [token]);



    const handleUnsubscribe = async (user: VerifyUnsubscribeTokenResponse) => {
        if (!user) return;
        setLoading(true);



        try {
            const res = await axiosInstance.get(`newsletter/unsubscribe/${user?.subscription_id}`);

            if (res.data.success) {
                setSuccess(res.data.message);
            }
        } catch (err: any) {
            console.error(err);
            setError(
                err?.response?.data?.message ||
                "Failed to unsubscribe. Please try again."
            );
        } finally {
            setLoading(false);
        }

    };


    useEffect(() => {
        console.log("useEffect user:", user);
        if (!user) {
            return;
        }
        handleUnsubscribe(user);
    }, [user]);

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="title">Unsubscribe</h2>

                {error && <div className="login-error">{error}</div>}
                {success && <div className="login-success">{success}</div>}
                    <Button

                        className={`${loading ? "btn btn-primary-contrast border-0" : "d-none"}`}
                        loading={loading}
                        disabled={true}

                    />
                
            </div>
        </div>
    );
};

export default Unsubscribe;
