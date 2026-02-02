import { BrowserRouter } from 'react-router-dom';
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import Home from './Pages/Home/Home';
import AboutUs from './Pages/AboutUs/AboutUs';
import Services from './Pages/Services';
import ContactUs from './Pages/ContactUs';
import Login from './Pages/Login/Login';
import ForgotPassword from './Pages/ForgotPassword/ForgotPassword';
import ResetPassword from './Pages/ResetPassword/ResetPassword';
import Boardroom from './Pages/Boardroom/Boardroom';
import Register from './Pages/Register/Register';
import Dashboard from './Pages/Dashboard/Dashboard';
import NotFound from './Pages/NotFound/NotFound';
import ProtectedRoute from './Pages/ProtectedRoutes';
import Unsubscribe from './Pages/Unsubscribe/Unsubscribe'

import Navbar from './Components/Navbar/Navbar';
import Footer from './Components/Footer/Footer';
import BackToTop from './Components/BackToTop/BackToTop';
import MainLoader from './Components/MainLoader';
import {fetchSiteData} from './api/axiosInstance';

import {useSelector, useDispatch} from 'react-redux';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useScrollRestoration } from './Components/useScrollRestoration';
import './App.css';
import { loadSiteData } from './features/appSlice';
const AppContainer = ({ children }) => {
    const location = useLocation();

    useScrollRestoration();
    useEffect(() => {
        const segments = location.pathname.split("/").filter(Boolean);
        const capitalizedSegments = segments.map(
            (segment) => segment.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
        );
        const formattedPath = capitalizedSegments.join(" | ");

        document.title = formattedPath
            ? `GIC | ${formattedPath}`
            : "GIC";
    }, [location.pathname]);

    return children;
};

const App = () => {
        const dispatch = useDispatch();
    const [language, setLanguage] = useState("EN");
    const [sessionId, setSessionId] = useState(null);
   


const siteData = useSelector((state) => state.app.siteData);


useEffect(() => {
  if (!siteData) {
    dispatch(loadSiteData('english'));
  }
}, []);
    useEffect(() => {
        let guid = localStorage.getItem('session-guid');
        if (!guid) {
            guid = uuidv4();
            localStorage.setItem('session-guid', guid);
        }
        setSessionId(guid);
    }, []);

    useEffect(() => {
        if (sessionId) {
            axios.defaults.headers.common['X-Session-ID'] = sessionId;
        }
    }, [sessionId]);

    const handleLanguageChange = (value) => {
        setLanguage(value);
    };

    if (!siteData) {
        return (
            <MainLoader />
        )
    }

    return (
        <BrowserRouter>
            <AppContainer>
                <Navbar
                    onLanguageChange={handleLanguageChange}
                    navbarLinks={siteData.navLinks}
                    siteData={siteData}
                    currentlanguage={language}
                    companyName={siteData.companyName}
                />

                <Routes>
                    <Route path="/" element={<Home siteData={siteData} />} />

                    <Route path="/services" element={<Services />} />
                    <Route path="/contact-us" element={<ContactUs siteData={siteData} />} />
                    <Route path="/about-us" element={<AboutUs siteData={siteData} />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/boardroom" element={<Boardroom siteData={siteData} />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/unsubscribe" element={<Unsubscribe />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>

                <Footer footerData={siteData.footer} />
                <BackToTop />
            </AppContainer>
        </BrowserRouter>
    );
};

export default App;
