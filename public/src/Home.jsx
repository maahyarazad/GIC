import React, { useEffect, useRef, useState } from 'react';
import HomeSlider from './Components/HomeSlider/HomeSlider';
import ServiceGrid from './Components/ServiceGrid/ServiceGrid';
import TestimonialCarousel from './Components/TestemonialCarousel/TestemonialCarousel';
import ContactUsForm from './Components/ContactUsForm/ContactUsForm'
import ParticleJsContainer from './Components/ParticleJsContainer/ParticleJsContainer';
// import TypeWriter from './Components/TypeWriter/TypeWriter';
// import ShowCases from './Components/ShowCases/ShowCases';


const Home = ({ siteData }) => {

    useEffect(() => { }, [siteData]);
    const silderRefs = useRef([]);
    const [visibleSliders, setVisibleSliders] = useState([]);
    useEffect(() => {
        const options = { threshold: 0.35 };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = silderRefs.current.indexOf(entry.target);
                    if (index !== -1 && !visibleSliders.includes(index)) {
                        // console.log(`Card ${index} is visible`);
                        setVisibleSliders((prev) => [...prev, index]);
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, options);

        silderRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => {
            observer.disconnect(); // Clean up the entire observer
        };
    }, []);


    if (!siteData) return null;

    return (
        <div>
            <ParticleJsContainer />
            {siteData.homeSliders.map((slider, index) => (
                <HomeSlider
                    key={slider.id}
                    id={`home-slide-${slider.id}`}
                    title={slider.title}
                    text={slider.text}
                    siteData={siteData.getStarted}
                    // image={slider.image}
                    className={visibleSliders.includes(index) ? 'show' : ''}
                    ref={(el) => (silderRefs.current[slider.id - 1] = el)}
                />
            ))}

            {/* <TypeWriter /> */}

            <div className="container mx-auto px-4 py-4" id="section-1">
                <ServiceGrid
                    data={siteData.serviceCards_1}
                    containerTitle={siteData.serviceCards_1_title}
                    serviceKeyName={"serviceCards_1"}
                    gridClass={"col-12 col-sm-6 col-lg-4 mb-4"} />
            </div>

            {/* <div className="container mx-auto px-4 py-4" id="section-2">
                <ShowCases />
            </div> */}

            {/* <div className="container mx-auto px-4 py-4">
                <TestimonialCarousel data={siteData.testimonials} />
            </div> */}

            <div className="container mx-auto px-4 py-4">
                <ServiceGrid
                    data={siteData.serviceCards_2}
                    containerTitle={siteData.serviceCards_2_title}
                    serviceKeyName={"serviceCards_2"}
                    gridClass={"col-12 col-sm-6 col-lg-6 mb-4"} />
            </div>


        </div>
    );
};

export default Home;
