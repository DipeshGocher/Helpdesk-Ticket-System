import { CATEGORY_OPTIONS, PRIORITY_OPTIONS } from '../../constants/enums';
import styles from './TicketFormFields.module.css';

// Title/description/category/priority fields, shared by the Create Ticket page and
// the Ticket Details inline edit form so the markup and validation display for these
// four fields only lives in one place.
export default function TicketFormFields({ form, errors, onChange, idPrefix = '' }) {
  const fieldId = (name) => (idPrefix ? `${idPrefix}-${name}` : name);

  return (
    <>
      <div className="field">
        <label className="field-label" htmlFor={fieldId('title')}>
          Title
        </label>
        <input
          id={fieldId('title')}
          type="text"
          className={`input ${errors.title ? 'has-error' : ''}`}
          value={form.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Short summary of the issue"
          maxLength={100}
        />
        <div className={styles.fieldFooter}>
          {errors.title ? (
            <span className="field-error">{errors.title}</span>
          ) : (
            <span className="field-hint">5-100 characters</span>
          )}
          <span className="field-hint">{form.title.length}/100</span>
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor={fieldId('description')}>
          Description
        </label>
        <textarea
          id={fieldId('description')}
          className={`textarea ${errors.description ? 'has-error' : ''}`}
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Describe the issue in detail (at least 20 characters)"
          rows={5}
        />
        <div className={styles.fieldFooter}>
          {errors.description ? (
            <span className="field-error">{errors.description}</span>
          ) : (
            <span className="field-hint">Minimum 20 characters</span>
          )}
          <span className="field-hint">{form.description.trim().length}/20 min</span>
        </div>
      </div>

      <div className={styles.row}>
        <div className="field">
          <label className="field-label" htmlFor={fieldId('category')}>
            Category
          </label>
          <select
            id={fieldId('category')}
            className={`select ${errors.category ? 'has-error' : ''}`}
            value={form.category}
            onChange={(e) => onChange('category', e.target.value)}
          >
            {!form.category && <option value="">Select category</option>}
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </div>

        <div className="field">
          <label className="field-label" htmlFor={fieldId('priority')}>
            Priority
          </label>
          <select
            id={fieldId('priority')}
            className={`select ${errors.priority ? 'has-error' : ''}`}
            value={form.priority}
            onChange={(e) => onChange('priority', e.target.value)}
          >
            {!form.priority && <option value="">Select priority</option>}
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors.priority && <span className="field-error">{errors.priority}</span>}
        </div>
      </div>
    </>
  );
}
