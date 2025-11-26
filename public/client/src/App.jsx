
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Home from './Home';
import About from './Pages/About';
import { v4 as uuidv4 } from 'uuid';

import BackToTop from './Components/BackToTop/BackToTop';
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Services from './Pages/Services';
import Footer from './Components/Footer/Footer';

import './App.css';
import ContactUs from './Pages/ContactUs';
import MainLoader from './Components/MainLoader';
import Layout from './Components/Layout/Layout';
import axiosInstance from './api/axiosInstance'
import ProtectedRoute from './Pages/ProtectedRoutes';
import Login from './Pages/Login/Login';
import {Dashboard} from './Pages/Dashboard/Dashboard'
import Register from './Pages/Register/Register';
import NotFound from './Pages/NotFound/NotFound'
import Navbar from './Components/Navbar/Navbar';

const App = () => {
    const [siteData, setSiteData] = useState(null);
    const [language, setLanguage] = useState('EN');
    const [sessionId, setSessionId] = useState(null);


    
    const server_endpoint = import.meta.env.VITE_SERVER_API_URL;

    // ✅ useCallback to memoize the function (stable reference)
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


    useEffect(() => {
        document.title = "GIC";
    }, []);


    const handleLanguageChange = (value) => {
       setLanguage(value);
    }



    function TitleManager() {
const location = useLocation();

  useEffect(() => {
    const segments = location.pathname.split("/").filter(Boolean); // remove empty strings
    const capitalizedSegments = segments.map(
      (segment) => segment.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
    );
    const formattedPath = capitalizedSegments.join(" | ");

    document.title = formattedPath
      ? `GIC | ${formattedPath}`
      : "GIC";
  }, [location.pathname]);

  return null;
}

    if (!siteData) {
        return <MainLoader/>;
    }


    return (
        <BrowserRouter>
            <Navbar onLanguageChange={handleLanguageChange} 
                            navbarLinks={siteData.navLinks}
                            siteData={siteData.getStarted}
                            currentlanguage={language} 
                            companyName={siteData.companyName}/>
            
            <Routes>
                <Route path="/" element={<Home siteData={siteData} />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                           
                <Route path="/contact-us" element={ <ContactUs siteData={siteData}/>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer footerData={siteData.footer} />
            <BackToTop />
            
        </BrowserRouter>
    );

};

export default App;