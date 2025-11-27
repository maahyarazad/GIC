import React, { useState, useEffect } from 'react';
import ContactUsForm from '../Components/ContactUsForm/ContactUsForm';


const ContactUs = ({ siteData }) => {
  // const [bgLoaded, setBgLoaded] = useState(false);

  // useEffect(() => {
  //   const img = new Image();
  //   img.src = BackgroundContact;
  //   img.onload = () => setBgLoaded(true);
  // }, []);

  return (
    <div
      style={{
        backgroundImage: `url(${import.meta.env.VITE_SERVER_API_URL}/file_storage/${siteData.media.contact_us_background})`,
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
