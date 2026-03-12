import React from "react";
import { Phone, Mail, Instagram } from "lucide-react";
import styles from "./HelpDesk.module.css";

function isUrl(s) {
  if (!s || typeof s !== "string") return false;
  return s.startsWith("http://") || s.startsWith("https://");
}

export default function HelpDesk() {

    const tableData = [
        {
        body:"ACPC",
        course:"Degree Engineering",
        eligibility:"12th Pass (PCM)",
        start:"Announce Soon",
        end:"Announce Soon",
        link:"https://admissions.nic.in/guj/applicant/root/Home.aspx?enc=Whdrh1xpp+TaLXcctX7fe8QUh58zhuE9OgK39v/MczqTJPsmhkIe7N1+S0BDwMeTJWxwaLJ/8nscAtbGqcVQpw=="
        },
        {
        body:"ACPC",
        course:"Degree Pharmacy",
        eligibility:"12th Pass (PCM) / 12th Pass (PCB)",
        start:"Announce Soon",
        end:"Announce Soon",
        link:"https://admissions.nic.in/guj/applicant/root/Home.aspx?enc=Whdrh1xpp+TaLXcctX7fe8QUh58zhuE9OgK39v/MczqTJPsmhkIe7N1+S0BDwMeTJWxwaLJ/8nscAtbGqcVQpw=="
        },
        {
        body:"ACPC",
        course:"D2D Admission (Diploma to Degree)",
        eligibility:"Diploma Last Year",
        start:"Announce Soon",
        end:"Announce Soon",
        link:"https://admissions.nic.in/guj/applicant/root/Home.aspx?enc=Whdrh1xpp+TaLXcctX7fe8QUh58zhuE9OgK39v/MczqTJPsmhkIe7N1+S0BDwMeTJWxwaLJ/8nscAtbGqcVQpw==",
        link2: "https://cdnbbsr.s3waas.gov.in/s35938b4d054136e5d59ada6ec9c295d7a/uploads/2025/05/2025051993.pdf"
        },
        {
        body:"CVM, V.V.Nagar",
        course:"Degree Engineering & All Other Courses",
        eligibility:"12th Pass (PCM)",
        start:"2-Apr-2025",
        end:"Announce Soon",
        link:"https://admissions.cvmu.edu.in/"
        },
        {
        body:"CHARUSAT, Changa",
        course:"All Courses",
        eligibility:"12th Pass (PCM) / 12th Pass (PCB)",
        start:"2-Apr-2025",
        end:"Not Declared",
        link:"https://admission.charusat.ac.in/Registration.aspx"
        },
        {
        body:"DDU, Nadiad",
        course:"Degree Engineering",
        eligibility:"12th Pass (PCM)",
        start:"2-Apr-2025",
        end:"Not Declared",
        link:"https://ddu.ac.in/"
        },
        {
        body:"DAIICT, Gandhinagar",
        course:"Degree Engineering",
        eligibility:"12th Pass (PCM)",
        start:"3-Apr-2025",
        end:"9-Jun-2025",
        link:"https://applyadmission.net/DA-IICT2025/"
        },
        {
        body:"PDPU, Gandhinagar",
        course:"Degree Engineering",
        eligibility:"12th Pass (PCM)",
        start:"1-Jan-2025",
        end:"Announce Soon",
        link:"https://pdpu.nopaperforms.com/b-tech-application-form"
        },
        {
        body:"Nirma University, Ahmedabad",
        course:"Degree Engineering",
        eligibility:"12th Pass (PCM)",
        start:"Announce Soon",
        end:"Announce Soon",
        link:"https://pdpu.nopaperforms.com/b-tech-application-form"
        },
        {
        body:"SVNIT, Surat",
        course:"Degree Engineering",
        eligibility:"12th Pass (PCM)",
        start:"Announce Soon",
        end:"Announce Soon",
        link:"https://josaa.nic.in/"
        },
        {
        body:"GCAS",
        course:"All other courses (B.Com, BCA, BBA, B.Sc, BA, B.Ed, B.Sw, etc.)",
        eligibility:"12th Pass",
        start:"29-May-2025",
        end:"Announce Soon",
        link:"https://gcas.gujgov.edu.in/index.aspx"
        },
        {
        body:"Agricultural University",
        course:"All Undergraduate Courses",
        eligibility:"12th Pass (PCM) / 12th Pass (PCB)",
        start:"22-May-2025",
        end:"Announce Soon",
        link:"https://ug.gsauca.in/",
        link2:"https://ug.gsauca.in/Images/News_File/3318/3318.pdf"
        },
        {
        body:"Agricultural University",
        course:"All Polytechnic Courses",
        eligibility:"10th Pass",
        start:"20-May-2025",
        end:"Announce Soon",
        link:"https://poly.gsauca.in/",
        link2:"https://poly.gsauca.in/Images/News/149/149.pdf"
        },
        {
        body:"ACPUGMEC",
        course:"Medical & Dental",
        eligibility:"12th Pass (PCB)",
        start:"Announce Soon",
        end:"Announce Soon",
        // link:"http://medadmgujarat.ncode.in/UG/Index.aspx"
        },
        {
        body:"ACPUGMEC",
        course:"Ayurvedic & Homeopathy",
        eligibility:"12th Pass (PCB)",
        start:"Announce Soon",
        end:"Announce Soon",
        // link:"http://medadmgujarat.ncode.in/UG/Index.aspx"
        },
        {
        body:"ACPUGMEC",
        course:"BPT, BSc Nursing, GNM, ANM, B.Ortho., B.Optometry, B.Nat., BOT, BASLP",
        eligibility:"12th Pass (PCB)",
        start:"29-May-2025",
        end:"Announce Soon",
        link:"http://medadmgujarat.ncode.in/NUR/Index.aspx"
        }
        ];

return (
<div className={styles.page}>
<div className={styles.container}>

<h1 className={styles.title}>Admission Help Desk</h1>

<p className={styles.subtitle}>
Your complete admission guide in one place.
</p>

<p className={styles.description}>
Stay tuned! We are collecting and organizing admission information from various universities to help you easily track important dates, eligibility, and application links. All in one place.
</p>

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

{tableData.map((row,index)=>(
<tr key={index}>

<td>{row.body}</td>

<td>
<span className={styles.courseBadge}>
{row.course}
</span>
</td>

<td>{row.eligibility}</td>

<td>Coming soon</td>

<td>Coming soon</td>

<td className={styles.linkCell}>
{(() => {
  const url1 = isUrl(row.link) ? row.link : null;
  const url2 = isUrl(row.link2) ? row.link2 : isUrl(row["link 2"]) ? row["link 2"] : null;
  const linkAsText = row.link && !url1 ? row.link : null;
  if (!url1 && !url2 && !linkAsText) return null;
  return (
    <span className={styles.linkContent}>
      {linkAsText && <span className={styles.linkText}>{linkAsText}</span>}
      {url1 && (
        <span className={styles.linkGroup}>
          <a href={url1} target="_blank" rel="noopener noreferrer" className={styles.link}>
            Link 1
          </a>
          {url2 && <span className={styles.linkSeparator}>, </span>}
        </span>
      )}
      {url2 && (
        <a href={url2} target="_blank" rel="noopener noreferrer" className={styles.link}>
          Link 2
        </a>
      )}
    </span>
  );
})()}
</td>

</tr>
))}

</tbody>
</table>
</div>

<div className={styles.careerSection}>

<h2 className={styles.careerTitle}>
Explore Career Paths After 10th & 12th
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

<div className={styles.contactSection}>

<p className={styles.contactText}>
For further information feel free to contact us.
</p>

<div className={styles.contactGrid}>
  <div className={styles.contactBlock}>
    <span className={styles.contactIcon} aria-hidden="true">
      <Phone size={28} strokeWidth={1.75} />
    </span>
    <span className={styles.contactLabel}>Call us</span>
    <a href="tel:+919558610369" className={styles.contactTel}>
      +91 95586 10369
    </a>
  </div>

  <div className={styles.contactDivider} aria-hidden="true" />

  <div className={styles.contactBlock}>
    <span className={styles.contactIcon} aria-hidden="true">
      <Mail size={28} strokeWidth={1.75} />
    </span>
    <span className={styles.contactLabel}>Email us</span>
    <a href="mailto:hpymhelpdesk@gmail.com" className={styles.contactLink}>
      hpymhelpdesk@gmail.com
    </a>
  </div>

  <div className={styles.contactDivider} aria-hidden="true" />

  <div className={styles.contactBlock}>
    <span className={styles.contactIcon} aria-hidden="true">
      <Instagram size={28} strokeWidth={1.75} />
    </span>
    <span className={styles.contactLabel}>Instagram</span>
    <a
      href="https://www.instagram.com/anand_classes369?igsh=MXFvMnYxOTZobzM1NQ%3D%3D"
      target="_blank"
      rel="noopener noreferrer"
      className={styles.contactLink}
    >
      @anand_classes369
    </a>
  </div>
</div>

</div>

</div>
</div>
);
}