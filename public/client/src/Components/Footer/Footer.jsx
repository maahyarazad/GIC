import React from 'react';
import './Footer.css';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = ({ footerData }) => {
  if (!footerData) return null;

  const getSocialIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return FaFacebook;
      case 'twitter':
        return FaTwitter;
      case 'linkedin':
        return FaLinkedin;
      case 'instagram':
        return FaInstagram;
      default:
        return null;
    }
  };

  return (
    <footer className="footer">
      <div className="row">
        <div className="col">
          <div className="d-flex justify-content-lg-center justify-content-start py-4 px-0">
            <div className="d-flex flex-column align-items-start justify-content-lg-center align-items-lg-center relative">
              <a
                href="/"
                className="s-font contrast-color"
                style={{ fontSize: '5em', textDecoration: 'none', position: 'relative', left: '15vw', top: '-2vh' }}
              >
                GIC
              </a>
              <div className="footer-text">
                Building C1
                <br />
                Office 1208, Ajman FreeZone, Ajman, UAE
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12 col-lg-6 px-0">
          <div className="d-flex justify-content-lg-center justify-content-start">
            <div className="footer-input-container">
              <input type="text" placeholder="Subscribe For News" />
              <i className="arrow-icon pi pi-arrow-right text-white"></i>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6 p-lg-0 p-5 mb-4 d-flex align-items-start justify-content-center flex-column px-0">
          <div className="d-flex justify-content-lg-center justify-content-start flex-column align-items-baseline">
            {footerData.navLinks.map((link) => (
              <div key={link.label} style={{ marginBottom: '0.5rem' }}>
                <a href={link.path}>{link.label}</a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
