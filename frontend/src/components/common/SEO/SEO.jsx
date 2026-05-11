import { Helmet } from 'react-helmet-async';

/**
 * SEO component to handle dynamic head tags
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Meta description
 * @param {string} props.image - Social media thumbnail URL
 * @param {string} props.url - Canonical URL
 * @param {string} props.type - OG type (website, article, etc.)
 */
const SEO = ({
  title,
  description,
  image = '/assets/suhrad-youths-logo-round.png',
  url = window.location.href,
  type = 'website'
}) => {
  const siteTitle = 'Suhrad Youths';
  const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle}`;
  const defaultDescription = 'Expert admission guidance by Suhrad Youths and Anand Coaching Centre. Register for events, HPCL, and get professional guidance for your college admissions.';
  const metaDescription = description || defaultDescription;

  // Ensure image is an absolute URL if possible, or fallback to public assets
  const ogImage = image.startsWith('http') ? image : `${window.location.origin}${image}`;

  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;
