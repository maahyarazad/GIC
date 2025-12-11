import { BrowserRouter } from 'react-router-dom';
import React, { useState, useEffect, useCallback , useContext} from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

import Home from './Home';
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

import Navbar from './Components/Navbar/Navbar';
import Footer from './Components/Footer/Footer';
import BackToTop from './Components/BackToTop/BackToTop';
import MainLoader from './Components/MainLoader';
import axiosInstance from './api/axiosInstance';

import { Routes, Route, useLocation } from 'react-router-dom';
import {useScrollRestoration} from './Components/useScrollRestoration';
import './App.css';
import { EnvContext } from './EnvContext';
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
    const [siteData, setSiteData] = useState(null);
    const [language, setLanguage] = useState('EN');
    const [sessionId, setSessionId] = useState(null);

        const env = useContext(EnvContext);
    
    const server_endpoint = env.VITE_SERVER_API_URL;
    console.log(server_endpoint);
    const fetchSiteData = useCallback(async () => {
        try {
            const response = await axiosInstance.get(`${server_endpoint}/client`);
            setSiteData(response.data.data);
        } catch (error) {
            console.error('Error fetching footer data:', error);
        }
    }, [server_endpoint, language]);

    useEffect(() => {
        fetchSiteData();
    }, [fetchSiteData]);

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
        return <MainLoader />;
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
                    <Route path="/boardroom" element={<Boardroom/>} />
                    <Route path="/forgot-password" element={<ForgotPassword/>} />
                    <Route path="/reset-password" element={<ResetPassword/>} />
                    <Route path="*" element={<NotFound />} />
                </Routes>

                <Footer footerData={siteData.footer} />
                <BackToTop />
            </AppContainer>
        </BrowserRouter>
    );
};

export default App;
