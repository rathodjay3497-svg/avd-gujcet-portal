import { useForm } from 'react-hook-form';
import DynamicField from '@/components/forms/DynamicField/DynamicField';
import Button from '@/components/ui/Button/Button';
import styles from './DynamicForm.module.css';

export default function DynamicForm({ schema, onSubmit, loading = false }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Group fields into sections based on separator type
  const sections = [];
  let currentSection = { label: 'Registration Details', fields: [] };

  schema.forEach((field) => {
    if (field.type === 'section') {
      if (currentSection.fields.length > 0) sections.push(currentSection);
      currentSection = { label: field.label, fields: [] };
    } else {
      currentSection.fields.push(field);
    }
  });
  if (currentSection.fields.length > 0) sections.push(currentSection);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {sections.map((section, idx) => (
        <div key={idx} className={styles.section}>
          {sections.length > 1 && (
            <h4 className={styles.sectionLabel}>{section.label}</h4>
          )}
          {section.fields.map((field) => (
            <DynamicField
              key={field.field_id}
              field={field}
              register={register}
              errors={errors}
            />
          ))}
        </div>
      ))}

      <Button type="submit" fullWidth loading={loading} size="lg">
        Submit Registration
      </Button>
    </form>
  );
}
