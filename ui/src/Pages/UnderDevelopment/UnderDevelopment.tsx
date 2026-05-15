import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./UnderDevelopment.css";
import LockOverlay from "@/Components/LockOverlay/LockOverlay";


type Props = {
    withLockOverlay: Boolean
}

const UnderDevelopment: React.FC<Props> = ({withLockOverlay}) => {
  const navigate = useNavigate();
  const location = useLocation();
  

  return (
    <>

    {withLockOverlay ?     <LockOverlay/>: <></>}

    <section className="underdev-page">
      <div className="underdev-card">
        <div className="underdev-badge">Coming Soon</div>

        <h1 className="underdev-title">Under Development</h1>

        <p className="underdev-text">
          We’re currently working on this page to make it better, faster, and
          more useful for you.
        </p>

        <p className="underdev-subtext">
          Please check back soon.
        </p>

        <div className="underdev-actions">
          {/* <button
            className="underdev-btn primary"
            onClick={() => navigate(-1)} // go back
          >
            Go Back
          </button> */}

          <button
            className="underdev-btn secondary"
            onClick={() => navigate("/")} // go home
          >
            Go Home
          </button>
        </div>
      </div>
    </section>
    </>
  );
};

export default UnderDevelopment;