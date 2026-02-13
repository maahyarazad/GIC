import React, { useState, useEffect } from 'react';
import PadLock from '../../Assets/padlock-svgrepo-com.svg';
import './LockOverlay.css';
import { useNavigate } from 'react-router-dom';
const LockOverlay: React.FC = () => {

    const [clicked, setClicked] = useState<boolean>(false);
const navigate = useNavigate();
    useEffect(() => {
        if (!clicked) {
            document.body.style.overflow = "hidden";
        } else {
            navigate("/login");
        }


        return () => {
            document.body.style.overflow = "";
        };
    }, [clicked]);

    return (
        <div className={`lock-overlay ${clicked ? "hide" : ""}`} onClick={() => setClicked(true)}>
            <div className='mb-4 '>

                <h1 className='s-font mb-4 contrast-color logo'>
                   
                </h1>
            </div>

            {/* <img className="padlock-icon mb-4" src={PadLock} /> */}
            <i className="padlock-icon mb-4 bi bi-shield-lock-fill"></i>
            <h1 className='s-font'>
                Restricted Access
            </h1>
            <h2 className='s-font'>

                By Invitation Only</h2>
        </div>
    )
}


export default LockOverlay