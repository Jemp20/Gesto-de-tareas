// src/components/TaskForm.jsx
import { useState, useRef } from "react";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Convierte un File a { url: base64, type, name }
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve({
      url:  reader.result,           // data:image/...;base64,...
      type: file.type.startsWith("video") ? "video" : "image",
      name: file.name,
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// task prop = editar tarea existente | null = nueva tarea
export default function TaskForm({ onClose, onSuccess, task }) {
  const isEdit = !!task;

  const [form, setForm] = useState({
    title:        task?.title        ?? "",
    description:  task?.description  ?? "",
    requestDate:  task?.requestDate  ?? new Date().toISOString().slice(0, 10),
    requestTime:  task?.requestTime  ?? new Date().toTimeString().slice(0, 5),
    deliveryDate: task?.deliveryDate ?? new Date().toISOString().slice(0, 10),
    deliveryTime: task?.deliveryTime ?? new Date().toTimeString().slice(0, 5),
    status:       task?.status       ?? "done",
    category:     task?.category     ?? "general",
  });

  const [existingMedia, setExistingMedia] = useState(task?.media ?? []);
  const [newFiles, setNewFiles]           = useState([]);
  const [uploading, setUploading]         = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging]           = useState(false);
  const [sizeWarning, setSizeWarning]     = useState("");
  const fileRef = useRef();

  const categories = ["general", "diseño", "video", "foto", "redacción", "reunión", "otro"];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFiles = (incoming) => {
    setSizeWarning("");
    const valid = [];
    for (const f of Array.from(incoming)) {
      // Límite sugerido: 700 KB por imagen para no superar 1 MB del documento
      if (f.size > 700 * 1024 && f.type.startsWith("image")) {
        setSizeWarning(`"${f.name}" supera 700 KB. Usa imágenes más pequeñas para evitar errores.`);
      } else {
        valid.push(f);
      }
    }
    setNewFiles((prev) => [...prev, ...valid]);
  };

  const handleDrop     = (e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); };
  const removeNew      = (i) => setNewFiles(newFiles.filter((_, idx) => idx !== i));
  const removeExisting = (i) => setExistingMedia(existingMedia.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(10);
    try {
      // Convertir archivos nuevos a Base64
      let converted = [];
      if (newFiles.length > 0) {
        converted = await Promise.all(newFiles.map(fileToBase64));
        setUploadProgress(70);
      }

      const allMedia = [...existingMedia, ...converted];

      if (isEdit) {
        await updateDoc(doc(db, "tasks", task.id), { ...form, media: allMedia });
      } else {
        await addDoc(collection(db, "tasks"), {
          ...form,
          media: allMedia,
          createdAt: serverTimestamp(),
        });
      }

      setUploadProgress(100);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error al guardar:", err);
      if (err.code === "invalid-argument") {
        alert("El archivo es demasiado grande para Firestore. Usa imágenes menores a 700 KB.");
      } else {
        alert(`Error: ${err.message}`);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">{isEdit ? "✏️ Editar Tarea" : "Nueva Tarea"}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem" }}>
              {isEdit ? "Modifica los datos y archivos" : "Registra lo que hiciste"}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: "0.4rem 0.7rem" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-group form-full">
              <label className="form-label">Título *</label>
              <input className="form-input" name="title" value={form.title}
                onChange={handleChange} placeholder="Ej: Edición de video para cliente X" required />
            </div>

            <div className="form-group form-full">
              <label className="form-label">Descripción</label>
              <textarea className="form-textarea" name="description" value={form.description}
                onChange={handleChange} placeholder="Detalles de la tarea..." />
            </div>

            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                <option value="done">✅ Completada</option>
                <option value="pending">⏳ Pendiente</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">📩 Fecha pedido</label>
              <input className="form-input" type="date" name="requestDate"
                value={form.requestDate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">🕐 Hora pedido</label>
              <input className="form-input" type="time" name="requestTime"
                value={form.requestTime} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">📤 Fecha entrega</label>
              <input className="form-input" type="date" name="deliveryDate"
                value={form.deliveryDate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">🕐 Hora entrega</label>
              <input className="form-input" type="time" name="deliveryTime"
                value={form.deliveryTime} onChange={handleChange} />
            </div>

            {/* ── Archivos ─────────────────────────────────────── */}
            <div className="form-group form-full">
              <label className="form-label">📎 Imágenes</label>

              <div
                className={`file-drop ${dragging ? "drag-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.4rem" }}>📁</div>
                Arrastra imágenes aquí o haz clic para seleccionar
                <br /><span style={{ fontSize: "0.7rem" }}>Máximo ~700 KB por imagen</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple
                style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />

              {sizeWarning && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--danger)" }}>
                  ⚠️ {sizeWarning}
                </div>
              )}

              {/* Archivos existentes */}
              {isEdit && existingMedia.length > 0 && (
                <div style={{ marginTop: "0.8rem" }}>
                  <div style={{ fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.4rem" }}>
                    Guardadas — clic en ✕ para quitar
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {existingMedia.map((m, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={m.url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
                        <button type="button" onClick={() => removeExisting(i)} style={{
                          position: "absolute", top: -5, right: -5, width: 18, height: 18,
                          background: "var(--danger)", border: "none", borderRadius: "50%",
                          color: "#fff", fontSize: 10, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Archivos nuevos */}
              {newFiles.length > 0 && (
                <div style={{ marginTop: "0.8rem" }}>
                  <div style={{ fontSize: "0.65rem", letterSpacing: "2px", textTransform: "uppercase", color: "var(--accent)", marginBottom: "0.4rem" }}>
                    Por guardar ({newFiles.length})
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {newFiles.map((f, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={URL.createObjectURL(f)} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6, border: "2px solid var(--accent)" }} />
                        <button type="button" onClick={() => removeNew(i)} style={{
                          position: "absolute", top: -5, right: -5, width: 18, height: 18,
                          background: "var(--danger)", border: "none", borderRadius: "50%",
                          color: "#fff", fontSize: 10, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progreso */}
          {uploading && (
            <div style={{ margin: "1rem 0" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.4rem" }}>
                {uploadProgress < 100 ? `Guardando... ${Math.round(uploadProgress)}%` : "Finalizando..."}
              </div>
              <div style={{ height: 4, background: "var(--border)", borderRadius: 2 }}>
                <div style={{ height: "100%", background: "var(--accent)", borderRadius: 2,
                  width: `${Math.max(uploadProgress, 5)}%`, transition: "width 0.3s" }} />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.8rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={uploading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? "Guardando..." : isEdit ? "✓ Guardar cambios" : "✓ Guardar Tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
