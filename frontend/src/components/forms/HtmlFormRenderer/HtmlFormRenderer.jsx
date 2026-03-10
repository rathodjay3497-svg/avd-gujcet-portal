import { useRef, useEffect, useCallback } from 'react';
import styles from './HtmlFormRenderer.module.css';

export default function HtmlFormRenderer({ htmlString, onSubmit }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !htmlString) return;

    const intercept = `
      <style>
        body { font-family: 'Inter', sans-serif; padding: 16px; margin: 0; }
        input, select, textarea { padding: 8px 12px; border: 1.5px solid #E2E8F0; border-radius: 6px; font-size: 14px; width: 100%; box-sizing: border-box; margin-bottom: 12px; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
        label { display: block; font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1E293B; }
        button[type="submit"] { background: #2563EB; color: #fff; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; width: 100%; font-size: 16px; }
        button[type="submit"]:hover { background: #1A3C6E; }
      </style>
      <script>
        document.querySelector('form')?.addEventListener('submit', function(e) {
          e.preventDefault();
          var data = Object.fromEntries(new FormData(e.target));
          window.parent.postMessage({ type: 'FORM_SUBMIT', data: data }, '*');
        });
      </script>
    `;

    const doc = iframe.contentDocument;
    doc.open();
    doc.write(htmlString + intercept);
    doc.close();
  }, [htmlString]);

  const handleMessage = useCallback(
    (e) => {
      if (e.data?.type === 'FORM_SUBMIT') {
        onSubmit(e.data.data);
      }
    },
    [onSubmit]
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts allow-forms"
      title="Event Registration Form"
      className={styles.formIframe}
    />
  );
}
