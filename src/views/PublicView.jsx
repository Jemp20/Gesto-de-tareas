// src/views/PublicView.jsx
// Vista publica: lectura limpia, profesional y sin controles de admin.
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import TaskCard from "../components/TaskCard";
import WeekView from "../components/WeekView";
import { format, isToday, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFolder,
  FiList,
  FiPaperclip,
  FiSun,
} from "react-icons/fi";

const VIEWS = { HOY: "hoy", SEMANA: "semana", TODAS: "todas" };

const viewItems = [
  { id: VIEWS.HOY, label: "Hoy", Icon: FiSun },
  { id: VIEWS.SEMANA, label: "Esta semana", Icon: FiCalendar },
  { id: VIEWS.TODAS, label: "Todas las tareas", Icon: FiList },
];

export default function PublicView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(VIEWS.HOY);
  const [filter, setFilter] = useState("all");
  const [filterCat, setFilterCat] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => {
        setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Firestore:", err);
        setLoading(false);
      }
    );
  }, []);

  const today = new Date();
  const wkStart = startOfWeek(today, { weekStartsOn: 1 });
  const wkEnd = endOfWeek(today, { weekStartsOn: 1 });

  const inWeek = (t) => {
    if (!t.deliveryDate) return false;
    try {
      return isWithinInterval(parseISO(t.deliveryDate), { start: wkStart, end: wkEnd });
    } catch {
      return false;
    }
  };

  const getFiltered = () => {
    let list = [...tasks];
    if (view === VIEWS.HOY) list = list.filter((t) => t.deliveryDate && isToday(parseISO(t.deliveryDate)));
    if (view === VIEWS.SEMANA) list = list.filter(inWeek);
    if (filter !== "all") list = list.filter((t) => t.status === filter);
    if (filterCat !== "all") list = list.filter((t) => t.category === filterCat);
    return list;
  };

  const filtered = getFiltered();
  const todayTasks = tasks.filter((t) => t.deliveryDate && isToday(parseISO(t.deliveryDate)));
  const weekTasks = tasks.filter(inWeek);
  const doneTasks = tasks.filter((t) => t.status === "done");
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const filesCount = tasks.reduce((sum, task) => sum + (task.media?.length ?? 0), 0);
  const categories = [...new Set(tasks.map((t) => t.category).filter(Boolean))];

  const getTitle = () => {
    if (view === VIEWS.HOY) return `Hoy, ${format(today, "d 'de' MMMM", { locale: es })}`;
    if (view === VIEWS.SEMANA) return "Tareas de esta semana";
    return "Todas las tareas";
  };

  const navCounts = {
    [VIEWS.HOY]: todayTasks.length,
    [VIEWS.SEMANA]: weekTasks.length,
    [VIEWS.TODAS]: tasks.length,
  };

  return (
    <div className="layout public-site public-layout">
      <aside className="sidebar public-sidebar">
        <div className="public-brand">
          <div className="sidebar-logo public-logo">
            <em>GIA</em><span>LOG</span>
          </div>
          <p>Gestion de tareas clara y organizada</p>
        </div>

        <nav className="public-nav" aria-label="Vistas publicas">
          <div className="nav-label public-nav-label">Vistas</div>
          {viewItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`nav-btn public-nav-btn ${view === id ? "active" : ""}`}
              onClick={() => setView(id)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {navCounts[id] > 0 && <span className="public-count">{navCounts[id]}</span>}
            </button>
          ))}
        </nav>

        <div className="public-summary" aria-label="Resumen de tareas">
          <div className="nav-label public-nav-label">Resumen</div>
          <div className="public-summary-row">
            <span>Total</span>
            <strong>{tasks.length}</strong>
          </div>
          <div className="public-summary-row">
            <span>Completadas</span>
            <strong>{doneTasks.length}</strong>
          </div>
          <div className="public-summary-row">
            <span>Pendientes</span>
            <strong>{pendingTasks.length}</strong>
          </div>
          <div className="public-summary-row">
            <span>Archivos</span>
            <strong>{filesCount}</strong>
          </div>
        </div>
      </aside>

      <main className="main public-main">
        <section className="public-header">
          <div>
            <p className="public-kicker">Panel publico</p>
            <h1>{getTitle()}</h1>
            <p>
              {filtered.length} tarea{filtered.length !== 1 ? "s" : ""} visible
              {filter !== "all" && ` en estado ${filter === "done" ? "completado" : "pendiente"}`}
              {filterCat !== "all" && ` para ${filterCat}`}
            </p>
          </div>
          <div className="public-date-card" aria-label="Fecha actual">
            <span>{format(today, "EEEE", { locale: es })}</span>
            <strong>{format(today, "d", { locale: es })}</strong>
            <small>{format(today, "MMMM yyyy", { locale: es })}</small>
          </div>
        </section>

        <section className="public-metrics" aria-label="Indicadores principales">
          {[
            { label: "Hoy", value: todayTasks.length, Icon: FiSun },
            { label: "Semana", value: weekTasks.length, Icon: FiCalendar },
            { label: "Listas", value: doneTasks.length, Icon: FiCheckCircle },
            { label: "Adjuntos", value: filesCount, Icon: FiPaperclip },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="public-metric">
              <Icon aria-hidden="true" />
              <div>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </section>

        {view === VIEWS.SEMANA && (
          <section className="public-week-panel">
            <WeekView tasks={tasks} isPublic />
          </section>
        )}

        <section className="filters public-filters" aria-label="Filtros">
          {[
            { id: "all", label: "Todas", Icon: FiList },
            { id: "done", label: "Completadas", Icon: FiCheckCircle },
            { id: "pending", label: "Pendientes", Icon: FiClock },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`btn ${filter === id ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setFilter(id)}
            >
              <Icon aria-hidden="true" />
              {label}
            </button>
          ))}
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn ${filterCat === cat ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setFilterCat(filterCat === cat ? "all" : cat)}
            >
              <FiFolder aria-hidden="true" />
              {cat}
            </button>
          ))}
        </section>

        <section className="public-task-list" aria-live="polite">
          {loading ? (
            <div className="loader public-loader">Cargando tareas...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state public-empty">
              <div className="empty-state-icon">
                <FiCalendar aria-hidden="true" />
              </div>
              <div className="empty-state-text">No hay tareas para mostrar</div>
              <p>Aun no se han publicado tareas en esta vista.</p>
            </div>
          ) : (
            filtered.map((task) => <TaskCard key={task.id} task={task} isPublic />)
          )}
        </section>
      </main>
    </div>
  );
}
