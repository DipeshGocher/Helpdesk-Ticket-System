import { useState } from 'react';
import RelativeTime from '../RelativeTime/RelativeTime';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import styles from './CommentSection.module.css';

const MIN_LENGTH = 3;

export default function CommentSection({ comments = [], isClosed, onAddComment }) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const sorted = [...comments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const trimmedLength = text.trim().length;

  async function handleSubmit(e) {
    e.preventDefault();
    if (trimmedLength < MIN_LENGTH || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    try {
      await onAddComment(text.trim());
      setText('');
    } catch (err) {
      setError(err.message || 'Failed to add comment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <h3 className={styles.heading}>Comments ({comments.length})</h3>

      {sorted.length === 0 ? (
        <p className="text-muted">No comments yet.</p>
      ) : (
        <ul className={styles.list}>
          {sorted.map((comment) => (
            <li key={comment._id || comment.createdAt} className={styles.comment}>
              <div className={styles.commentHeader}>
                <span className={styles.commentAuthor}>
                  {comment.authorName || 'Support'}
                  {comment.authorRole && <span className={styles.commentAuthorRole}> · {comment.authorRole}</span>}
                </span>
                <RelativeTime date={comment.createdAt} className={styles.commentTime} />
              </div>
              <p className={styles.commentText}>{comment.text}</p>
            </li>
          ))}
        </ul>
      )}

      {isClosed ? (
        <p className={styles.disabledNote}>Comments are disabled - this ticket is Closed.</p>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <textarea
            className="textarea"
            placeholder="Add a comment... (minimum 3 characters)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isSubmitting}
            rows={3}
          />
          {error && <p className="field-error">{error}</p>}
          <div className={styles.formFooter}>
            <span className="field-hint">{trimmedLength}/3 min characters</span>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={trimmedLength < MIN_LENGTH || isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner inline size={14} label="" /> : 'Post comment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
