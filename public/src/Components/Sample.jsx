import React, { useEffect, useState } from "react";
import SlidingDownImage from '../Assets/emir-new-img-top-extra-small-v01-bg.jpg';

export default function EmirStyleHero() {
  const [slideDown, setSlideDown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlideDown(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const height = 600; // Limit height in px

  return (
    <div style={{ position: "relative", height: `${height}px`, overflow: "hidden" }}>
      {/* Background image */}
      <div
        style={{
          backgroundImage: `url(${SlidingDownImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "absolute", // changed from fixed to absolute for section behavior
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          filter: "brightness(0.9)",
        }}
      />

      {/* White sliding panel */}
      <div
        className={`white-slide ${slideDown ? "slide-down" : ""}`}
        style={{
          position: "absolute",
          top: slideDown ? 0 : `-${height}px`, // slide down from above container
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "white",
          zIndex: 2,
          transition: "top 1s ease-out",
          overflowY: "auto",
          padding: "2rem",
          boxSizing: "border-box",
        }}
      >
        {/* Your real content goes here */}
      </div>
    </div>
  );
}
