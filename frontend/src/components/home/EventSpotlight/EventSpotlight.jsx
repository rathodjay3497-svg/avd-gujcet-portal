import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './EventSpotlight.module.css';

export default function EventSpotlight({ events }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [itemsVisible, setItemsVisible] = useState(3);
  
  // Filter events that have an image
  const featuredEvents = events?.filter(e => e.image_url && e.status === 'active') || [];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsVisible(1);
      else if (window.innerWidth < 1024) setItemsVisible(2);
      else setItemsVisible(3);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (featuredEvents.length <= itemsVisible || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        return nextIndex > featuredEvents.length - itemsVisible ? 0 : nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredEvents.length, itemsVisible, isPaused]);

  if (featuredEvents.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      return nextIndex > featuredEvents.length - itemsVisible ? 0 : nextIndex;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev - 1;
      return nextIndex < 0 ? featuredEvents.length - itemsVisible : nextIndex;
    });
  };

  const showControls = featuredEvents.length > itemsVisible;
  const gap = 24; // should match CSS gap

  return (
    <section className={styles.spotlight}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.badge}>Featured Series</span>
          <h2 className={styles.title}>Event Spotlight</h2>
          <p className={styles.subtitle}>
            Discover transformative experiences designed to nourish your spirit and connect you with like-minded youth in our community.
          </p>
        </div>

        <div 
          className={styles.carousel}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {showControls && (
            <>
              <button className={`${styles.navBtn} ${styles.prev}`} onClick={prevSlide} aria-label="Previous">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              
              <button className={`${styles.navBtn} ${styles.next}`} onClick={nextSlide} aria-label="Next">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </>
          )}

          <div className={styles.trackWrapper}>
            <div 
              className={styles.track} 
              style={{ 
                transform: `translateX(calc(-${currentIndex} * (100% / ${itemsVisible}) - ${currentIndex * (gap / itemsVisible)}px))`,
              }}
            >
              {featuredEvents.map((event) => (
                <div 
                  key={event.event_id} 
                  className={styles.slide} 
                  style={{ 
                    width: `calc((100% - ${(itemsVisible - 1) * gap}px) / ${itemsVisible})` 
                  }}
                >
                  <div className={styles.card}>
                    <div className={styles.imageContainer}>
                      <img src={event.image_url} alt={event.title} className={styles.image} />
                    </div>
                    <div className={styles.footer}>
                      <Link to={`/events/${event.event_id}/register`} className={styles.registerBtn}>
                        Register Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showControls && (
            <div className={styles.indicators}>
              {Array.from({ length: featuredEvents.length - itemsVisible + 1 }).map((_, index) => (
                <button
                  key={index}
                  className={`${styles.indicator} ${index === currentIndex ? styles.active : ''}`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
