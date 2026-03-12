import { useEffect } from 'react';
import { BookOpen, Target, Clock, AlertTriangle, Award, Zap, MessageCircle, Instagram, GraduationCap } from 'lucide-react';
import styles from './Gujcet2026.module.css';

const FACULTY = [
  { name: 'Yagnik Kakadiya', subject: 'Mathematics / Statistics', qualification: 'M.Tech (Structural Engineering), B.Ed.', experience: '8 Years' },
  { name: 'Prashant Gandhi', subject: 'Chemistry', qualification: 'M.Sc., B.Ed.', experience: '12 Years' },
  { name: 'Nikhil Vaghasiya', subject: 'Biology', qualification: 'M.Sc., B.Ed.', experience: '14 Years' },
  { name: 'Mayank Bhatt', subject: 'Biology', qualification: 'M.Sc., B.Ed.', experience: '12 Years' },
  { name: 'Viral Valand', subject: 'Physics', qualification: 'B.E. EC, B.Ed.', experience: '10 Years' },
  { name: 'Rahul Vaghasiya', subject: 'Physics', qualification: 'M.Sc., B.Ed.', experience: '12 Years' },
  { name: 'Priyank Shah', subject: 'Chemistry', qualification: 'B.Sc, M.Sc (Organic Chemistry), B.Ed, JAM', experience: '6 Years' },
];

