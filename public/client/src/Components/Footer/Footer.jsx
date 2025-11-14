import React, { useEffect } from 'react';
import './Footer.css';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import background from '../../Assets/pexels-adrien-olichon-1257089-2387532.jpg'
const Footer = ({ footerData }) => {

    useEffect(() => { }, [footerData]);

    if (!footerData) {
        return null;
    }

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
        <footer className="footer"
       

        >
                <div className='row'>

                    <div className="col">

                        <div className='d-flex justify-content-lg-center justify-content-start ps-lg-0 ps-5 py-4'>


                            <div className='d-flex flex-column align-items-start justify-content-lg-center align-items-lg-center relative'>
                                 <a href='/' className='s-font contrast-color' 
                                    style={{fontSize: '5em', textDecoration: 'none', left: '15vw', top: '-2vh'}}
                                    >GIC</a>
                                <div className='footer-text'>

                                    Building C1
                                    Office 1208,  Ajman FreeZone,  Ajman, UAE
                                </div>
                            </div>



                        </div>

                    </div>

                    


                </div>









                <div className='row'>

                    <div className="col-12 col-lg-6">

                        <div className='d-flex justify-content-lg-center justify-content-start ps-lg-0 ps-5'>


                            <div className="footer-input-container">
                                <input type="text" placeholder='Subscribe For News' />
                                <i className="arrow-icon pi pi-arrow-right text-white"></i>
                            </div>

                        </div>

                    </div>

                    <div className="col-12 col-lg-6 p-lg-0 p-5 mb-4
                    d-flex align-items-start justify-content-center flex-column">
                        <div className='d-flex justify-content-lg-center justify-content-start flex-column align-items-baseline'>

                            {footerData.navLinks.map((link) => (
                                <div key={link.label}>
                                    <a  href={link.path}>{link.label}</a>
                                </div>
                            ))}

                        </div>



                    </div>
                </div>
           
        </footer>
    );
};

export default Footer;
