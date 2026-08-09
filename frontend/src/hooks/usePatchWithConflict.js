import { useCallback, useState } from 'react';
import { updateTicket } from '../api/ticketsApi';
import { parseApiError } from '../utils/apiError';

// Wraps a single ticket PATCH with 409-conflict detection, shared by both the list
// page (array of tickets) and the details page (single ticket) so the "what happens
// on a version conflict" logic only lives in one place. How the resulting ticket gets
// applied to component state is left to the caller, since that differs by shape.
export function usePatchWithConflict() {
  // { ticketId, attemptedChange, currentTicket } | null
  const [conflict, setConflict] = useState(null);

  const patchTicket = useCallback(async (ticketId, version, changes) => {
    try {
      const res = await updateTicket(ticketId, { ...changes, version });
      return { success: true, ticket: res.data };
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.isConflict) {
        setConflict({ ticketId, attemptedChange: changes, currentTicket: parsed.currentTicket });
        return { success: false, isConflict: true, currentTicket: parsed.currentTicket };
      }
      return { success: false, isConflict: false, message: parsed.message };
    }
  }, []);

  // Re-applies the user's original intended change, using the fresh version number
  // from the conflict's currentTicket. If it conflicts again, `conflict` is replaced
  // with the newer snapshot and the modal simply reopens with up-to-date info.
  const retryMine = useCallback(async () => {
    if (!conflict) return null;
    const { ticketId, attemptedChange, currentTicket } = conflict;
    setConflict(null);
    return patchTicket(ticketId, currentTicket.version, attemptedChange);
  }, [conflict, patchTicket]);

  // Discards the user's attempted change entirely and hands back the server's ticket.
  const takeTheirs = useCallback(() => {
    const ticket = conflict?.currentTicket ?? null;
    setConflict(null);
    return ticket;
  }, [conflict]);

  const cancelConflict = useCallback(() => setConflict(null), []);

  return { conflict, patchTicket, retryMine, takeTheirs, cancelConflict };
}
