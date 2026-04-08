import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, UseSelector } from 'react-redux';
import './Navbar.css';
import type { RootState } from "../../store";
import { EnvContext } from '../../EnvContext.js'
import mainLogo from '../../../public/gic-log-main.png';
import { usePage } from '@/Providers/PageContext';



type NavbarProps = {
    companyName: any, navbarLinks: any, siteData: any, onLanguageChange: any, currentlanguage: any
}
const Navbar = (
    { companyName, navbarLinks, siteData, onLanguageChange, currentlanguage }: NavbarProps
) => {

    const { showPage, activePage } = usePage();
    const env: string = useContext(EnvContext);
    const isReady = useSelector((state: RootState) => state.app.isReady);

    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileView, setMobileView] = useState(false);
    const [language, setLanguage] = useState(currentlanguage);
    const [scrolled, setScrolled] = useState(false);
    const [shouldScroll, setShouldScroll] = useState(false);
    const [pendingScrollKey, setPendingScrollKey] = useState(null);


    const user = useSelector((state: RootState) => state.auth.user);
    function isLinkActive(_linkPath: string) {
        // Normalize by removing leading and trailing slashes
        const normalizePath = (path: string) => path.replace(/^\/+|\/+$/g, '');

        const currentPathRaw = location.pathname;

        const currentPath = normalizePath(currentPathRaw);
        const linkPath = normalizePath(_linkPath);

        const isHome = linkPath === '';
        const isOnHomePage = currentPathRaw === '/'; // exact match to root path

        if (isHome) {
            return isOnHomePage; // home active only if current path is exactly "/"
        } else {
            // active if current path equals link path or starts with link path + '/'
            return currentPath === linkPath || currentPath.startsWith(linkPath + '/');
        }
    }
    const [showNavbar, setShowNavbar] = useState(false);


    // Toggle the mobile menu
    const toggleMenu = () => setMenuOpen(!menuOpen);
    const GetStarted = (e) => {
        e.preventDefault();

        if (location.pathname !== '/') {
            navigate('/', { replace: false });
            setShouldScroll(true); // set a flag to scroll after navigation
        } else {
            scrollToForm();
        }
    };

    // Trigger scroll after route change
    useEffect(() => {
        if (shouldScroll && location.pathname === '/') {
            const timeout = setTimeout(() => {
                scrollToForm();
                setShouldScroll(false); // reset
            }, 300); // delay (adjust if needed)

            return () => clearTimeout(timeout);
        }
    }, [location.pathname, shouldScroll]);

    const scrollToForm = () => {
        const element = document.querySelector("section.request-form-section");
        if (element) {
            const yOffset = -100;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });

            const menu = document.querySelector(".mobile-menu.open");
            if (menu) {
                // menu.classList.remove("open");
                setMenuOpen(false);
            }
        }
    };


    const switchLanguage = () => {
        const newLang = language === 'EN' ? 'DE' : 'EN';
        setLanguage(newLang);

        if (onLanguageChange) {
            onLanguageChange(newLang);
        }
    };



    const handleScroll = (e, key, type, path) => {
        e.preventDefault();

        if (type === 'link') {

            navigate(path)
            setMenuOpen(false);

            return;
        }

        if (location.pathname !== '/') {
            setPendingScrollKey(key); // Save scroll target
            navigate('/', { replace: false }); // Navigate first
        } else {
            scrollToSection(key); // Scroll immediately
        }

        setMenuOpen(false);
    };

    // Wait for navigation to complete, then scroll
    useEffect(() => {
        if (pendingScrollKey && location.pathname === '/') {
            const timeout = setTimeout(() => {
                scrollToSection(pendingScrollKey);
                setPendingScrollKey(null); // Reset
            }, 300); // Adjust delay if needed

            return () => clearTimeout(timeout);
        }
    }, [location.pathname, pendingScrollKey]);

    const scrollToSection = (key) => {
        const targetElement = document.getElementById(`section-${key}`);
        if (targetElement) {
            const y = targetElement.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    };

    useEffect(() => { }, [companyName, navbarLinks]);





    useEffect(() => {
        const handleScroll = () => {
            if (window.innerWidth > 1024) { // desktop only
                if (window.scrollY > 100) {
                    setShowNavbar(true);
                } else {
                    setShowNavbar(false);
                }
            } else {
                // always show on mobile
                setShowNavbar(true);
                setMobileView(true);
            }
        };

        handleScroll(); // run on mount
        window.addEventListener("scroll", handleScroll);
        window.addEventListener("resize", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
        };
    }, []);


    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 0);
        };

        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, [])

    if (!navbarLinks || !companyName) return null


    const User: React.ReactNode = (
        <>
            {user !== null ? (
                <li className={activePage ? 'active' : ''}>
                    <Link to="/#" onClick={(e) => handleScroll(e, "dashboard", "link", "/dashboard")}>Dashboard</Link>
                </li>
            ) : (
                <li className={activePage ? 'active' : ''}>
                    <Link to="/#" onClick={(e) => handleScroll(e, "login", "link", "/login")}>Sign-in</Link>
                </li>
            )}
        </>
    );






    useEffect(() => { }, [isReady])

    const NavLogo = isReady ? (
        <>
            <div className="nav-brand" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
                <img src={mainLogo} className="main-logo" alt="German Industry Club Logo" fetchPriority='high' decoding="async" title="German Industry Club Logo" />
            </div>


        </>
    ) : null;

    const [theme, setTheme] = useState(
        document.documentElement.getAttribute("data-theme") || "light"
    );
    const [isOpen, setIsOpen] = useState(false);

    const mobNavRef = useRef(null);
    const hamburgerRef = useRef(null);

    const toggleTheme = () => {
        const next = theme === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        setTheme(next);
    };

    const toggleMob = () => {
        setIsOpen((prev) => !prev);
    };

    const closeMob = () => {
        setIsOpen(false);
    };

    useEffect(() => {

        const handleClickOutside = (e) => {
            if (
                isOpen &&
                mobNavRef.current &&
                hamburgerRef.current &&
                !mobNavRef.current.contains(e.target) &&
                !hamburgerRef.current.contains(e.target)
            ) {
                closeMob();
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isOpen]);









    return (

        <>
            <nav>
                <div className="nav-brand" onClick={() => {showPage('home'); navigate("/");}}>
                    {isReady ?

                        <img src={mainLogo} className={theme === "light" ? "nav-logo dark" : "nav-logo"} alt="German Industry Club Logo" fetchPriority='high' decoding="async" title="German Industry Club Logo" />
                        : null}
                </div>
                <div className='d-flex justify-content-center'>

                    <ul className="nav-links">

                        {navbarLinks?.map((link) => (
                            <li key={link.path} className={activePage ? "active" : ""}>
                                {
                                    link.type === 'link' && <Link to={link.path}>{link.label}</Link>
                                }
                                {
                                    link.type === 'button' && <Link to="#" onClick={(e) => handleScroll(e, link.id, link.type, link.path)}>{link.label}</Link>
                                }
                            </li>
                        ))}

                        {User}

                    </ul>
                </div>

                <div className="nav-right">
                    <div className="theme-wrap" onClick={toggleTheme}>
                        <span className="theme-lbl" id="themeLbl">{theme === "light" ? "Light" : "Dark"}</span>
                        <div className="theme-tog"></div>
                    </div>
                    <div className="hamburger" id="hamburger" onClick={toggleMob}>
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </nav>

            <div
                className={`mob-nav ${isOpen ? "open" : ""}`}
                ref={mobNavRef}
            >
                {navbarLinks?.map((link) => (
                    <li key={link.path} className={isLinkActive(link.path) ? "active" : ""}>
                        {
                            link.type === 'link' && <Link className={activePage === "about" ? "active" : ""} to={link.path}>{link.label}</Link>
                        }
                        {
                            link.type === 'button' && <Link to="#" onClick={(e) => handleScroll(e, link.id, link.type, link.path)}>{link.label}</Link>
                        }
                    </li>
                ))}

                {User}
            </div>
        </>



    );
};

export default React.memo(Navbar);
