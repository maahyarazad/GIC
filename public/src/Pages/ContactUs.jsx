import React, { useState, useEffect } from 'react';
import ContactUsForm from '../Components/ContactUsForm/ContactUsForm';
import { useContext } from 'react';
import { EnvContext } from '../EnvContext';


const ContactUs = ({ siteData }) => {
  const env = useContext(EnvContext)
  // const [bgLoaded, setBgLoaded] = useState(false);

  // useEffect(() => {
  //   const img = new Image();
  //   img.src = BackgroundContact;
  //   img.onload = () => setBgLoaded(true);
  // }, []);

  return (
    <div
      style={{
        backgroundImage: `url(${env.VITE_SERVER_API_URL}/uploads/${siteData.media.contact_us_background})`,
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
