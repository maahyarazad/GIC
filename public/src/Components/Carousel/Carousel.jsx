import React, { useState, useRef, useEffect, useMemo } from 'react';
import './Carousel.css'; // Make sure to add the styles from below or your own

const Carousel = ({ items, itemsPerPage, gap = 16 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef(null);
    const [slideWidth, setSlideWidth] = useState(0);
    const [visibleItems, setVisibleItems] = useState(itemsPerPage);

    // Adjust visible items on window resize (responsive)
    useEffect(() => {
        const updateVisibleItems = () => {
            const width = window.innerWidth;
            if (width < 576) setVisibleItems(1);
            else if (width < 1500) setVisibleItems(2);
            else setVisibleItems(itemsPerPage);
        };

        updateVisibleItems();
        window.addEventListener('resize', updateVisibleItems);
        return () => window.removeEventListener('resize', updateVisibleItems);
    }, [itemsPerPage]);

    // Calculate slide width based on container width and gaps
    useEffect(() => {
        const updateWidth = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.clientWidth;
            const totalGap = gap * (visibleItems - 1);
            const width = visibleItems === 1
                ? containerWidth              // full width on mobile
                : (containerWidth - totalGap) / visibleItems;
            setSlideWidth(width);
        //     console.log(`containerWidth ==== ${containerWidth}`);
          
        //   console.log(`visibleItems ==== ${visibleItems}`);
        //   console.log(`totalGap ==== ${totalGap}`);
        //   console.log(`width ==== ${width}`);
        };

        

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, [visibleItems, gap]);

    // Calculate max possible index for navigation
    const maxIndex = useMemo(() => Math.max(0, items.length - visibleItems), [items.length, visibleItems]);

    // Navigation handlers
    const goPrev = () => {
        if(currentIndex === 0) return;
        setCurrentIndex(prev => (prev - 1));
    };

    const goNext = () => {
        console.log(`currentIndex ==== ${currentIndex}`);
        console.log(`maxIndex ==== ${maxIndex}`);
        console.log(`visibleItems ==== ${visibleItems}`);
        console.log(`gap ==== ${gap}`);
        console.log(`slideWidth ==== ${slideWidth}`);
        console.log(`containerRef.current.clientWidth ==== ${containerRef.current.clientWidth}`);
        console.log(`maxIndex ==== ${maxIndex}`);

        if(currentIndex === maxIndex) return;
        setCurrentIndex(prev => (prev + 1));
    };
    return (
        <>
            <div className="carousel-wrapper">
                <div ref={containerRef} className="carousel-container">
                    <div
                        className="carousel-track"
                        style={{
                            transform: `translateX(-${currentIndex * (slideWidth + gap)}px)`,
                        }}
                    >
                        {items.map((item, idx) => (
                            <div
                                key={idx}
                                className="carousel-slide"
                                style={{ minWidth: slideWidth, maxWidth: containerRef?.current?.clientWidth }}
                            >
                                <a href={item.href} title={item.title} target="_blank" rel="noopener noreferrer">
                                    <picture>
                                        {item.sources?.map(({ media, srcSet }, i) => (
                                            <source key={i} media={media} srcSet={srcSet} />
                                        ))}
                                        <div className="content">
                                            <img src={item.imgSrc} alt={item.title} title={item.title} />
                                            <h3>{item.title}</h3>
                                            <p>{item.description}</p>
                                        </div>
                                    </picture>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={goPrev} aria-label="Previous" type='button' className="carousel-btn carousel-btn-prev" >
                    ‹
                </button>
                <button onClick={goNext} aria-label="Next" type='button' className="carousel-btn carousel-btn-next" >
                    ›
                </button>
            </div>
        </>
    );
};

export default Carousel;
