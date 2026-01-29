import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./NotFound.css";
import { setReady } from '../../features/appSlice';
import { useDispatch } from "react-redux";

const NotFound: React.FC = () => {





    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setReady(true));

    }, [dispatch])

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
