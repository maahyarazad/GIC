import React, { useState, useEffect } from 'react';
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
import Unsubscribe from './Pages/Unsubscribe/Unsubscribe';
import UnderDevelopment from './Pages/UnderDevelopment/UnderDevelopment';
import WhatWeDo from './Pages/WhatWeDo/WhatWeDo';
import Membership from './Pages/Membership/Membership';
import Navbar from './Components/Navbar/Navbar';
import Footer from './Components/Footer/Footer';
import BackToTop from './Components/BackToTop/BackToTop';
import MainLoader from './Components/MainLoader';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useScrollRestoration } from './Components/useScrollRestoration';
import './App.css';
import { loadSiteData, setReady } from './features/appSlice';

const AppContainer = ({ children }) => {
  const location = useLocation();

  useScrollRestoration();

  useEffect(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const capitalizedSegments = segments.map((segment) =>
      segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    );
    const formattedPath = capitalizedSegments.join(' | ');
    document.title = formattedPath ? `GIC | ${formattedPath}` : 'GIC';
  }, [location.pathname]);

  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const [language, setLanguage] = useState('EN');
  const [sessionId, setSessionId] = useState(null);

  const siteData = useSelector((state) => state.app.siteData);
    const isReady = useSelector((state) => state.app.isReady);



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


  useEffect(()=>{
      dispatch(setReady(true))
      
  }, [])

  
  if (!isReady) {
      return <MainLoader />;
    }
  return (
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
        <Route path="/about-us" element={<AboutUs siteData={siteData} />} />
        <Route path="/what-we-do" element={<WhatWeDo />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/boardroom" element={<Boardroom siteData={siteData} />} />
        <Route path="/contact" element={<ContactUs siteData={siteData} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer siteData={siteData} />
    </AppContainer>
  );
};

export default App;