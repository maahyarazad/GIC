import React, { useState, useRef, useEffect } from 'react';
import './Footer.css';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaArrowRight } from 'react-icons/fa';
import { useToast } from '../../providers/ToastContext';
import axiosInstance from '../../api/axiosInstance';
import mainLogo from '../../../public/gic-log-main.png';
import { useNavigate, Link } from 'react-router-dom';
import { usePage } from '@/Providers/PageContext';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from "../../store";
import { setReady } from '@/features/appSlice';


const Footer: React.FC = () => {



    const siteData = useSelector((state: RootState) => state.app.siteData);

    const [email, setEmail] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const validationMessageRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { show } = useToast();
    const { showPage, activePage } = usePage();



    const handleSubmit = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            inputRef.current?.classList.add('invalid');
            if (validationMessageRef.current) {
                validationMessageRef.current.innerHTML = 'Invalid Email';
            }
            return;
        }

        inputRef.current?.classList.remove('invalid');
        if (validationMessageRef.current) {
            validationMessageRef.current.innerHTML = '';
        }

        try {
            const response = await axiosInstance.post('/newsletter', { email, active: true });

            if (response.data.success) {
                if (inputRef.current) inputRef.current.value = '';
                setEmail('');
                show({ type: 'success', message: response.data.message });
            }
        } catch (error: any) {
            show({ type: 'error', message: error.message });
        }
    };


    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <>

            <div className="ft">
                <div className="ft-top">

                    {/* Brand */}
                    <div>
                        <div className="ft-bn">German Industry Club</div>
                        <div className="ft-bs">MEA</div>
                        <div className="ft-bd">
                            An exclusive boutique circle advancing German industrial interests across the Middle East and Africa.
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <div className="ft-ct">Navigation</div>
                        <ul className="ft-lks">
                            {isMounted && Array.isArray(siteData?.navLinks) &&
                                siteData.navLinks.map((link: any) => (
                                    <li key={link.path}>
                                        {link.type === "link" && (
                                            <a onClick={() => {
                                                showPage(link.path);
                                                navigate(link.path);
                                            }}>
                                                {link.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div><div className="ft-ct">Legal</div><ul className="ft-lks"><li><a>Privacy Policy</a></li><li><a>Terms &amp; Conditions</a></li><li><a>Sitemap</a></li></ul></div>

                    {/* Headquarters */}
                    <div>
                        <div className="ft-ct">Headquarters</div>
                        <div className="ft-addr">
                            Building C1, Office 1208<br />
                            Ajman FreeZone, Ajman, UAE<br /><br />
                            <span style={{ color: 'var(--ora)' }}>info@GIC.com</span>
                        </div>
                    </div>

                    {/* Newsletter */}
                    {/* <div>
                        <div className="ft-ct">Newsletter</div>
                        <div className="ft-nl">
                            <input
                                ref={inputRef}
                                type="email"
                                placeholder="Your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            />
                            <button onClick={handleSubmit}>
                                <FaArrowRight />
                            </button>
                        </div>
                        <div ref={validationMessageRef} className="ft-validation" />
                    </div> */}

                </div>

                {/* Bottom bar */}
                <div className="ft-bot">
                    <div className="ft-cp">&copy; 2025 German Industry Club MEA.</div>
                    <div className="ft-leg">
                        <a >Privacy Policy</a>
                        <a >Terms &amp; Conditions</a>
                    </div>
                </div>
            </div>
        </>
    );
};

export default React.memo(Footer);