export default function Gujcet2026() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className={styles.pageWrapper}>

      {/* ===== 1. HERO ===== */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>Gujarat's Most Elite Sprint</div>
          <h1 className={styles.headline}>
            Master GUJCET 2026 in Just 11&nbsp;Days:<br />
            Precision Coaching by Expert Faculty.
          </h1>
          <p className={styles.subHeadline}>
            Short on time? Join Gujarat's most elite 11-day sprint. We turn average scores into 110+ through surgical precision and expert-led strategies.
          </p>
          <a href="#programs" className={styles.ctaButton}>Explore Programs</a>

          <div className={styles.statsRibbon}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>1.17 L+</div>
              <div className={styles.statText}>Aspirants appeared in 2025 - competition is fierce!</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>11 Days</div>
              <div className={styles.statText}>Total syllabus via our 'High-Yield Topic' methodology.</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>90 Sec</div>
              <div className={styles.statText}>Per question. Beat the clock, not just the questions.</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>115+</div>
              <div className={styles.statText}>The "Safe Zone" for DA-IICT, LD College & top seats.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. PROGRAMS ===== */}
      <section id="programs" className={styles.section}>
        <h2 className={styles.sectionTitle}>Elite Programs</h2>
        <div className={styles.programsGrid}>
          <div className={styles.programCard}>
            <h3><Zap size={22} color="#f97316" /> The 11-Day Power Sprint</h3>
            <p>An intensive, 10-hour-a-day program designed for students who want a final, massive boost before the exam.</p>
          </div>
          <div className={styles.programCard}>
            <h3><BookOpen size={22} color="#0e4f8d" /> The Blueprint Batch</h3>
            <p>Comprehensive coverage for 12th-grade students (Boards + GUJCET).</p>
          </div>
          <div className={styles.programCard}>
            <h3><Target size={22} color="#0e4f8d" /> OMR Mastery Test Series</h3>
            <p>11+ Mock Tests with instant AI-driven OMR analysis.</p>
          </div>
        </div>

        <div className={styles.programsGrid} style={{ marginTop: '2rem' }}>
          <div className={styles.programCard} style={{ borderLeft: '5px solid #f97316' }}>
            <h3><Award size={22} color="#f97316" /> Elite Features</h3>
            <ul className={styles.featuresList}>
              <li><strong>Daily OMR Drills:</strong> Real-time simulation to eliminate exam-day nerves.</li>
              <li><strong>The "Final 20" Handbook:</strong> Hand-picked formula sheets for the last 48 hours.</li>
              <li><strong>On-the-Spot Doubt Clearance:</strong> Dedicated hours with senior faculty.</li>
              <li><strong>Score Improvement:</strong> Students historically see a 25–40% jump in final scores vs. initial diagnostic tests.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== 3. DID YOU KNOW ===== */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.realityCheck}>
          <AlertTriangle color="#ea580c" size={48} style={{ marginBottom: '1rem' }} />
          <p>
            "Over 30% of GUJCET candidates lose their dream college seat due to 'panic errors' and negative marking in the final 15 minutes. Our faculty specializes in the 'Elimination &amp; Time-Hack' method to safeguard your rank."
          </p>
        </div>
      </section>

      {/* ===== 4. ABOUT US ===== */}
      <section id="about" className={styles.section}>
        <h2 className={styles.sectionTitle}>Why We Are Different</h2>
        <div className={styles.aboutUsGrid}>
          <div className={styles.aboutLeft}>
            <h2>Beyond Rote Learning - We Build Rankers in Record Time.</h2>
            <p>
              <strong>Our Philosophy:</strong> We don't just teach subjects; we teach the Art of the OMR. When you have 11 days left, you don't need a library - you need a roadmap.
            </p>
            <div className={styles.quoteBox}>
              <p>
                "Our faculty has analyzed over 1,500 past GUJCET questions to curate this 11-day syllabus. We don't teach what's in the book; we teach what's on the paper."
              </p>
            </div>
          </div>

          <div>
            <img
              src="/assets/gujcet/acc-class.jpg"
              alt="Anand Coaching Centre – Admissions Open"
              className={styles.aboutImage}
            />
          </div>
        </div>

        <div className={styles.methodology} style={{ marginTop: '3rem' }}>
          <h3 className={styles.sectionTitle} style={{ fontSize: '1.8rem' }}>The 11-Day Methodology</h3>
          <div className={styles.methodologyGrid}>
            <div className={styles.methodItem}>
              <div className={styles.methodIcon}><Target size={24} /></div>
              <div className={styles.methodContent}>
                <h4>High-Yield Focus</h4>
                <p>We prioritize the 20% of the syllabus that accounts for 80% of the marks.</p>
              </div>
            </div>
            <div className={styles.methodItem}>
              <div className={styles.methodIcon}><AlertTriangle size={24} /></div>
              <div className={styles.methodContent}>
                <h4>Trap-Question Training</h4>
                <p>Our experts show you how to identify questions designed to waste your time.</p>
              </div>
            </div>
            <div className={styles.methodItem}>
              <div className={styles.methodIcon}><Clock size={24} /></div>
              <div className={styles.methodContent}>
                <h4>Pressure Simulation</h4>
                <p>Daily full-length mocks to build the mental stamina for the 3-hour marathon.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 5. SUBJECT STRATEGIES ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Subject Strategies</h2>
        <div className={styles.subjectsGrid}>
          <div className={`${styles.subjectCard} ${styles.physics}`}>
            <div className={styles.subjectTitle}>
              Physics
              <span className={styles.subjectBadge} style={{ background: '#dbeafe', color: '#1d4ed8' }}>The Concept King</span>
            </div>
            <ul className={styles.featuresList}>
              <li><strong>High-Yield:</strong> Electrostatics, Magnetism, Semiconductor Electronics.</li>
              <li><strong>Hack:</strong> 20-Page Formula Handbook - covers 70% of the paper.</li>
              <li>"70% of GUJCET Physics is direct formula application."</li>
            </ul>
          </div>
          <div className={`${styles.subjectCard} ${styles.chemistry}`}>
            <div className={styles.subjectTitle}>
              Chemistry
              <span className={styles.subjectBadge} style={{ background: '#dcfce7', color: '#15803d' }}>The Scoring Booster</span>
            </div>
            <ul className={styles.featuresList}>
              <li><strong>Focus:</strong> Organic Name Reactions, Chemical Kinetics, P-Block.</li>
              <li><strong>Hack:</strong> "30-Second Solves" for Physical Chemistry.</li>
              <li>"A trained student finishes GUJCET Chemistry in 40 minutes."</li>
            </ul>
          </div>
          <div className={`${styles.subjectCard} ${styles.mathsBio}`}>
            <div className={styles.subjectTitle}>
              Maths / Biology
              <span className={styles.subjectBadge} style={{ background: '#ede9fe', color: '#6d28d9' }}>The Rank Decider</span>
            </div>
            <ul className={styles.featuresList}>
              <li><strong>Maths:</strong> Calculus & Vectors - Option-Substitution tricks.</li>
              <li><strong>Biology:</strong> 100% NCERT - memory-palace techniques for classification & physiology.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== COMPARISON TABLE ===== */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <h2 className={styles.sectionTitle}>Why Choose the 11-Day Sprint?</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Self-Study / Regular Classes</th>
                <th>Our 11-Day Expert Sprint</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Syllabus</td><td>Trying to cover everything</td><td><strong>Targeted:</strong> High-Weightage only</td></tr>
              <tr><td>Strategy</td><td>Solve the whole sum</td><td><strong>Shortcuts, Elimination & Approximations</strong></td></tr>
              <tr><td>Testing</td><td>Random practice</td><td><strong>Proctored OMR Mocks</strong> with Faculty Feedback</td></tr>
              <tr><td>Mentorship</td><td>Confusing YouTube videos</td><td><strong>Live, Skilled Faculty</strong> at your service</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== FACULTY SECTION ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Meet Our Expert Faculty</h2>
        <div className={styles.facultyGrid}>
          {FACULTY.map((f) => (
            <div key={f.name} className={styles.facultyCard}>
              <div className={styles.facultyAvatar}>
                {f.name.split(' ').map(w => w[0]).join('')}
              </div>
              <div className={styles.facultyName}>{f.name}</div>
              <div className={styles.facultySubject}>{f.subject}</div>
              <div className={styles.facultyQualification}>{f.qualification}</div>
              <div className={styles.facultyExperience}>{f.experience} Experience</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PROVEN RESULTS ===== */}
      <section className={styles.resultsSection}>
        <div className={styles.resultsContent}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Proven Results - 2024 Science Toppers</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto' }}>
            Our students consistently achieve top scores. Here are a few of our achievers.
          </p>
          <img
            src="/assets/gujcet/success.jpg"
            alt="Anand Coaching Centre – 2024 Science Toppers"
            className={styles.resultsImage}
          />
        </div>
      </section>

      {/* ===== SOCIAL =====
      <section className={styles.socialSection}>
        <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0e4f8d', marginBottom: '0.5rem', textAlign: 'center' }}>Join Our Community</h3>
        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1.1rem', textAlign: 'center', margin: '0 auto 2rem auto', maxWidth: '600px' }}>Get daily tips, hacks, and updates straight to your phone.</p>
        <div className={styles.socialLinks}>
          <a href="#" className={`${styles.socialBtn} ${styles.whatsapp}`}>
            <MessageCircle size={20} /> Join WhatsApp Group
          </a>
          <a href="#" className={`${styles.socialBtn} ${styles.instagram}`}>
            <Instagram size={20} /> Follow on Instagram
          </a>
        </div>
      </section> */}

    </div>
  );
}
