import styles from './DynamicField.module.css';

export default function DynamicField({ field, register, errors }) {
  const { field_id, label, type, required, options, placeholder } = field;
  const error = errors?.[field_id];

  const commonProps = {
    id: field_id,
    placeholder: placeholder || `Enter ${label.toLowerCase()}`,
    className: `${styles.input} ${error ? styles.error : ''}`,
    ...register(field_id, {
      required: required ? `${label} is required` : false,
      ...(type === 'phone' && {
        pattern: { value: /^\d{10}$/, message: 'Enter a valid 10-digit phone number' },
      }),
      ...(type === 'email' && {
        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
      }),
    }),
  };

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {label}</option>
            {options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'textarea':
        return <textarea {...commonProps} rows={4} />;

      case 'radio':
        return (
          <div className={styles.radioGroup}>
            {options?.map((opt) => (
              <label key={opt} className={styles.radioLabel}>
                <input type="radio" value={opt} {...register(field_id, { required: required ? `${label} is required` : false })} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className={styles.checkGroup}>
            {options?.map((opt) => (
              <label key={opt} className={styles.checkLabel}>
                <input type="checkbox" value={opt} {...register(field_id)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return <input type="date" {...commonProps} />;

      case 'number':
        return <input type="number" {...commonProps} />;

      case 'phone':
        return <input type="tel" maxLength={10} {...commonProps} />;

      case 'email':
        return <input type="email" {...commonProps} />;

      default:
        return <input type="text" {...commonProps} />;
    }
  };

  return (
    <div className={styles.field}>
      <label htmlFor={field_id} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {renderInput()}
      {error && <span className={styles.errorMsg}>{error.message}</span>}
    </div>
  );
}
