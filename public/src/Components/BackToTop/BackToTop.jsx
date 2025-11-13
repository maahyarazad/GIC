import React, { useState, useEffect, useRef } from 'react';
import './BackToTop.css';

const BackToTop = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const circleRef = useRef(null);

    const [colorList, setColorList] = useState([]);

    useEffect(() => {
        const root = document.documentElement;

        const primaryColor = getComputedStyle(root).getPropertyValue("--primary-color").trim();
        const contrastColor = getComputedStyle(root).getPropertyValue("--primary-contrast-color").trim();

        const colors = [primaryColor, contrastColor];
        setColorList(colors);

    }, []);

    const toggleVisibility = () => {
        setIsVisible(window.scrollY > 300);
    };

    const handleScroll = () => {
        toggleVisibility();

        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = docHeight > 0 ? scrollTop / docHeight : 0;
        setScrollProgress(scrolled);
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Circle constants
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - scrollProgress);

    return (
        <button
            className={`back-to-top ${isVisible ? 'show' : ''}`}
            onClick={scrollToTop}
            aria-label="Scroll to top"
        >
            <svg className="progress-ring" width="60" height="60">
                <circle
                    className="progress-ring__circle"
                    stroke={colorList[1]}
                    strokeWidth="4"
                    fill="transparent"
                    r={radius}
                    cx="30"
                    cy="30"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: dashOffset,
                        transition: 'stroke-dashoffset 0.3s ease',
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                    }}
                    ref={circleRef}
                />
            </svg>
            <span className="arrow">↑</span>
        </button>
    );
};

export default BackToTop;
