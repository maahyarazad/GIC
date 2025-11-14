import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import './Navbar.css';

// React Component
import Burger from '@animated-burgers/burger-rotate'
// don't forget the styles
import '@animated-burgers/burger-rotate/dist/styles.css'
// import logo from '../../Assets/palmx-logo.jpeg'
import MobileBackGround from '../../Assets/pexels-pixabay-262347.jpg'


const Navbar = ({ companyName, navbarLinks, siteData, onLanguageChange, currentlanguage }) => {

    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileView, setMobileView] = useState(false);
    const [language, setLanguage] = useState(currentlanguage);
    const [scrolled, setScrolled] = useState(false);
    const [shouldScroll, setShouldScroll] = useState(false);
    const [pendingScrollKey, setPendingScrollKey] = useState(null);



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

    function isLinkActive(_linkPath) {
        // Normalize by removing leading and trailing slashes
        const normalizePath = (path) => path.replace(/^\/+|\/+$/g, '');

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
                setMobileView(true)
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

    return (
        <nav
            className={`navbar ${showNavbar ? 'navbar-scrolled' : ''}`}
          style={{
  backgroundColor: scrolled 
    ? 'var(--primary-gray-color)' 
    : (location.pathname === '/' ? 'transparent' : 'black')
}}
        >


            <div className="d-flex justify-content-center flex-column relative" >

                <div className='menu-button'>

                    <button className={`menu-toggle ${scrolled ? 'scrolled' : ''}`} aria-label="Toggle menu">
                        <Burger isOpen={menuOpen} direction="right" onClick={toggleMenu}>

                        </Burger>
                    </button>
                </div>






                <div className={`navbar-section-middle ${showNavbar ? "d-none" : ""}`}>




                    <a href='/' className='s-font position-absolute gic-logo' style={{fontSize: '2em', textDecoration: 'none', left: '15vw', top: '-1vh'}}>GIC</a>
                    <ul className="navbar-links desktop-only">

                        {navbarLinks?.map((link) => (
                            <li key={link.path} className={isLinkActive(link.path) ? "active" : ""}>
                                {
                                    link.type === 'link' && <a href={link.path}>{link.label}</a>
                                }
                                {
                                    link.type === 'button' && <Link onClick={(e) => handleScroll(e, link.id, link.type, link.path)}>{link.label}</Link>
                                }
                            </li>
                        ))}
                    </ul>

                </div>

                <div className={`navbar-section-middle ${showNavbar ? "visible" : "hidden"}`}

                    style={{
                        // display: mobileView ?  'none': 'flex', 
                        height: showNavbar ? '3vh' : 0,
                        // transition: "transform 0.4s ease, opacity 0.4s ease",
                        // transform: showNavbar ? "translateY(0)" : "translateY(-100%)",
                        opacity: showNavbar ? 1 : 0,
                    }}
                >


                      <a href='/' className='s-font position-absolute gic-logo' style={{fontSize: '2em', textDecoration: 'none', left: '15vw', top: '-1vh'}}>GIC</a>
                    {/* Desktop Nav Links */}
                    <ul className="navbar-links desktop-only">
                        
                        {navbarLinks?.map((link) => (
                            <li key={link.path} className={isLinkActive(link.path) ? "active" : ""}>
                                {
                                    link.type === 'link' && <a href={link.path}>{link.label}</a>
                                }
                                {
                                    link.type === 'button' && <Link onClick={(e) => handleScroll(e, link.id, link.type, link.path)}>{link.label}</Link>
                                }
                            </li>
                        ))}
                    </ul>
                </div>


            </div>


            {/* Slide-out Mobile Menu */}
            <div className={`mobile-menu ${menuOpen ? 'open' : ''} ${scrolled ? 'scrolled' : ''}`}
                style={{
                    backgroundImage: `url(${MobileBackGround})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <ul className="mobile-links">
                    {navbarLinks?.map((link) => (
                        <li key={link.path} className={isLinkActive(link.path) ? "active" : ""}>
                            <Link onClick={(e) => handleScroll(e, link.id, link.type, link.path)}>{link.label}</Link>
                        </li>
                    ))}
                </ul>
                {/* <div className="mobile-lang-switch">
                    <label className="switch">
                        <input type="checkbox" onChange={switchLanguage} checked={language === 'DE'} />
                        <span className="slider" />
                    </label>
                    <span className="lang-label">{language}</span>
                </div>
                <button
                    type="button"
                    className="get-started mobile"
                    onClick={GetStarted}
                >
                    {siteData.getStartedNow}
                </button> */}
            </div>
        </nav>
    );
};

export default Navbar;
