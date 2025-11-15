import React, { useEffect, useRef, useState } from 'react';
import HomeSlider from './Components/HomeSlider/HomeSlider';
import ServiceGrid from './Components/ServiceGrid/ServiceGrid';
import TestimonialCarousel from './Components/TestemonialCarousel/TestemonialCarousel';
import ContactUsForm from './Components/ContactUsForm/ContactUsForm'
import ParticleJsContainer from './Components/ParticleJsContainer/ParticleJsContainer';
import ImageSlider from './Components/Carousel/Carousel';
import Carousel from './Components/Carousel/Carousel';
// import TypeWriter from './Components/TypeWriter/TypeWriter';
// import ShowCases from './Components/ShowCases/ShowCases';
import UseInView from './Hooks/UseInView';
import FloatingSocialMedia from './Components/FloatingSocialMedia/FloatingSocialMedia';
import SlidingDownImage from './Assets/back.png';
import SlidingDownImageInvert from './Assets/front.png';

import HeroSection from './Components/Sample';
import EmirStyleHero from './Components/Sample';


const Home = ({ siteData }) => {

    const [ref, isVisible] = UseInView();
    const [_ref, _isVisible] = UseInView();


    const [_ref1, _isVisible1] = UseInView({ delay: 300 });
    const [_ref2, _isVisible2] = UseInView({ delay: 500 });
    const [_ref3, _isVisible3] = UseInView({ delay: 700 });


    const [_ref7, _isVisible7] = UseInView({ delay: 700 });
    const [_ref4, _isVisible4] = UseInView({ delay: 300 });
    const [_ref5, _isVisible5] = UseInView({ delay: 500 });
    const [_ref6, _isVisible6] = UseInView({ delay: 700 });

    const [_ref10, _isVisible10] = UseInView();
    const [_ref11, _isVisible11] = UseInView();



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

    const [topValue, setTopValue] = useState(0);

    useEffect(() => {
        if (!_isVisible10) return


        let i = 5;
        const interval = setInterval(() => {
            while (i < 101){
                setTopValue(i);
                i++;
break;
            }
        }, 25);

        return () => clearInterval(interval);
    }, [_isVisible10]);


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


            <FloatingSocialMedia size={18} />





            <div className="container mx-auto px-4 py-6 my-6" id="section-3" style={{ marginTop: '10vh', marginBottom: '10vh' }}>
                <div
                    ref={_ref}
                    className={`slide-down ${_isVisible ? "visible" : ""}`}
                >
                    <div className="row align-items-center">
                        {/* Text Column */}
                        <div className="col-12 col-md-6 text-center text-md-start mb-4 mb-md-0">
                            <h2
                                ref={_ref1}
                                className={`fs-1 pb-3 slide-down ${_isVisible1 ? "visible" : ""}`} >{siteData.aboutUs.header}</h2>
                            <h3
                                ref={_ref2}
                                className={`fs-4 pb-3 slide-down  contrast-color ${_isVisible2 ? "visible" : ""}`}>{siteData.aboutUs.title}</h3>
                            <h5
                                ref={_ref3}
                                className={`fs-4 pb-3 slide-down ${_isVisible3 ? "visible" : ""}`} style={{ lineHeight: 2 }}>{siteData.aboutUs.description}</h5>
                        </div>

                        {/* Image Column */}
                        <div className="col-12 col-md-6 d-flex justify-content-center">
                            <img
                                src="https://placehold.co/500x500"
                                alt={siteData.aboutUs.header}
                                className="img-fluid rounded shadow"
                            />
                        </div>
                    </div>
                </div>
            </div>



            <div className="container mx-auto px-4 py-6 my-6" id="section-2" style={{ marginTop: '10vh', marginBottom: '10vh' }}>
                <div
                    ref={ref}
                    className={`slide-down ${isVisible ? "visible" : ""}`}
                >
                    <div className="row justify-content-center align-items-center">
                        {/* Header + Description */}
                        <div className="col-12 text-center mb-4">
                            <h2 className="fs-4 pb-2 contrast-color">
                                {siteData.advisorySection.header}
                            </h2>
                            <h4 className="fs-2 pb-3">
                                {siteData.advisorySection.description}
                            </h4>
                        </div>

                        {/* Carousel */}
                        <div className="col-12">
                            <Carousel items={siteData.advisoryItems} itemsPerPage={3} gap={15} />
                        </div>
                    </div>
                </div>
            </div>





            <div className="container mx-auto px-4 py-6 my-6" id="section-4" style={{ marginTop: '10vh', marginBottom: '10vh' }}>
                <div
                    ref={_ref7}
                    className={`slide-down ${_isVisible7 ? "visible" : ""}`}
                >
                    <div className="row align-items-center">
                        {/* Image Column */}
                        <div className="col-12 col-md-6 d-flex justify-content-center">
                            <img
                                src="https://placehold.co/500x500"
                                alt={siteData.aboutUs.header}
                                className="img-fluid rounded shadow"
                            />
                        </div>
                        {/* Text Column */}
                        <div className="col-12 col-md-6 text-center text-md-start mb-4 mb-md-0  mt-lg-0 mt-5">
                            <h2
                                ref={_ref4}
                                className={`fs-1 pb-3 slide-down ${_isVisible4 ? "visible" : ""}`} >{siteData.aboutUs.header}</h2>
                            <h3
                                ref={_ref5}
                                className={`fs-4 pb-3 slide-down  contrast-color ${_isVisible5 ? "visible" : ""}`}>{siteData.aboutUs.title}</h3>
                            <h5
                                ref={_ref6}
                                className={`fs-4 pb-3 slide-down ${_isVisible6 ? "visible" : ""}`} style={{ lineHeight: 2 }}>{siteData.aboutUs.description}</h5>
                        </div>

                    </div>
                </div>
            </div>



            <div
                id="section-4"
                ref={_ref10}
                className={`position-relative slide-down ${_isVisible10 ? "visible" : ""}`}
                style={{
                    marginTop: "10vh",
                    
                    position: "relative",
                    height: "100vh",     // ❗ responsive height
                    width: "100%",       // ❗ responsive width
                    maxHeight: "1080px", // optional cap for desktop
                    overflow: "hidden",
                }}
            >

                {/* BACKGROUND IMAGE */}
                <div className='d-flex justify-content-center align-items-center'
                    style={{
                        backgroundImage: `url(${SlidingDownImage})`,
                        backgroundSize: "cover",    // important for mobile
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        position: "absolute",
                        
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 1,
                    }}
                >

                     {/* Text Column */}
                        <div className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center text-center text-md-start mb-4 mb-md-0  mt-lg-0 mt-5">
                            <h2
                                
                                className={`contrast-color`} style={{paddingTop: '20rem', fontSize: '4rem'}}>{siteData.heroSection.header}</h2>
                            <h3
                               
                                className={`fs-4  text-white pt-5`} style={{fontWeight: 900}}>{siteData.heroSection.title}</h3>
                            <h5
                               
                                className={`fs-4  text-white pt-5`} style={{ lineHeight: 2 }}>{siteData.heroSection.description}</h5>
                        </div>

                </div>

                {/* SLIDING IMAGE */}
                <div
                    style={{
                        backgroundImage: `url(${SlidingDownImageInvert})`,
                        backgroundSize: "cover",    // important for mobile
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        position: "absolute",
                        top: `${topValue}%`,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 2,                  // should be above background
                        transition: "top 0.4s linear",
                    }}
                />

            </div>
                      <div
                id="section-4"
                ref={_ref11}
                className={`position-relative`}
                style={{
                    backgroundColor:'black',
                    
                    marginBottom: "10vh",
                    position: "relative",
              
                    width: "100%",       // ❗ responsive width
                    // maxHeight: "1080px", // optional cap for desktop
                    // overflow: "hidden",
                }}
            >

                      <div className="">
                <ServiceGrid
                    data={siteData.serviceCards_1}
                    containerTitle={siteData.serviceCards_1_title}
                    serviceKeyName={"serviceCards_1"}
                    gridClass={"col-12 col-xl-3 px-0"} />
                 </div>
            </div>




        </div>
    );
};

export default Home;
