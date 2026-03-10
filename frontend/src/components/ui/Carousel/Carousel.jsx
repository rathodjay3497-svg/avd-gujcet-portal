import { useState, useEffect } from 'react';
import styles from './Carousel.module.css';

const images = [
    '/assets/carousel-1.jpg',
    '/assets/carousel-2.jpg',
    '/assets/carousel-3.jpg',
];

export default function Carousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={styles.carouselContainer}>
            <div
                className={styles.carouselTrack}
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((img, i) => (
                    <div key={i} className={styles.carouselSlide}>
                        <img src={img} alt={`Slide ${i + 1}`} />
                    </div>
                ))}
            </div>
            <div className={styles.indicators}>
                {images.map((_, i) => (
                    <button
                        key={i}
                        className={(i === currentIndex) ? styles.activeDot : styles.dot}
                        onClick={() => setCurrentIndex(i)}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
