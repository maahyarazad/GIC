import { LuSquareArrowUpRight } from "react-icons/lu";
import { IoMdClose } from "react-icons/io";
import React, { useState, useRef, useEffect } from "react";
import Angel from "../../Assets/angel.png";
import difa from "../../Assets/difa.png";
import expert from "../../Assets/expert.png";
import WhiteReward from "../../Assets/whitereward.png";
import gec_mobile from "../../Assets/gec-mobile.png";
import ifza from "../../Assets/ifza.png";
import './ShowCases.css';

const ShowCases = () => {
    const [showIframe, setShowIframe] = useState(false);
    const iframeRef = useRef(null);
    const [frameSrc, setFrameSrc] = useState("");

    // Refs for all cards
    const cardRefs = useRef([]);
    // State for visible cards indexes
    const [visibleCards, setVisibleCards] = useState([]);

    // Intersection Observer effect
    useEffect(() => {
        const options = { threshold: 0.35 };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = cardRefs.current.indexOf(entry.target);
                    if (index !== -1 && !visibleCards.includes(index)) {
                        setVisibleCards((prev) => [...prev, index]);
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, options);

        cardRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [visibleCards]);

    const handleOpen = (e) => {
        e.preventDefault();
        const href = e.currentTarget.getAttribute("href");
        setFrameSrc(href);
        setShowIframe(true);
    };

    const handleClose = () => {
        setShowIframe(false);
    };

    // Close iframe when clicking outside
    useEffect(() => {
        if (!showIframe) return;

        const handleClickOutside = (e) => {
            if (iframeRef.current && !iframeRef.current.contains(e.target)) {
                setShowIframe(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showIframe]);

    return (
        <>
            <div className="row w-100 show-case justify-self-center">
                {[
                    {
                        img: WhiteReward,
                        alt: "White Reward",
                        title: "Website",
                        name: "White Reward",
                        url: "https://www.whitereward.com/",
                        onClick: handleOpen,
                    },
                    {
                        img: Angel,
                        alt: "Angel Bureau",
                        title: "Website",
                        name: "Angel Bureau",
                        url: "https://www.angels-bureau.com/",
                        onClick: handleOpen,
                    },
                    {
                        img: difa,
                        alt: "DIFA",
                        title: "Website",
                        name: "DIFA",
                        url: "https://www.difa.agency/",
                        onClick: handleOpen,
                    },
                    {
                        img: expert,
                        alt: "Expert Circle",
                        title: "Website",
                        name: "Expert Circle",
                        url: "https://www.german-emirates-club.com/gec-events/expert",
                        onClick: handleOpen,
                    },
                    {
                        img: gec_mobile,
                        alt: "GEC Mobile",
                        title: "Mobile Application",
                        name: "GEC Mobile",
                        url: "https://play.google.com/store/apps/details?id=com.buenapublica.GECRewards&hl=en",
                    },
                    {
                        img: ifza,
                        alt: "IFZA Elite",
                        title: "Mobile Application",
                        name: "IFZA Elite",
                        url: "https://play.google.com/store/apps/details?id=com.root.ifza&hl=en",
                    },
                ].map(({ img, alt, title, name, url, onClick }, i) => (
                    <div
                        key={i}
                        className={`col-lg-6 col-12 show-card ${visibleCards.includes(i) ? "visible" : ""
                            }`}
                        ref={(el) => (cardRefs.current[i] = el)}
                    >
                        <div className="show-case-container d-flex flex-column">
                            <img src={img} alt={alt} />
                            <div className="info-panel d-flex">
                                <div className="align-self-end">
                                    <p className="text-dark">
                                        <strong>{title}</strong>
                                    </p>
                                    {onClick ? (
                                        <a
                                            href={url}
                                            onClick={onClick}
                                            className="a-button"
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <strong>{name}</strong>
                                        </a>
                                    ) : (
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="a-button"
                                        >
                                            <strong>{name}</strong>
                                        </a>
                                    )}
                                </div>
                                <div className="align-self-end">
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="a-link"
                                        aria-label={`Open ${name} in new tab`}
                                    >
                                        <LuSquareArrowUpRight size={30} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div>
                <iframe
                    ref={iframeRef}
                    src={frameSrc || undefined}
                    title="Full Page Iframe"
                    className={`fullscreen-iframe ${showIframe ? "show-iframe" : ""}`}
                    
                />
                <button
                    className={`close-iframe ${showIframe ? "visible" : ""} align-items-center d-flex `}
                    onClick={handleClose}
                    aria-label="Close iframe"
                >
                    <IoMdClose size={20} />
                </button>
            </div>
        </>
    );
};

export default ShowCases;
