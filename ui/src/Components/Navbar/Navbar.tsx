import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import './Navbar.css';
import type { RootState } from "../../store";
import { EnvContext } from '../../EnvContext.jsx'
import mainLogo from '../../../public/gic-logo-main.png';
import mainLogoLight from  '../../../public/gic-logo-main-light.png';
import { usePage } from '@/Providers/PageContext';
import useIsMobile from '@/Hooks/useIsMobile'
import { useSelector, useDispatch } from 'react-redux';
import { setReady } from '@/features/appSlice';


type NavbarProps = {
    onLanguageChange: any, currentlanguage: any
}
const Navbar = (
    { onLanguageChange, currentlanguage }: NavbarProps
) => {

    const siteData = useSelector((state: RootState) => state.app.siteData);
    useEffect(() => {

    }, [siteData])


    const _navLinks = useSelector(
        (state: RootState) => state.app.siteData?.navLinks
    );

    useEffect(() => {

    }, [_navLinks]);


    const navbarLinks = siteData?.navLinks;
    const companyName = siteData?.companyName;


    const { showPage, activePage } = usePage();
    const isMobile = useIsMobile();
    const env: string = useContext(EnvContext);


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



      useEffect(()=> {
      console.log(activePage);
      console.log(/^\/blog(\/.*)?$/.test(activePage));
      }, [activePage])
      
      const isBlogPage = /^\/blog(\/.*)?$/.test(activePage);


    const User: React.ReactNode = (
        <>
            {user !== null ? (
                <>
                    <span
                        className={`span-link user-link ${activePage === "/dashboard" ? "active" : ""
                            }`}
                        onClick={(e) => {
                            closeMob();
                            handleScroll(e, "dashboard", "link", "/dashboard");
                        }}
                    >
                        <span className="user-link__avatar">
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                    </span>
                </>
            ) : (
                <>
                    <span
                        className={`span-link ${activePage === "/login" ? "active" : ""
                            }`}
                        onClick={(e) => {
                            closeMob();
                            handleScroll(e, "login", "link", "/login");
                        }}
                    >
                        Sign-in
                    </span>
                </>
            )}
        </>
    );



    const [theme, setTheme] = useState(
        typeof document !== 'undefined'
            ? document.documentElement.getAttribute('data-theme')
            : 'light'
    );

const logoSrc = theme === "light" ? mainLogoLight : mainLogo;


    const NavLogo = (
        <>
            <div className="nav-brand" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
                {/* in light theme the logo should change */}
                <img src={logoSrc} className="main-logo" alt="German Industry Club Logo" fetchPriority='high' decoding="async" title="German Industry Club Logo" />
            </div>

        </>
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
                <div className="nav-brand" onClick={() => { showPage(''); navigate("/"); }}>
                    <img src={logoSrc} className={theme === "light" ? "nav-logo" : "nav-logo"} alt="German Industry Club Logo" fetchPriority='high' decoding="async" title="German Industry Club Logo" />
                </div>
                <div className='d-flex justify-content-center'>

                    <ul className="nav-links">

                        {Array.isArray(navbarLinks) &&
                            navbarLinks.map((link) => (
                                <li key={link.path}>
                                    {link.type === "link" && (
                                        <span
                                            className={`span-link ${(link.path === '/blog' ? isBlogPage : activePage === link.path) ? "active" : ""}`}
                                            onClick={() => {
                                                showPage(link.path);
                                                navigate(link.path);
                                            }}
                                        >
                                            {link.label}
                                        </span>
                                    )}

                                    {link.type === "button" && (
                                        <Link
                                            to="#"
                                            onClick={(e) =>
                                                handleScroll(e, link.id, link.type, link.path)
                                            }
                                        >
                                            {link.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        {/* <li><a onClick={() => {
                            showPage('/contact');
                            navigate('/contact');
                        }} className="nav-cta">Apply Now</a></li> */}



                    </ul>
                </div>

                <div className="nav-right">
                    {isMobile ? null : User}
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
                {Array.isArray(navbarLinks) && navbarLinks?.map((link) => (
                    <li key={link.path} >
                        {
                            link.type === 'link' && <span className={`span-link ${(link.path === '/blog' ? isBlogPage : activePage === link.path) ? 'active' : ''}`}

                                onClick={() => {
                                    closeMob();
                                    showPage(link.path);
                                    navigate(link.path);
                                }}
                            >
                                {link.label}
                            </span>
                        }
                        {
                            link.type === 'button' && <Link to="#" onClick={(e) => handleScroll(e, link.id, link.type, link.path)}>{link.label}</Link>
                        }
                    </li>

                ))}
                {User}
                {/* <li><a onClick={() => {
                    showPage('/contact');
                    navigate('/contact');
                }} className="span-cta">Apply Now</a></li> */}


            </div>
        </>



    );
};

export default React.memo(Navbar);
