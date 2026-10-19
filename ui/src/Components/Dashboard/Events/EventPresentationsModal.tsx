import React, { useEffect, useState } from "react";
import { getPresentationsByEvent, presentationViewUrl, apiErrorMessage } from "@/api/presentations";
import type { PresentationDto } from "../../../../../src/types/presentation.types";

interface EventPresentationsModalProps {
  eventId: string;
}

/**
 * Modal content (rendered inside the shared ModalProvider) listing an event's presentations.
 * Each opens in a new tab through the protected view route.
 */
const EventPresentationsModal: React.FC<EventPresentationsModalProps> = ({ eventId }) => {
  const [presentations, setPresentations] = useState<PresentationDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    getPresentationsByEvent(eventId, controller.signal)
      .then((rows) => {
        if (active) setPresentations(rows);
      })
      .catch((err) => {
        console.error("Failed to load presentations:", err);
        if (active) setError(apiErrorMessage(err, "Could not load presentations."));
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [eventId]);

  if (error) return <p role="alert">{error}</p>;
  if (presentations === null) return <p>Loading…</p>;
  if (presentations.length === 0) return <p>No presentations for this event yet.</p>;

  return (
    <ul className="event-presentations-list">
      {presentations.map((p) => (
        <li key={p.id}>
          <a href={presentationViewUrl(p.id)} target="_blank" rel="noopener noreferrer">
            {p.title}
          </a>
        </li>
      ))}
    </ul>
  );
};

export default EventPresentationsModal;
