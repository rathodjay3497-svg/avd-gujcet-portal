import React from "react";
import { ExternalLink, GraduationCap } from "lucide-react";
import styles from "./Scholarship.module.css";

const SCHOLARSHIPS = [
  {
    id: "01",
    name: "Mukhymantri Yuva Swavlamban Yojna (MYSY Scholarship)",
    link: "https://mysy.guj.nic.in/",
  },
  {
    id: "02",
    name: "Scheduled Caste - S.C. Scholarship",
    link: "https://socialjustice.nic.in/",
  },
  {
    id: "03",
    name: "Scheduled Tribe - S.T. Scholarship",
    link: "https://tribal.nic.in/Home.aspx",
  },
  {
    id: "04",
    name: "Socially and Educationally Backward Class - SEBC Scholarship",
    link: "https://sje.gujarat.gov.in/ddcw/home?lang=english",
  },
  {
    id: "05",
    name: "Merit Cum Means Scholarship (For Minority Caste)",
    link: "https://sje.gujarat.gov.in/ddcw/home?lang=english",
  },
  {
    id: "06",
    name: "AICTE Scholarship (Pragati and Saksham Scholarship)",
    link: "https://www.aicte-pragati-saksham-gov.in/",
  },
  {
    id: "07",
    name: "Prime Minister's Scholarship Scheme (PMSS)",
    link: "http://ksb.gov.in/index.htm",
  },
];

export default function Scholarship() {
  return (
    <section className={styles.scholarshipSection}>
      <div className={styles.scholarshipHeader}>
        <div className={styles.scholarshipIcon}>
          <GraduationCap size={32} color="#2563eb" />
        </div>
        <h2 className={styles.scholarshipTitle}>Scholarship Information for Students</h2>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Scholarship Name</th>
              <th style={{ width: "180px" }}>Official Website</th>
            </tr>
          </thead>
          <tbody>
            {SCHOLARSHIPS.map((item) => (
              <tr key={item.id}>
                <td data-label="Scholarship Name">
                  <span className={styles.scholarshipName}>{item.name}</span>
                </td>
                <td>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.applyLink}
                  >
                    Visit Website
                    <ExternalLink size={14} className={styles.externalIcon} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
