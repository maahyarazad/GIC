// HomeSlider.jsx
import React, { forwardRef, useState, useRef, useEffect } from 'react';
import './HomeSlider.css';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const HomeSlider = forwardRef(({ id, title, text, siteData ,image, className }, ref) => {

    const GetStarted = (e) => {
        var element = document.querySelector("section.request-form-section");
        if (element) {
            const yOffset = -100;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

            window.scrollTo({ top: y, behavior: "smooth" });

        }
    }


    return (
        <div ref={ref} id={id} className={`home-slider ${className}`}>
            {/* <LazyLoadImage
                src={image}
                alt={title}
                placeholderSrc={image}
                className="slider-image"
            /> */}
            <div className="slider-content">
                <h1 className="slider-title">{title}</h1>
                <h2 className="slider-text">{text}</h2>
                <div className="d-flex justify-content-end button-wrapper">
                    {/* <button className="btn btn-lg btn-primary-contrast"
                        onClick={GetStarted}
                    >
                        {siteData.getStarted}</button> */}
                </div>
            </div>
        </div>
    );
});

export default HomeSlider;
