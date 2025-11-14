import { useCallback, useEffect, useState, useRef } from "react";

// import bgDesktop from '../../../src/Assets/bg-new.png'
// import bgMobile from '../../../src/Assets/bg-1.png'
import bgDesktop from '../../Assets/6977979-hd_1920_1080_30fps.mp4'
import bgMobile from '../../Assets/6977979-hd_1920_1080_30fps.mp4'

const ParticleJsContainer = ({ children }) => {




    const [background, setBackground] = useState(bgDesktop);

    useEffect(() => {
        const updateBackground = () => {
            const screenWidth = window.innerWidth;
            if (screenWidth <= 768) {
                setBackground(bgMobile);
            } else {
                setBackground(bgDesktop);
            }
        };

        updateBackground();
        window.addEventListener("resize", updateBackground);

        return () => window.removeEventListener("resize", updateBackground);
    }, []);


   

    return (
      <div>
        <video
            autoPlay
            loop
            muted
            playsInline
            style={{
            position: "absolute",
            width: "100%",
            height: "95%",
            objectFit: "cover", // makes sure video covers the container nicely
            top: 0,
            left: 0,
            }}
        >
            <source src={background} type="video/mp4" />
            Your browser does not support the video tag.
        </video>
        </div>

    );
};

export default ParticleJsContainer;
