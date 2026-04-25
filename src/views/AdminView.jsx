// src/views/AdminView.jsx
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";
import TaskForm from "../components/TaskForm";
import TaskCard from "../components/TaskCard";
import WeekView from "../components/WeekView";
import Login   from "../components/Login";
import { format, isToday, isSameDay, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

const VIEWS = { HOY: "hoy", SEMANA: "semana", TODAS: "todas" };

export default function AdminView() {
  const { user, isAdmin, authLoading, logout } = useAuth();

  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [view,        setView]        = useState(VIEWS.HOY);
  const [showForm,    setShowForm]    = useState(false);
  const [filter,      setFilter]      = useState("all");
  const [filterCat,   setFilterCat]   = useState("all");
  const [toast,       setToast]       = useState(null);
  const [selectedDay, setSelectedDay] = useState(null); // día seleccionado en el calendario

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => { setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (err)  => { console.error("Firestore:", err); setLoading(false); }
    );
  }, []);

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem",
      }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>
          TASK<span style={{ color: "var(--text)" }}>LOG</span>
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--muted)", letterSpacing: "3px" }}>CARGANDO...</div>
      </div>
    );
  }

  if (!isAdmin) return <Login />;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

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
    // Si hay un día seleccionado en el calendario, filtra solo por ese día
    if (selectedDay) {
      list = list.filter((t) => t.deliveryDate && isSameDay(new Date(t.deliveryDate + "T12:00:00"), selectedDay));
    } else {
      if (view === VIEWS.HOY)    list = list.filter((t) => t.deliveryDate && isToday(parseISO(t.deliveryDate)));
      if (view === VIEWS.SEMANA) list = list.filter(inWeek);
    }
    if (filter    !== "all") list = list.filter((t) => t.status   === filter);
    if (filterCat !== "all") list = list.filter((t) => t.category === filterCat);
    return list;
  };

  // Al cambiar de vista principal, limpiar el día seleccionado
  const handleSetView = (v) => { setView(v); setSelectedDay(null); };

  const filtered   = getFiltered();
  const todayTasks = tasks.filter((t) => t.deliveryDate && isToday(parseISO(t.deliveryDate)));
  const weekTasks  = tasks.filter(inWeek);
  const doneTasks  = tasks.filter((t) => t.status === "done");
  const categories = [...new Set(tasks.map((t) => t.category).filter(Boolean))];

  // Título dinámico según si hay día seleccionado
  const getTitle = () => {
    if (selectedDay) return `📅 ${format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}`;
    if (view === VIEWS.HOY)    return `☀️ Hoy — ${format(today, "d 'de' MMMM", { locale: es })}`;
    if (view === VIEWS.SEMANA) return "📅 Esta Semana";
    if (view === VIEWS.TODAS)  return "📋 Todas las Tareas";
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo"><em>GIA</em><span>LOG</span></div>
          <div style={{ fontSize: "0.6rem", color: "var(--muted)", marginTop: "0.5rem", letterSpacing: "3px", textTransform: "uppercase", fontWeight: 300 }}>
            Gestión de tareas
          </div>
        </div>

        <div>
          <div className="nav-label">Vistas</div>
          {[
            { id: VIEWS.HOY,    label: "☀️ Hoy",            count: todayTasks.length },
            { id: VIEWS.SEMANA, label: "📅 Este Mes",     count: weekTasks.length  },
            { id: VIEWS.TODAS,  label: "📋 Todas las tareas" },
          ].map(({ id, label, count }) => (
            <button key={id} className={`nav-btn ${view === id ? "active" : ""}`} onClick={() => handleSetView(id)}>
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

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(240,160,184,0.1) 0%, rgba(184,159,212,0.08) 100%)",
            border: "1px solid rgba(240,160,184,0.2)",
            borderRadius: "var(--radius)",
            padding: "0.7rem 0.9rem",
            fontSize: "0.75rem",
            color: "var(--rose)",
            display: "flex", alignItems: "center", gap: "0.6rem",
          }}>
            <span>✦</span>
            <div>
              <div style={{ fontWeight: 500 }}>Admin</div>
              <div style={{ color: "var(--muted)", fontSize: "0.65rem", marginTop: "0.1rem", fontWeight: 300 }}>{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setShowForm(true)}>
            + Nueva Tarea
          </button>
          <button className="btn btn-ghost" style={{ width: "100%", fontSize: "0.75rem" }} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <div className="page-header">
          <div>
            <div className="page-title">{getTitle()}</div>
            <div className="page-subtitle">
              {filtered.length} tarea{filtered.length !== 1 ? "s" : ""}
              {selectedDay && (
                <button onClick={() => setSelectedDay(null)} style={{
                  marginLeft: "0.6rem", fontSize: "0.7rem", background: "var(--surface2)",
                  border: "1px solid var(--border)", borderRadius: "20px",
                  color: "var(--muted)", cursor: "pointer", padding: "0.1rem 0.5rem",
                }}>
                  ✕ Ver toda la semana
                </button>
              )}
              {filter    !== "all" && ` · ${filter}`}
              {filterCat !== "all" && ` · ${filterCat}`}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nueva Tarea</button>
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
            <WeekView
              tasks={tasks}
              selectedDay={selectedDay}
              onDayClick={(day) => setSelectedDay(isSameDay(day, selectedDay ?? new Date(0)) ? null : day)}
            />
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
            <div className="empty-state-text">
              {selectedDay ? `Sin tareas el ${format(selectedDay, "d 'de' MMMM", { locale: es })}` : "No hay tareas aquí"}
            </div>
            <div style={{ fontSize: "0.8rem", marginTop: "0.4rem", color: "var(--muted)" }}>
              {selectedDay ? "Prueba seleccionando otro día" : "Agrega tu primera tarea"}
            </div>
            {!selectedDay && (
              <button className="btn btn-primary" style={{ marginTop: "1.5rem" }} onClick={() => setShowForm(true)}>
                + Nueva Tarea
              </button>
            )}
          </div>
        ) : (
          filtered.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </main>

      {showForm && (
        <TaskForm
          onClose={() => setShowForm(false)}
          onSuccess={() => showToast("✅ Tarea guardada correctamente")}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
