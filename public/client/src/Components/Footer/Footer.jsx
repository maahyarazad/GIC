import React, { useState, useRef } from 'react';
import './Footer.css';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { FaArrowRight } from "react-icons/fa";
import { toast } from 'react-toastify';

const Footer = ({ footerData }) => {
    if (!footerData) return null;
    const [email, setEmail] = useState('');
    const inputRef = useRef(null);
    const validationMessageRef = useRef(null);


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

    const handleSubmit = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {


            inputRef.current.classList.add('invalid');
            validationMessageRef.current.innerHTML = 'Invalid Emial'
            return;
        }

         inputRef.current.classList.remove('invalid');
        validationMessageRef.current.innerHTML = '';
        inputRef.current.value = '';
        setEmail('');
        toast.success("You're now subscribed to our newsletter! You can unsubscribe anytime using the link at the bottom of our emails.");
        return;

        ref.current.classList.remove('invalid');
        try {


            const response = await axios.post(`${server_endpoint}/api/contact-us`, form, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            toast.success(response.data.message);
            setAttachedFileName("");;
            resetForm();
        } catch (error) {
            console.error("Submission error:", error);

            // Safe access for backend-defined error
            const errorMessage =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Something went wrong. Please try again.";

            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <footer className="footer">
            <div className="row">
                <div className="col">
                    <div className="d-flex justify-content-lg-center justify-content-start py-4 px-0">
                        <div className="d-flex flex-column align-items-start justify-content-lg-center align-items-lg-center relative">
                            <div className='d-flex '>

                                <a
                                    href="/"
                                    className="s-font contrast-color"
                                    style={{ fontSize: '5em', textDecoration: 'none', position: 'relative' }}
                                >
                                    GIC
                                </a>
                            </div>
                            <div className="footer-text">
                                Building C1
                                <br />
                                Office 1208, Ajman FreeZone, Ajman, UAE
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            <div className="row">
                <div className="col d-flex justify-content-center align-items-center">
                    <div className="divider"></div>
                </div>
            </div>


            <div className="row mt-4">
                <div className="col-12 col-lg-6 px-0">
                    <div className="d-flex justify-content-lg-center justify-content-start">
                        <div className="footer-input-container px-2 position-relative">
                            <input type="text" placeholder="Subscribe For News" onChange={(e) => setEmail(e.target.value)} ref={inputRef} />

                            <FaArrowRight className="arrow-icon" onClick={handleSubmit} />
                            <div className="px-2 position-absolute text-danger" ref={validationMessageRef}>

                            </div>
                        </div>
                    </div>

                </div>

                <div className="col-12 col-lg-6 p-lg-0 p-5 mb-4 d-flex align-items-start justify-content-center flex-column px-2">
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
