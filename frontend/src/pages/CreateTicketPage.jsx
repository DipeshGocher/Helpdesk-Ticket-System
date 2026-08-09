import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createTicket } from '../api/ticketsApi';
import { parseApiError } from '../utils/apiError';
import { validateTicketFields } from '../utils/ticketValidation';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import TicketFormFields from '../components/TicketFormFields/TicketFormFields';
import styles from './CreateTicketPage.module.css';

const INITIAL_FORM = { title: '', description: '', category: '', priority: '' };

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateTicketFields(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await createTicket({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
      });
      const ticket = res.data;
      showToast(
        ticket.status === 'Queued'
          ? 'Ticket created. All agents are at capacity, so it was queued.'
          : `Ticket created and assigned to ${ticket.assignedAgent?.name ?? 'an agent'}.`,
        { type: 'success' }
      );
      navigate(`/tickets/${ticket._id}`);
    } catch (err) {
      const parsed = parseApiError(err);
      setSubmitError(parsed.message);
      if (parsed.fieldErrors.length > 0) {
        const fieldMap = {};
        parsed.fieldErrors.forEach((fe) => {
          if (fe.path) fieldMap[fe.path] = fe.msg;
        });
        setErrors((prev) => ({ ...prev, ...fieldMap }));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-container">
      <div className={styles.headerRow}>
        <h1>New Ticket</h1>
        <Link to="/" className="btn btn-ghost btn-sm">
          ← Back to tickets
        </Link>
      </div>

      <form className={`card ${styles.form}`} onSubmit={handleSubmit} noValidate>
        <TicketFormFields form={form} errors={errors} onChange={handleChange} />

        {submitError && <p className="field-error">{submitError}</p>}

        <div className={styles.actions}>
          <Link to="/" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner inline size={16} label="" /> : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
