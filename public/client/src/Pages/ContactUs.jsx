import React, { useState, useEffect } from 'react';
import ContactUsForm from '../Components/ContactUsForm/ContactUsForm';
import BackgroundContact from '../Assets/pexels-aloevera-18820840.jpg';

const ContactUs = ({ siteData }) => {
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = BackgroundContact;
    img.onload = () => setBgLoaded(true);
  }, []);

  return (
    <div
      style={{
        backgroundImage: bgLoaded ? `url(${BackgroundContact})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh', // optional, ensure div has height while loading
      }}
    >
      <ContactUsForm siteData={siteData.ContactUs} />
    </div>
  );
};

export default ContactUs;
