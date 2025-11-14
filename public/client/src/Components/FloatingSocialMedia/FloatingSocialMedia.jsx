import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import './FloatingSocialMedia.css';
import UseInView from '../../Hooks/UseInView';
import { useState, useEffect, useRef } from "react";


const DEFAULT_ICONS = [
    { name: "facebook", icon: FaFacebook, link: "https://facebook.com" },
    { name: "instagram", icon: FaInstagram, link: "https://instagram.com" },
    { name: "linkedin", icon: FaLinkedin, link: "https://linkedin.com" },
    { name: "youtube", icon: FaYoutube, link: "https://youtube.com" },
    { name: "x", icon: FaXTwitter, link: "https://x.com" },
];

export default function FloatingSocialMedia({
    size = 24,
    gap = 10,
    icons = DEFAULT_ICONS, // allow override
}) {

    const containerRef = useRef(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [position, setPosition] = useState('right');
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [coords, setCoords] = useState({ top: '50%', left: 'auto' });
const scrollTimeout = useRef(null);

   useEffect(() => {
    const handleScroll = () => {
      // Hide sidebar immediately on scroll
      setShowSidebar(false);

      // Detect screen width and set position
      const width = window.innerWidth;
      if (width < 576) {
        setPosition("bottom");
      } else {
        setPosition("right");
      }

      // Clear any existing timer
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

      // After 300ms of no scroll, show sidebar again
      scrollTimeout.current = setTimeout(() => {
        setShowSidebar(true);
      }, 300);
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

    function getFloatingSocialMediaClass(position, showSidebar) {
        const flex = position === 'right' ? 'flex-column' : 'flex-row';
        const baseClass = `floating-social-media position-${position} ${flex}`;
        const animationClass = position === 'right' ? 'slide-left' : 'slide-up';
        const visibleClass = showSidebar ? 'visible' : '';
        return `${baseClass} ${animationClass} ${visibleClass}`.trim();
    }


    useEffect(() => {
        if (!containerRef.current) return;

        const el = containerRef.current;
        const elWidth = el.offsetWidth;
        const elHeight = el.offsetHeight;

        const calcPos = () => {
            if (position === 'right') {
                return {
                    top: `calc(50% - ${elHeight / 2}px)`,
                    left: 'auto',
                    right: '5px',
                    bottom: 'auto',
                };
            }
            else {
                return {
                    top: 'auto',
                    left: `calc(50% - ${elWidth / 2}px)`,
                    right: 'auto',
                    bottom: '10px',
                };
            }
            return {};
        };

        setCoords(calcPos());
    }, [position, width, height, showSidebar]);



    return (
        <div
            ref={containerRef}
            className={getFloatingSocialMediaClass(position, showSidebar)} style={{
                top: coords.top,
                left: coords.left,
                right: coords.right,
                bottom: coords.bottom,
                position: 'fixed'
            }}>
            {icons.map(({ name, icon: Icon, link }) => (
                <a
                    key={name}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Icon size={size}  />

                </a>
            ))}
        </div>
    );
}
