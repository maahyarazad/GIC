
import Slider from 'react-slick'; 
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css'; 
import './TestemonialCarousel.css';

const TestimonialCarousel = ({ data }) => {
    if (!data) return null

    const settings = {
        dots: true, // Show navigation dots
        infinite: true, // Loop through slides
        speed: 500, // Transition speed in ms
        slidesToShow: 1, // Number of slides to show at once
        slidesToScroll: 1, // Number of slides to scroll per navigation
        draggable: true, // Enable drag feature
        touchThreshold: 10, // Touch sensitivity for swipe
        autoplay: true, // Enable auto change
        autoplaySpeed: 3000, // Time between slide transitions in ms (3 seconds)
        arrows: false,
        //  prevArrow: (
        //     <div className="custom-arrow prev-arrow">
        //         <span>←</span>
        //     </div>
        // ), 
        // nextArrow: (
        //     <div className="custom-arrow next-arrow">
        //         <span>→</span>
        //     </div>
        // ),
        responsive: [
            {
            breakpoint: 1024,
            settings: {
                slidesToShow: 1,
                centerMode: false,   // disable center mode on smaller screens if needed
            }
            },
            {
            breakpoint: 768,
            settings: {
                slidesToShow: 1,
                centerMode: false,
            }
            }
        ]
    };


    return (
        <Slider {...settings}> {/* Use Slider component from react-slick */}
            {data.map((testimonial, index) => (
                <div key={index} className="testimonial-slide">
                    <div className="testimonial-left-content">
                        <div className="testimonial-review-text">
                            <p className="testimonial-paragraph">{testimonial.review}</p>
                            <p className="testimonial-paragraph">{testimonial.additionalInfo}</p>
                        </div>
                    </div>
                    <div className="testimonial-right-content">
                        <div className="testimonial-author-data">
                            <img
                                loading="lazy"
                                src={testimonial.authorImage}
                                alt="Customer"
                                className="testimonial-author-photo"
                            />
                            <div className="testimonial-author-text">
                                <div className="testimonial-author-name">{testimonial.authorName}</div>
                                <div className="testimonial-author-position">{testimonial.authorPosition}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </Slider>
    );
};

export default TestimonialCarousel;
