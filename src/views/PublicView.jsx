// src/views/PublicView.jsx
// Vista pública — solo lectura, sin ningún control de admin
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import TaskCard from "../components/TaskCard";
import WeekView from "../components/WeekView";
import { format, isToday, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

const VIEWS = { HOY: "hoy", SEMANA: "semana", TODAS: "todas" };

export default function PublicView() {
  const [tasks,     setTasks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [view,      setView]      = useState(VIEWS.HOY);
  const [filter,    setFilter]    = useState("all");
  const [filterCat, setFilterCat] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => { setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (err)  => { console.error("Firestore:", err); setLoading(false); }
    );
  }, []);

  const today   = new Date();
  const wkStart = startOfWeek(today, { weekStartsOn: 1 });
  const wkEnd   = endOfWeek(today,   { weekStartsOn: 1 });

  const inWeek = (t) => {
    if (!t.deliveryDate) return false;
    try { return isWithinInterval(parseISO(t.deliveryDate), { start: wkStart, end: wkEnd }); }
    catch { return false; }
  };

  const getFiltered = () => {
    let list = [...tasks];
    if (view === VIEWS.HOY)    list = list.filter((t) => t.deliveryDate && isToday(parseISO(t.deliveryDate)));
    if (view === VIEWS.SEMANA) list = list.filter(inWeek);
    if (filter    !== "all")   list = list.filter((t) => t.status   === filter);
    if (filterCat !== "all")   list = list.filter((t) => t.category === filterCat);
    return list;
  };

  const filtered   = getFiltered();
  const todayTasks = tasks.filter((t) => t.deliveryDate && isToday(parseISO(t.deliveryDate)));
  const weekTasks  = tasks.filter(inWeek);
  const doneTasks  = tasks.filter((t) => t.status === "done");
  const categories = [...new Set(tasks.map((t) => t.category).filter(Boolean))];

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">GIA<span>LOG</span></div>
          <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: "0.3rem" }}>
            Gestión de tareas diarias
          </div>
        </div>

        <div>
          <div className="nav-label">Vistas</div>
          {[
            { id: VIEWS.HOY,    label: "☀️ Hoy",            count: todayTasks.length },
            { id: VIEWS.SEMANA, label: "📅 Este Mes",     count: weekTasks.length  },
            { id: VIEWS.TODAS,  label: "📋 Todas las tareas" },
          ].map(({ id, label, count }) => (
            <button key={id} className={`nav-btn ${view === id ? "active" : ""}`} onClick={() => setView(id)}>
              {label}
              {count > 0 && (
                <span style={{
                  marginLeft: "auto",
                  background: view === id ? "var(--accent)" : "var(--surface2)",
                  color: view === id ? "var(--bg)" : "var(--muted)",
                  borderRadius: "10px", padding: "0 0.4rem", fontSize: "0.65rem", fontWeight: 700,
                }}>{count}</span>
              )}
            </button>
          ))}
        </div>

        <div>
          <div className="nav-label">Estadísticas</div>
          {[
            { label: "Total tareas", value: tasks.length },
            { label: "Completadas",  value: doneTasks.length, accent: true },
            { label: "Con archivos", value: tasks.filter((t) => t.media?.length > 0).length },
            { label: "Esta semana",  value: weekTasks.length },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--muted)" }}>{label}</span>
              <span style={{ fontWeight: 700, color: accent ? "var(--success)" : "var(--text)", fontFamily: "var(--font-head)" }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Sin ningún botón de admin aquí */}
      </aside>

      {/* Main */}
      <main className="main">
        <div className="page-header">
          <div>
            <div className="page-title">
              {view === VIEWS.HOY    && `☀️ Hoy — ${format(today, "d 'de' MMMM", { locale: es })}`}
              {view === VIEWS.SEMANA && "📅 Esta Semana"}
              {view === VIEWS.TODAS  && "📋 Todas las Tareas"}
            </div>
            <div className="page-subtitle">
              {filtered.length} tarea{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {view === VIEWS.SEMANA && (
          <div className="stats-grid">
            {[
              { label: "Tareas semana", value: weekTasks.length,                                          color: "var(--accent)"  },
              { label: "Completadas",   value: weekTasks.filter((t) => t.status === "done").length,        color: "var(--success)" },
              { label: "Pendientes",    value: weekTasks.filter((t) => t.status === "pending").length,     color: "var(--accent2)" },
              { label: "Archivos",      value: weekTasks.reduce((s, t) => s + (t.media?.length ?? 0), 0), color: "var(--text)"    },
            ].map(({ label, value, color }) => (
              <div key={label} className="stat-card">
                <div className="stat-value" style={{ color }}>{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        )}

        {view === VIEWS.SEMANA && (
          <div style={{ marginBottom: "2rem" }}>
            <WeekView tasks={tasks} />
          </div>
        )}

        <div className="filters">
          {[
            { id: "all",     label: "Todas"         },
            { id: "done",    label: "✅ Completadas" },
            { id: "pending", label: "⏳ Pendientes"  },
          ].map(({ id, label }) => (
            <button key={id}
              className={`btn ${filter === id ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: "0.35rem 0.8rem", fontSize: "0.75rem" }}
              onClick={() => setFilter(id)}
            >{label}</button>
          ))}
          {categories.map((cat) => (
            <button key={cat}
              className={`btn ${filterCat === cat ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: "0.35rem 0.8rem", fontSize: "0.75rem" }}
              onClick={() => setFilterCat(filterCat === cat ? "all" : cat)}
            >{cat}</button>
          ))}
        </div>

        {loading ? (
          <div className="loader">⏳ Cargando tareas...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">No hay tareas aquí</div>
            <div style={{ fontSize: "0.8rem", marginTop: "0.4rem", color: "var(--muted)" }}>
              Aún no se han publicado tareas
            </div>
          </div>
        ) : (
          // TaskCard en modo público — sin botones de editar/borrar
          filtered.map((task) => <TaskCard key={task.id} task={task} isPublic />)
        )}
      </main>
    </div>
  );
}
