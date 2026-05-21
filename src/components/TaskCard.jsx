// src/components/TaskCard.jsx
import { useState } from "react";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import TaskForm from "./TaskForm";

function Lightbox({ src, type, onClose }) {
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      {type === "video"
        ? <video src={src} controls autoPlay style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 8 }} />
        : <img src={src} alt="" className="lightbox-img" />
      }
    </div>
  );
}

export default function TaskCard({ task, isPublic = false }) {
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [editing,  setEditing]  = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleStatus = async (e) => {
    e.stopPropagation();
    await updateDoc(doc(db, "tasks", task.id), {
      status: task.status === "done" ? "pending" : "done",
    });
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    await deleteDoc(doc(db, "tasks", task.id));
  };

  const calcTurnaround = () => {
    try {
      const req  = new Date(`${task.requestDate}T${task.requestTime}`);
      const del  = new Date(`${task.deliveryDate}T${task.deliveryTime}`);
      const diff = del - req;
      if (diff <= 0) return null;
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    } catch { return null; }
  };

  const turnaround = calcTurnaround();

  return (
    <>
      {lightbox && (
        <Lightbox src={lightbox.url} type={lightbox.type} onClose={() => setLightbox(null)} />
      )}
      {editing && (
        <TaskForm task={task} onClose={() => setEditing(false)} onSuccess={() => setEditing(false)} />
      )}

      <div
        className={`task-card status-${task.status}`}
        onClick={() => setExpanded(!expanded)}
        style={{ marginBottom: "0.8rem" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
              <span className={`tag tag-${task.status}`}>
                {task.status === "done" ? "✅ Completada" : "⏳ Pendiente"}
              </span>
              {task.category && (
                <span className="tag" style={{ background: "var(--surface2)", color: "var(--muted)" }}>
                  {task.category}
                </span>
              )}
              {task.media?.length > 0 && (
                <span className="tag" style={{ background: "rgba(232,255,71,0.1)", color: "var(--accent)" }}>
                  📎 {task.media.length}
                </span>
              )}
            </div>

            <div className="task-title">{task.title}</div>

            <div className="task-meta">
              {task.requestDate && (
                <span className="task-meta-item">📩 {task.requestDate} {task.requestTime}</span>
              )}
              {task.deliveryDate && (
                <span className="task-meta-item">📤 {task.deliveryDate} {task.deliveryTime}</span>
              )}
              {turnaround && (
                <span className="task-meta-item" style={{ color: "var(--accent)" }}>⚡ {turnaround}</span>
              )}
            </div>
          </div>

          {/* Botones — solo en modo admin (no isPublic) */}
          {!isPublic && (
            <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
              <button
                className="btn btn-ghost"
                style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                onClick={toggleStatus}
                title={task.status === "done" ? "Marcar pendiente" : "Marcar completada"}
              >
                {task.status === "done" ? "↩" : "✓"}
              </button>
              <button
                className="btn btn-ghost"
                style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                title="Editar tarea"
              >
                ✏️
              </button>
              <button
                className="btn btn-danger"
                style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                onClick={handleDelete}
                disabled={deleting}
                title="Eliminar tarea"
              >
                🗑
              </button>
            </div>
          )}
        </div>

        {expanded && (
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            {task.description && (
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.8rem", lineHeight: 1.7 }}>
                {task.description}
              </p>
            )}
            {task.media?.length > 0 && (
              <div>
                <div style={{ fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.5rem" }}>
                  Archivos adjuntos
                </div>
                <div className="media-grid">
                  {task.media.map((m, i) =>
                    m.type === "video" ? (
                      <div key={i} className="media-video-thumb"
                        onClick={(e) => { e.stopPropagation(); setLightbox(m); }} title={m.name}>▶</div>
                    ) : (
                      <img key={i} src={m.url} alt="" className="media-thumb"
                        onClick={(e) => { e.stopPropagation(); setLightbox(m); }} />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
