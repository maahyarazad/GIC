import React, { useEffect, useContext } from 'react';
import ContactUsForm from '../Components/ContactUsForm/ContactUsForm';
import { EnvContext } from '../EnvContext';
import { setReady } from '../features/appSlice';
import { useDispatch } from "react-redux";

const ContactUs = ({ siteData }) => {
  const dispatch = useDispatch();
  const env = useContext(EnvContext);

  useEffect(() => {
    const img = new Image();
    const bgUrl = `${env.VITE_SERVER_API_URL}/uploads/${siteData.media.contact_us_background}`;

    img.src = bgUrl;

    img.onload = () => {
      dispatch(setReady(true));
    };

    
    img.onerror = () => {
      console.warn("Background image failed to load");
      dispatch(setReady(true)); // still unblock app if image fails
    };
  }, [dispatch, env, siteData.media.contact_us_background]);

  return (
    <div
      style={{
        backgroundImage: `url(${env.VITE_SERVER_API_URL}/uploads/${siteData.media.contact_us_background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
      }}
    >
      <ContactUsForm siteData={siteData.ContactUs} />
    </div>
  );
};

export default ContactUs;
