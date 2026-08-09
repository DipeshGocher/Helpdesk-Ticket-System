import { CATEGORY_OPTIONS, PRIORITY_OPTIONS } from '../constants/enums';

// Mirrors backend validation (backend/src/validators/ticket.validator.js) so users get
// instant feedback instead of a round-trip 400.
export function validateTicketFields(form) {
  const errors = {};
  const title = form.title.trim();
  const description = form.description.trim();

  if (title.length < 5 || title.length > 100) {
    errors.title = 'Title must be between 5 and 100 characters.';
  }
  if (description.length < 20) {
    errors.description = 'Description must be at least 20 characters.';
  }
  if (!CATEGORY_OPTIONS.includes(form.category)) {
    errors.category = 'Please select a category.';
  }
  if (!PRIORITY_OPTIONS.includes(form.priority)) {
    errors.priority = 'Please select a priority.';
  }
  return errors;
}
