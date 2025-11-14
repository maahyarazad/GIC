
import ServiceCard from "../ServiceCard/ServiceCard";
import './ServiceGrid.css';
import { useRef, useEffect, useState } from 'react';


const ServiceGrid = ({ data, containerTitle, serviceKeyName, gridClass }) => {

    const cardRefs = useRef([]);
    const [visibleCards, setVisibleCards] = useState([]);

    useEffect(() => {
        const options = { threshold: 0.35 };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = cardRefs.current.indexOf(entry.target);
                    if (index !== -1 && !visibleCards.includes(index)) {
                        console.log(`Card ${index} is visible`);
                        setVisibleCards((prev) => [...prev, index]);
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, options);

        cardRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => {
            observer.disconnect(); // Clean up the entire observer
        };
    }, []);

    if (!data) return null;


    return (
        <div className="p-0 p-md-4">
            <h2 className="py-4 text-center service-grid-title">
                <span className="highlighted-word">{containerTitle.split(" ")[0]}</span>{" "}
                {/* {containerTitle.split(" ")[1]}{" "} */}
                {containerTitle.split(" ").slice(2).join(" ")}
            </h2>
            <div className="row service-card-container">
                {data.map((service, index) => (
                    <div className={gridClass} key={index}>
                        <ServiceCard {...service}
                            ref={(el) => (cardRefs.current[index] = el)}
                            className={visibleCards.includes(index) ? 'show' : ''}
                        />
                    </div>
                ))}
            </div>
        </div>
    );

};

export default ServiceGrid;
