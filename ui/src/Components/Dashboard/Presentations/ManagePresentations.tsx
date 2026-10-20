import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import type { RootState } from "../../../store";
import { getEvents } from "@/api/events";
import type { MemberEventDto } from "../../../../../src/types/event.types";
import {
  deletePresentation,
  getPresentationsByEvent,
  presentationViewUrl,
  uploadPresentation,
  apiErrorMessage,
} from "@/api/presentations";
import type { PresentationDto } from "../../../../../src/types/presentation.types";
import { MAX_PRESENTATION_BYTES } from "../../../../../src/types/presentation.types";
import UploadProgress from "./UploadProgress";
import "./Presentations.css";

const ACCEPT = ".pdf,.ppt,.pptx";

const formatSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const absoluteViewUrl = (id: string): string => {
  const path = presentationViewUrl(id);
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
};

const ManagePresentations: React.FC = () => {
  const isAdmin = useSelector((state: RootState) => state.auth.user?.role === "admin");
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<MemberEventDto[]>([]);
  const [eventId, setEventId] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [presentations, setPresentations] = useState<PresentationDto[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Shareable link: ?tab=manage_presentations&eventId=<id> preselects that event once the list loads.
  // The short "event" key is still read so links shared earlier keep working.
  const eventParam = searchParams.get("eventId") ?? searchParams.get("event");

  const selectEvent = (id: string) => {
    setEventId(id);
    const next = new URLSearchParams(searchParams);
    next.delete("event");
    if (id) next.set("eventId", id);
    else next.delete("eventId");
    setSearchParams(next, { replace: true });
  };

  // Load events for the picker.
  useEffect(() => {
    let active = true;
    getEvents()
      .then((rows) => {
        if (!active) return;
        setEvents(rows);
        // An unknown id in the link is ignored.
        if (eventParam && rows.some((ev) => ev.id === eventParam)) setEventId(eventParam);
      })
      .catch((err) => {
        console.error("Failed to load events:", err);
        if (active) setError("Could not load events.");
      });
    return () => {
      active = false;
    };
  }, []);

  // Load the selected event's presentations.
  const loadPresentations = useCallback(async (id: string) => {
    if (!id) {
      setPresentations([]);
      return;
    }
    setListLoading(true);
    try {
      setPresentations(await getPresentationsByEvent(id));
    } catch (err) {
      console.error("Failed to load presentations:", err);
      setError(apiErrorMessage(err, "Could not load presentations."));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPresentations(eventId);
  }, [eventId, loadPresentations]);

  const canSubmit = useMemo(
    () => !!eventId && !!title.trim() && !!file && !uploading,
    [eventId, title, file, uploading]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    setError(null);
    if (next && next.size > MAX_PRESENTATION_BYTES) {
      setError("File exceeds the 50 MB limit.");
      setFile(null);
      e.target.value = "";
      return;
    }
    setFile(next);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !file) return;
    setUploading(true);
    setPercent(0);
    setError(null);
    setNotice(null);
    try {
      await uploadPresentation({ eventId, title: title.trim(), file }, setPercent);
      setNotice("Presentation uploaded.");
      setTitle("");
      setFile(null);
      await loadPresentations(eventId);
    } catch (err) {
      console.error("Failed to upload the presentation:", err);
      setError(apiErrorMessage(err, "Upload failed."));
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (id: string) => {
    setError(null);
    try {
      await deletePresentation(id);
      setPresentations((rows) => rows.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete the presentation:", err);
      setError(apiErrorMessage(err, "Could not delete presentation."));
    }
  };

  const onCopyLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(absoluteViewUrl(id));
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000);
    } catch (err) {
      console.error("Failed to copy the link to the clipboard:", err);
      setError("Could not copy the link.");
    }
  };

  return (
    <div className="dash-section manage-presentations">
      <div className="dash-header">
        <h3>Manage Presentations</h3>
      </div>

      <form className="presentation-form" onSubmit={onSubmit}>
        <div className="presentation-form__row">
          <label>
            Event
            <select value={eventId} onChange={(e) => selectEvent(e.target.value)} required>
              <option value="">Select an event…</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Title
            <input
              type="text"
              value={title}
              maxLength={160}
              placeholder="Presentation title"
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label>
            File (PDF, PPT, PPTX · max 50 MB)
            <input type="file" accept={ACCEPT} onChange={onFileChange} />
          </label>
        </div>

        {uploading && <UploadProgress percent={percent} />}
        {error && <p className="presentation-upload__error" role="alert">{error}</p>}
        {notice && <p className="presentation-upload__notice">{notice}</p>}

        <button type="submit" className="presentation-form__submit" disabled={!canSubmit}>
          {uploading ? "Uploading…" : "Upload presentation"}
        </button>
      </form>

      {eventId && (
        <div className="presentation-list">
          <h4>Attached presentations</h4>
          {listLoading ? (
            <p>Loading…</p>
          ) : presentations.length === 0 ? (
            <p className="presentation-list__empty">No presentations yet for this event.</p>
          ) : (
            <ul>
              {presentations.map((p) => (
                <li key={p.id} className="presentation-list__item">
                  <a href={presentationViewUrl(p.id)} target="_blank" rel="noopener noreferrer">
                    {p.title}
                  </a>
                  <span className="presentation-list__meta">
                    {p.extension.toUpperCase()} · {formatSize(p.size)}
                  </span>
                  <span className="presentation-list__actions">
                    <button type="button" onClick={() => onCopyLink(p.id)}>
                      {copiedId === p.id ? "Copied!" : "Copy link"}
                    </button>
                    {isAdmin && (
                      <button type="button" className="danger" onClick={() => onDelete(p.id)}>
                        Delete
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagePresentations;
