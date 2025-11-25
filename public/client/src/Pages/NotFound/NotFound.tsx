import React from "react";
import { Link } from "react-router-dom";
import "./NotFound.css";

const NotFound: React.FC = () => {
  return (
    <div className="notfound-container">
      <h1 className="notfound-title">404</h1>
      <h2 className="notfound-subtitle">Page Not Found</h2>
      <p className="notfound-message">
        Oops! The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary-contrast">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
