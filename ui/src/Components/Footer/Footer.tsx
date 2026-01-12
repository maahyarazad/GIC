import React, { useState, useRef } from 'react';
import './Footer.css';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaArrowRight } from 'react-icons/fa';
import { useToast } from '../../providers/ToastContext';
import axiosInstance from '../../api/axiosInstance';

interface SocialLink {
    platform: string;
    url: string;
}

interface NavLink {
    label: string;
    path: string;
}

interface FooterData {
    socialLinks?: SocialLink[];
    navLinks: NavLink[];
}

interface FooterProps {
    footerData: FooterData | null;
}

const Footer: React.FC<FooterProps> = ({ footerData }) => {
    const [email, setEmail] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const validationMessageRef = useRef<HTMLDivElement>(null);
    const { show } = useToast();

    if (!footerData) return null;

    const handleSubmit = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // ❌ Invalid email
        if (!emailRegex.test(email)) {
            inputRef.current?.classList.add('invalid');
            if (validationMessageRef.current) {
                validationMessageRef.current.innerHTML = 'Invalid Email';
            }
            return;
        }

        // Clear validation
        inputRef.current?.classList.remove('invalid');
        if (validationMessageRef.current) {
            validationMessageRef.current.innerHTML = '';
        }

        try {
            const payload = {
                email: email,
                active: true,
            };

            // FIX: Must call POST method
            const response = await axiosInstance.post('/newsletter', payload);
            
            if(response.data.success){

                // Clear field
                if (inputRef.current) inputRef.current.value = '';
                setEmail('');
    
                show({
                    type: 'success',
                    message:response.data.message
                });
            }

            
        } catch (error: any) {
            
            show({
                type: 'error',
                message: error.message,
            });
        }
    };

    return (
        <footer className="footer">

            {/* Logo + Address */}
            <div className="row">
                <div className="col">
                    <div className="d-flex justify-content-lg-center justify-content-start py-4">
                        <div className="d-flex flex-column align-items-start align-items-lg-center">
                            <a href="/" className="s-font contrast-color" style={{ fontSize: '5em', textDecoration: 'none' }}>
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

            {/* Divider */}
            <div className="row">
                <div className="col d-flex justify-content-center align-items-center">
                    <div className="divider"></div>
                </div>
            </div>

            {/* Newsletter + Links */}
            <div className="row mt-4">
                <div className="col-12 col-lg-6 px-0">
                    <div className="d-flex justify-content-lg-center justify-content-start">
                        <div className="footer-input-container px-2 position-relative">
                            <input
                                type="text"
                                placeholder="Subscribe For News"
                                onChange={(e) => setEmail(e.target.value)}
                                ref={inputRef}
                            />

                            <FaArrowRight className="arrow-icon" onClick={handleSubmit} />

                            <div className="px-2 position-absolute text-danger" ref={validationMessageRef}></div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-6 p-lg-0 p-5 mb-4 d-flex align-items-start justify-content-center flex-column">
                    <div className="d-flex justify-content-lg-center justify-content-start flex-column">
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
