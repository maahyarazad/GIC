import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import './Navbar.css';
import type { RootState } from "../../store";
import { EnvContext } from '../../EnvContext.jsx'
import mainLogo from '../../../public/gic-logo-main.png';
import mainLogoLight from  '../../../public/gic-logo-transparent.png';
import { usePage } from '@/Providers/PageContext';
import useIsMobile from '@/Hooks/useIsMobile'
import { useSelector, useDispatch } from 'react-redux';
import { setDashboardSidebarOpen, toggleDashboardSidebar } from '@/features/appSlice';
import { isNavbarCollapsedWidth } from './navbarConfig';
import { useNavbarFit } from './useNavbarFit';
import { useDismissable } from './useDismissable';
import { TfiEmail } from "react-icons/tfi";

// Users allowed to see the webmail icon.
const WEBMAIL_ALLOWLIST = [
    'philip.hoelzer@german-industry-club.com',
    'jan.hussing@german-industry-club.com',
    'thomas.hochberger@german-industry-club.com',
];
const ROUNDCUBE_URL = 'https://buenapublica.cmpsrv.com/rc/';

type NavbarProps = {
    onLanguageChange: any, currentlanguage: any
}
const Navbar = (
    { onLanguageChange, currentlanguage }: NavbarProps
) => {

    const siteData = useSelector((state: RootState) => state.app.siteData);


    const navbarLinks = siteData?.navLinks;
    const companyName = siteData?.companyName;


    const { showPage, activePage } = usePage();
    const isMobile = useIsMobile();
    const env: string = useContext(EnvContext);


    const location = useLocation();
    const navigate = useNavigate();
    // Landing mobile menu (.mob-nav).
    const [menuOpen, setMenuOpen] = useState(false);
    const [language, setLanguage] = useState(currentlanguage);
    const [scrolled, setScrolled] = useState(false);
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
    const isDashboard = location.pathname.startsWith('/dashboard');

    // One hamburger: on dashboard routes it toggles the dashboard sidebar (shared via Redux),
    // everywhere else the mobile menu below.
    const dispatch = useDispatch();
    const sidebarOpen = useSelector((state: RootState) => state.app.dashboardSidebarOpen);
    const toggleSidebar = useCallback(() => dispatch(toggleDashboardSidebar()), [dispatch]);
    const closeSidebar = useCallback(() => dispatch(setDashboardSidebarOpen(false)), [dispatch]);


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
        const onScroll = () => {
            setScrolled(window.scrollY > 0);
        };

        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, [])



      const isBlogPage = /^\/blog(\/.*)?$/.test(activePage);


    const userEmail = user?.email?.trim().toLowerCase();
    const canUseWebmail = !!userEmail && WEBMAIL_ALLOWLIST.includes(userEmail);
    const webmailHref = `${ROUNDCUBE_URL}?_user=${encodeURIComponent(user?.email ?? '')}`;

    const User: React.ReactNode = (
        <>
            {user !== null ? (
                <>
                    {canUseWebmail && (
                        <a
                            className="user-webmail-link"
                            href={webmailHref}
                            target="_blank"
                            rel="noreferrer"
                            title="Open Webmail"
                            aria-label="Open Webmail"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <TfiEmail />
                        </a>
                    )}
                    <span
                        className={`span-link user-link ${activePage === "/dashboard" ? "active" : ""
                            }`}
                        onClick={(e) => {
                            closeMenu();
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
                            closeMenu();
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

    // header is inverted relative to the page theme, so the logo is too
    const logoSrc = theme === "light" ? mainLogo : mainLogoLight;


    const mobNavRef = useRef<HTMLDivElement | null>(null);
    const hamburgerRef = useRef<HTMLButtonElement | null>(null);
    const sidebarRef = useRef<HTMLElement | null>(null);
    const middleRef = useRef<HTMLDivElement | null>(null);
    const linksRef = useRef<HTMLUListElement | null>(null);

    const toggleTheme = () => {
        const next = theme === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        setTheme(next);
    };

    const toggleMenu = () => {
        if (isDashboard) return;
        setMenuOpen((prev) => !prev);
    };

    const closeMenu = useCallback(() => setMenuOpen(false), []);

    // The mobile menu never opens on dashboard routes.
    useEffect(() => {
        if (isDashboard) setMenuOpen(false);
    }, [isDashboard]);

    // Landing links that don't fit fall back to the hamburger at any width. The dashboard has no links.
    const fits = useNavbarFit(middleRef, linksRef, [navbarLinks, user, currentlanguage]);
    const compact = !isDashboard && fits;

    // Widening the window until the links fit closes the menu. Below the breakpoint the media query
    // keeps the hamburger, so the menu stays as it is.
    useEffect(() => {
        if (!compact && !isNavbarCollapsedWidth()) setMenuOpen(false);
    }, [compact]);

    // Above the breakpoint the sidebar is always in view; drop the flag so narrowing again starts closed.
    useEffect(() => {
        if (!sidebarOpen) return;
        const onResize = () => {
            if (!isNavbarCollapsedWidth()) closeSidebar();
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [sidebarOpen, closeSidebar]);

    // The sidebar lives in the Dashboard tree, so look it up rather than holding a ref to it.
    useEffect(() => {
        sidebarRef.current = isDashboard ? document.getElementById('dashboard-sidebar') : null;
    }, [isDashboard, sidebarOpen]);

    useDismissable({ open: !isDashboard && menuOpen, onClose: closeMenu, panelRef: mobNavRef, toggleRef: hamburgerRef });
    useDismissable({
        open: isDashboard && sidebarOpen && isNavbarCollapsedWidth(),
        onClose: closeSidebar,
        panelRef: sidebarRef,
        toggleRef: hamburgerRef,
    });

    const panelOpen = isDashboard ? sidebarOpen : menuOpen;

    return (

        <>
            <nav className={compact ? 'nav--compact' : undefined}>
                <div className="nav-brand" onClick={() => { showPage(''); navigate("/"); }}>
                    <img src={logoSrc} className={theme === "light" ? "nav-logo" : "nav-logo"} alt="German Industry Club Logo" fetchPriority='high' decoding="async" title="German Industry Club Logo" />
                </div>
                <div className="nav-middle" ref={middleRef}>

                    <ul className="nav-links" ref={linksRef} style={isDashboard ? { display: 'none' } : undefined}>

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
                    {/* In the dashboard the mobile menu never opens, so the avatar stays in the bar. */}
                    {isMobile && !isDashboard ? null : User}
                    <div className="theme-wrap" onClick={toggleTheme}>
                        <span className="theme-lbl" id="themeLbl">{theme === "light" ? "Light" : "Dark"}</span>
                        <div className="theme-tog"></div>
                    </div>
                    <button
                        type="button"
                        ref={hamburgerRef}
                        className={`hamburger${panelOpen ? ' open' : ''}`}
                        id="hamburger"
                        aria-label={panelOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={panelOpen}
                        aria-controls={isDashboard ? 'dashboard-sidebar' : 'mobile-nav'}
                        onClick={isDashboard ? toggleSidebar : toggleMenu}
                    >
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </nav>

            <div
                id="mobile-nav"
                className={`mob-nav ${menuOpen ? "open" : ""}`}
                ref={mobNavRef}
            >
                {!isDashboard && Array.isArray(navbarLinks) && navbarLinks?.map((link) => (
                    <li key={link.path} >
                        {
                            link.type === 'link' && <span className={`span-link ${(link.path === '/blog' ? isBlogPage : activePage === link.path) ? 'active' : ''}`}

                                onClick={() => {
                                    closeMenu();
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
                {!isDashboard && User}
                {/* <li><a onClick={() => {
                    showPage('/contact');
                    navigate('/contact');
                }} className="span-cta">Apply Now</a></li> */}


            </div>
        </>



    );
};

export default React.memo(Navbar);
