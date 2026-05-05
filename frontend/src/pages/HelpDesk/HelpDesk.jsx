import React from "react";
import { Link } from "react-router-dom";
import { Phone, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { helpDeskAPI } from "@/services/api";
import styles from "./HelpDesk.module.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isUrl(s) {
  if (!s || typeof s !== "string") return false;
  return s.startsWith("http://") || s.startsWith("https://");
}

/** Display logic: empty or missing date → "Announce Soon" */
function displayDate(date) {
  if (!date || date.trim() === "") {
    return <span className={styles.comingSoon}>Announce Soon</span>;
  }
  return date;
}

const SORT_OPTIONS = [
  { value: 'custom', label: 'Custom Order' },
  { value: 'alpha', label: 'Alphabetical (A-Z)' },
  { value: 'date', label: 'Start Date (earliest first)' },
  { value: 'recent', label: 'Recently Added' },
];

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className={styles.skeletonRow}>
      <td><div className={styles.skeletonCell} style={{ width: "80%" }} /></td>
      <td><div className={styles.skeletonCell} style={{ width: "70%" }} /></td>
      <td><div className={styles.skeletonCell} style={{ width: "90%" }} /></td>
      <td><div className={styles.skeletonCell} style={{ width: "60%" }} /></td>
      <td><div className={styles.skeletonCell} style={{ width: "60%" }} /></td>
      <td><div className={styles.skeletonCell} style={{ width: "50%", margin: "0 auto" }} /></td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HelpDesk() {

  const { data: tableData = [], isLoading } = useQuery({
    queryKey: ["helpdesk-entries"],
    queryFn: async () => {
      const { data } = await helpDeskAPI.list();
      return data;
    },
    // staleTime: 0 (default) — refetches fresh data on every page mount/refresh
  });

  const { data: settingsData } = useQuery({
    queryKey: ["helpdesk-settings"],
    queryFn: async () => {
      const { data } = await helpDeskAPI.getSettings();
      return data;
    },
  });

  const [sortBy, setSortBy] = useState("custom");

  useEffect(() => {
    if (settingsData?.default_sort) {
      setSortBy(settingsData.default_sort);
    }
  }, [settingsData]);

  const sortedData = useMemo(() => {
    const list = [...tableData];
    switch (sortBy) {
      case 'alpha':
        return list.sort((a, b) => a.body.localeCompare(b.body));
      case 'date':
        return list.sort((a, b) => {
          const hasA = a.start_date && a.start_date.trim() !== '';
          const hasB = b.start_date && b.start_date.trim() !== '';
          if (hasA && !hasB) return -1;
          if (!hasA && hasB) return 1;
          if (!hasA && !hasB) return 0;
          return a.start_date.localeCompare(b.start_date);
        });
      case 'recent':
        return list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      case 'custom':
      default:
        return list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
  }, [tableData, sortBy]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <h1 className={styles.title}>
          <span className={styles.freeBadge}>FREE</span>
          Admission Help Desk
        </h1>

        <p className={styles.subtitle}>
          Your complete admission guide in one place.
        </p>

        <p className={styles.description}>
          Stay tuned! We are collecting and organizing admission information from various universities to help you easily track important dates, eligibility, and application links. All in one place.
        </p>

        {/* ── Admission Help Desk Hero ── */}
        <div className={styles.heroSection}>
          <div className={styles.heroLeft}>
            <img
              src="/assets/admission/admission-desk.jpg"
              alt="Suhrad Youths Admission Help Desk"
              className={styles.heroMainImage}
            />
          </div>

          <div className={styles.heroRight}>
            <h2 className={styles.heroHeadline}>
              🎓 Confused about college admissions after 10th or 12th?
            </h2>
            <p className={styles.heroTagline}>
              Get <strong>free expert guidance</strong> at the <strong>Suhrad Youths Anand Admission Help Desk!</strong> 🚀
            </p>

            <div className={styles.helpList}>
              <h3 className={styles.helpListTitle}>We help with:</h3>
              <ul>
                <li>✅ Choosing the right <strong>Branch &amp; College</strong></li>
                <li>✅ <strong>ACPC, VQ, &amp; MQ</strong> processes</li>
                <li>✅ <strong>TFWS, EWS, &amp; NCL</strong> document checklist</li>
              </ul>
            </div>

            <div className={styles.heroContactRow}>
              <div className={styles.heroContactCard}>
                <Phone size={18} strokeWidth={2} />
                <div>
                  <a href="tel:+919712596203">+91 97125 96203</a>
                  <a href="tel:+918000130500">+91 80001 30500</a>
                </div>
              </div>
              <div className={styles.heroContactCard}>
                <span className={styles.globeIcon}>🌐</span>
                <a href="https://suhradyouths.hpparam.com" target="_blank" rel="noopener noreferrer">
                  suhradyouths.hpparam.com
                </a>
              </div>
            </div>

            <div className={styles.heroBtnRow}>
              <Link to="/admission-2026/register" className={styles.registerBtn}>
                📝 Register Now
              </Link>
              <a
                href="https://chat.whatsapp.com/G7FuTO8iHn80ouTCkhkKUo?mode=hqctswa"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappBtn}
              >
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#25D366" /><path d="M23.4 8.6A10.2 10.2 0 0 0 16 5.8C10.4 5.8 5.8 10.4 5.8 16c0 1.8.5 3.6 1.4 5.2L5.6 26.8l5.8-1.5A10.2 10.2 0 0 0 16 26.2c5.6 0 10.2-4.6 10.2-10.2 0-2.7-1.1-5.3-2.8-7.4zM16 24.4a8.4 8.4 0 0 1-4.3-1.2l-.3-.2-3.4.9.9-3.3-.2-.3A8.5 8.5 0 0 1 7.6 16c0-4.6 3.8-8.4 8.4-8.4 2.3 0 4.4.9 6 2.4a8.3 8.3 0 0 1 2.4 6c0 4.7-3.8 8.4-8.4 8.4zm4.6-6.3c-.3-.1-1.6-.8-1.8-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1-.2.1-.4.2-.7 0-.3-.1-1.2-.4-2.3-1.4a8.5 8.5 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6.2-.4v-.4l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.2.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.1.2-1.2 0-.1-.3-.2-.6-.3z" fill="#fff" /></svg>
                Join WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className={styles.tableToolbar}>
          <div className={styles.sortContainer}>
            <label htmlFor="public-sort" className={styles.sortLabel}>Sort By:</label>
            <div className={styles.selectWrapper}>
              <select
                id="public-sort"
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className={styles.selectIcon} size={16} />
            </div>
          </div>
          <div className={styles.entryCount}>
            Showing <strong>{sortedData.length}</strong> entries
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>

            <thead>
              <tr>
                <th>Governing Body / University</th>
                <th>Course</th>
                <th>Eligibility</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Registration Link</th>
              </tr>
            </thead>

            <tbody>

              {isLoading ? (
                // Show 6 skeleton rows while fetching
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.comingSoon} style={{ padding: "2rem", textAlign: "center" }}>
                    Admission data will be updated soon. Check back shortly!
                  </td>
                </tr>
              ) : (
                sortedData.map((row, index) => {
                  const url1 = isUrl(row.link) ? row.link : null;
                  const url2 = isUrl(row.link2) ? row.link2 : isUrl(row["link 2"]) ? row["link 2"] : null;
                  const linkAsText = row.link && !url1 ? row.link : null;

                  return (
                    <tr key={row.entry_id || index}>
                      <td>{row.body}</td>

                      <td>
                        <span className={styles.courseBadge}>
                          {row.course.split('\n').map((line, i, arr) => (
                            <React.Fragment key={i}>
                              {line}
                              {i < arr.length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </span>
                      </td>

                      <td>{row.eligibility}</td>

                      <td>{displayDate(row.start_date)}</td>

                      <td>{displayDate(row.end_date)}</td>

                      <td>
                        <div className={styles.linkContent}>
                          {linkAsText && <span className={styles.linkText}>{linkAsText}</span>}

                          <div className={styles.buttonGroup}>
                            {url1 && (
                              <a href={url1} target="_blank" rel="noopener noreferrer" className={styles.actionButton}>
                                Apply Now
                              </a>
                            )}
                            {url2 && (
                              <a href={url2} target="_blank" rel="noopener noreferrer" className={styles.actionButtonOutline}>
                                Details
                              </a>
                            )}
                          </div>

                          {!url1 && !url2 && !linkAsText && <span className={styles.comingSoon}>—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

            </tbody>
          </table>
        </div>

        <div className={styles.careerSection}>

          <h2 className={styles.careerTitle}>
            Explore Career Paths After 12th
          </h2>

          <p className={styles.careerText}>
            This guide helps students understand different career options available after completing their studies. You can explore fields like Engineering, Medical, Commerce, Humanities and many more.
          </p>

          <div className={styles.imageContainer}>
            <img
              src="/assets/career-guide.jpg"
              alt="Career options after 12th"
              className={styles.careerImage}
            />
          </div>

        </div>


      </div>
    </div>
  );
}