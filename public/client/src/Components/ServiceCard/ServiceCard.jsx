
import "./ServiceCard.css";
import { FaCheck } from "react-icons/fa";
import { forwardRef, useEffect, useRef, useState } from 'react';


const ServiceCard = forwardRef(({
    href,
    imageSrc,
    imageAlt,
    title,
    description,
    services,
    linkText,
    showServicesList = true,
    clickable = false,
    hoverEffect = false,
        fixHeight = false,
    className = ''
}, ref) => {


    const hoverClass = hoverEffect ? "iot-card--hover" : "";


    return (
        <div ref={ref} className={`cart-container ${className}` }>
            {clickable ? (
                <a href={href} className={`iot-card ${hoverClass} ${fixHeight ? 'fix-height' : '' }`} >
                    <div className="iot-card__image">
                        <img src={imageSrc} alt={imageAlt} width={60} height={60} />
                        
                    </div>

                    <h4
                        className={`iot-card__title}`}>
                        {title}
                    </h4>

                    <div className="iot-card__text">
                        <p>{description}</p>
                        {showServicesList && services?.length > 0 && (
                            <ul className="iot-card__list">
                                {services.map((service, index) => (
                                    <li key={index}>{service}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <a href={href} className="iot-card__link">
                        {linkText}
                        <span>→</span>
                    </a>
                </a>
            ) : (
                <div className={`iot-card ${hoverClass} ${fixHeight ? 'fix-height' : '' }`}>
                    <div className="iot-card__title_bg s-font">{title[0]}</div>
                    <div className="iot-card__image">
                        <img src={imageSrc} alt={imageAlt} width={300} height={300} />
                    </div>
                    <div className="iot-card__text">
                        <h4 className="iot-card__title contrast-color">{title}</h4>
                        <div className="divider"></div>
                        <p className="iot-card__description">{description}</p>
                        {/* {showServicesList && services?.length > 0 && (
                            <ul className="iot-card__list">
                                {services.map((service, index) => (
                                    <div className="d-block flex-grow-1" key={index}>
                                        <li className="align-items-center d-flex">
                                            <FaCheck className="check-icon me-2" /> {service}
                                        </li>
                                    </div>
                                ))}
                            </ul>
                        )} */}
                    </div>
                    {
                        !linkText?.trim() ? (

                            <></>
                        ) : (

                            <a href={href} className="iot-card__link">
                                {linkText}
                                <span>→</span>
                            </a>
                        )
                    }



                </div>
            )}
        </div>
    );
});

export default ServiceCard;
