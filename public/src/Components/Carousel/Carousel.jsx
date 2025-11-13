import React, { useState, useRef, useEffect, useMemo } from 'react';
import './Carousel.css'; // import your styles

const Carousel = ({ items, itemsPerPage, gap}) => {
 const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  const [slideWidth, setSlideWidth] = useState(0);
  const [visibleItems, setVisibleItems] = useState(itemsPerPage);

  // ✅ Dynamically adjust visible slides based on screen width
  useEffect(() => {
    const updateVisibleItems = () => {
      const width = window.innerWidth;
      if (width < 576) setVisibleItems(1);       // mobile
      else if (width < 992) setVisibleItems(2);  // tablet
      else setVisibleItems(itemsPerPage);        // desktop
    };

    updateVisibleItems();
    window.addEventListener('resize', updateVisibleItems);
    return () => window.removeEventListener('resize', updateVisibleItems);
  }, [itemsPerPage]);

  // ✅ Calculate slide width (based on container size and gaps)
  useEffect(() => {
    const updateWidth = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const totalGap = gap * (visibleItems - 1);
      const width = (containerWidth - totalGap) / visibleItems;
      setSlideWidth(width);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [visibleItems, gap]);

  // ✅ Compute max index (reactive)
  const maxIndex = useMemo(
    () => Math.max(0, items.length - visibleItems),
    [items.length, visibleItems]
  );

  // ✅ Navigation functions
  const goPrev = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const goNext = () => setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));


    return (
        <div className="carousel-wrapper">
            <div
                ref={containerRef}
                className="carousel-container"
            >
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
                            style={{ minWidth: slideWidth }}
                        >
                            <a
                                href={item.href}
                                title={item.title}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
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

            <button
                onClick={goPrev}
                aria-label="Previous"
                className="carousel-btn carousel-btn-prev"
            >
                ‹
            </button>

            <button
                onClick={goNext}
                aria-label="Next"
                className="carousel-btn carousel-btn-next"
            >
                ›
            </button>
        </div>

    );
};

export default Carousel;
