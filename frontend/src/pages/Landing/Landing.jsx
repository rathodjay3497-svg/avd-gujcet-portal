import { Link, useLocation } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvent';
import EventCard from '@/components/events/EventCard/EventCard';
import Loader from '@/components/ui/Loader/Loader';
import styles from './Landing.module.css';
import { useState, useEffect } from 'react';

export default function Landing() {
  const { data: events, isLoading } = useEvents();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#faq') {
      setTimeout(() => {
        document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else if (location.hash === '#events') {
      setTimeout(() => {
        document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span>GUJCET</span><br /> Crash Course 2026
          </h1>
          <p className={styles.heroSubtitle}>
            Prepare Smart, Not Just Hard.
            <br />
            Turn Your Preparation into Selection.
          </p>
          <div className={styles.heroCtas}>
            <a href="#events" className={styles.ctaPrimary}>Register Now</a>
            <Link to="/events/gujcet-2026" className={styles.ctaSecondary}>Learn More</Link>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className={styles.stats}>
        <div className={styles.statsContainer}>
          <StatItem icon="users" value="50+" label="Students Registered" />
          <StatItem icon="calendar" value="3+" label="Events Available" />
          <StatItem icon="award" value="10+" label="Expert Counselors" />
        </div>
      </section>

      {/* Active Events */}
      <section className={styles.events} id="events">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Upcoming Events</h2>
          {isLoading ? (
            <Loader text="Loading events..." />
          ) : events?.length > 0 ? (
            <div className={styles.eventGrid}>
              {events.map((event) => (
                <EventCard key={event.event_id} event={event} />
              ))}
            </div>
          ) : (
            <p className={styles.noEvents}>No active events right now. Check back soon!</p>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks} id="how-it-works">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <div className={styles.steps}>
            <Step number="1" title="Login / Create Account" desc="Log in seamlessly with your Google account to get started in seconds." />
            <Step number="2" title="Complete Your Profile" desc="Fill out your academic and contact details once to save time later." />
            <Step number="3" title="Register Instantly" desc="Browse events and register in just one click to secure your spot." />
          </div>
        </div>
      </section>

      {/* About Us
      <section className={styles.aboutUs} id="about-us">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>About Us</h2>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutContent}>
              <div className={styles.aboutText}>
                <p><strong>Core Focus:</strong> Quality education for Standards 7–12, prioritizing concept-based learning and academic foundations.</p>
                <p><strong>Academic Programs:</strong></p>
                <ul>
                  <li><strong>Std 7-10:</strong> Science, Math, Social Science, and English.</li>
                  <li><strong>Std 11-12:</strong> Dedicated Science and Commerce streams.</li>
                </ul>
                <p><strong>Future-Ready Skills:</strong> Free courses in Python Programming and Robotics to build modern technical literacy.</p>
                <p><strong>Exam Excellence:</strong> Specialized GUJCET Crash Courses led by subject experts for competitive success.</p>
                <p><strong>Why ACC?</strong> Experienced faculty, simplified learning, and a supportive environment designed for confidence.</p>
              </div>
            </div>
            <div className={styles.aboutImageContainer}>
              <img src="/assets/gujcet/369.jpg.jpeg" alt="About Anand Coaching Centre" className={styles.aboutImage} />
            </div>
          </div>
        </div>
      </section> */}

      {/* FAQ */}
      {/* <section className={styles.faqSection} id="faq">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqList}>
            <FaqItem question="Is the counseling really free?" answer="Yes! Our counseling sessions are completely free of charge. We aim to help every GUJCET student make informed decisions." />
            <FaqItem question="Do I need to login to register?" answer="No. You can register for events directly without creating an account. Login is only needed if you want to view your profile or use one-click registration." />
            <FaqItem question="What do I need to bring to the event?" answer="Carry a printed or digital copy of your admit card (PDF), along with a valid photo ID. Arrive 30 minutes before the scheduled time." />
            <FaqItem question="Can I register for multiple events?" answer="Yes, you can register for as many events as you want, as long as seats are available." />
          </div>
        </div>
      </section> */}

      {/* CTA Banner */}
      {/* <section className={styles.ctaBanner}>
        <div className={styles.container}>
          <h2>Ready to get counseled?</h2>
          <p>Register for free today and take the first step toward your dream college.</p>
          <a href="#events" className={styles.ctaPrimary}>Register Now</a>
        </div>
      </section> */}
    </div>
  );
}

function StatItem({ icon, value, label }) {
  const icons = {
    users: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
    calendar: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    award: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>,
  };

  return (
    <div className={styles.statItem}>
      <span className={styles.statIcon}>{icons[icon]}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function Step({ number, title, desc }) {
  return (
    <div className={styles.step}>
      <div className={styles.stepNumber}>{number}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`${styles.faqItem} ${open ? styles.open : ''}`}>
      <button className={styles.faqQuestion} onClick={() => setOpen(!open)}>
        <span>{question}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.faqArrow}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div className={styles.faqAnswer}>
        <p>{answer}</p>
      </div>
    </div>
  );
}
