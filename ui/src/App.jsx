import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import Home from './Pages/Home/Home';
import AboutUs from './Pages/AboutUs/AboutUs';
import ContactUs from './Pages/ContactUs';
import Login from './Pages/Login/Login';
import ForgotPassword from './Pages/ForgotPassword/ForgotPassword';
import ResetPassword from './Pages/ResetPassword/ResetPassword';
import Boardroom from './Pages/Boardroom/Boardroom';
import Dashboard from './Pages/Dashboard/Dashboard';
import NotFound from './Pages/NotFound/NotFound';
import ProtectedRoute from './Pages/ProtectedRoutes';
import Unsubscribe from './Pages/Unsubscribe/Unsubscribe';
import WhatWeDo from './Pages/WhatWeDo/WhatWeDo';
import Membership from './Pages/Membership/Membership';
import BlogPosts from './Pages/Blog/BlogPosts';
import BlogDetail from './Pages/Blog/BlogDetail';
import Navbar from './Components/Navbar/Navbar';
import Footer from './Components/Footer/Footer';
import MainLoader from './Components/MainLoader';

import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useScrollRestoration } from './Components/useScrollRestoration';
import './App.css';
import { usePage } from '@/Providers/PageContext';

const AppContainer = ({ children }) => {
    const location = useLocation();

    useScrollRestoration();

    useEffect(() => {
        const segments = location.pathname.split('/').filter(Boolean);
        const capitalizedSegments = segments.map((segment) =>
            segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
        );
        const formattedPath = capitalizedSegments.join(' | ');
        document.title = formattedPath ? `German Industry Club | ${formattedPath}` : 'German Industry Club';
    }, [location.pathname]);

    return children;
};

const App = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [language, setLanguage] = useState('EN');
const {showPage} = usePage();

    const [sessionId, setSessionId] = useState(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
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

    useEffect(() => {
        if(location.pathname){
            
            showPage(location.pathname);
        }

    }, [location.pathname]);

    if (!isMounted) return null;

    return (
        <AppContainer>

            <Navbar
                onLanguageChange={handleLanguageChange}
                currentlanguage={language}
            />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/what-we-do" element={<WhatWeDo />} />
                <Route path="/membership" element={<Membership />} />
                <Route path="/boardroom" element={<Boardroom />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/blog" element={<ProtectedRoute><BlogPosts /></ProtectedRoute>} />
                <Route path="/blog/:slug" element={<ProtectedRoute><BlogDetail /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
        </AppContainer>
    );
};

export default App;