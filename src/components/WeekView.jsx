// src/components/WeekView.jsx
import { useState } from "react";
import TaskCard from "./TaskCard";
import {
  startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth,
  format, isSameDay, isToday, addWeeks, subWeeks,
  addMonths, subMonths, addDays, subDays,
} from "date-fns";
import { es } from "date-fns/locale";

const MODES = { DIA: "dia", SEMANA: "semana", MES: "mes" };

export default function WeekView({ tasks, onDayClick, selectedDay = null, isPublic = false }) {
  const [mode,        setMode]        = useState(MODES.SEMANA);
  const [currentDate, setCurrentDate] = useState(new Date());

  // ── Navegación ──────────────────────────────────────────
  const goBack = () => {
    if (mode === MODES.DIA)    setCurrentDate((d) => subDays(d, 1));
    if (mode === MODES.SEMANA) setCurrentDate((d) => subWeeks(d, 1));
    if (mode === MODES.MES)    setCurrentDate((d) => subMonths(d, 1));
  };
  const goForward = () => {
    if (mode === MODES.DIA)    setCurrentDate((d) => addDays(d, 1));
    if (mode === MODES.SEMANA) setCurrentDate((d) => addWeeks(d, 1));
    if (mode === MODES.MES)    setCurrentDate((d) => addMonths(d, 1));
  };
  const goToday = () => setCurrentDate(new Date());

  // ── Días a mostrar según modo ────────────────────────────
  const getDays = () => {
    if (mode === MODES.DIA) return [currentDate];
    if (mode === MODES.SEMANA) {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end   = endOfWeek(currentDate,   { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    if (mode === MODES.MES) {
      const start = startOfMonth(currentDate);
      const end   = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
    return [];
  };

  const days = getDays();

  const getTasksForDay = (day) =>
    tasks.filter((t) => {
      if (!t.deliveryDate) return false;
      return isSameDay(new Date(t.deliveryDate + "T12:00:00"), day);
    });

  // ── Título del período ───────────────────────────────────
  const getTitle = () => {
    if (mode === MODES.DIA)
      return format(currentDate, "EEEE d 'de' MMMM yyyy", { locale: es });
    if (mode === MODES.SEMANA) {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end   = endOfWeek(currentDate,   { weekStartsOn: 1 });
      return `Semana del ${format(start, "d MMM", { locale: es })} al ${format(end, "d MMM yyyy", { locale: es })}`;
    }
    if (mode === MODES.MES)
      return format(currentDate, "MMMM yyyy", { locale: es });
  };

  // ── Estilos inline reutilizables ────────────────────────
  const btnMode = (m) => ({
    padding: "0.3rem 0.7rem",
    fontSize: "0.72rem",
    fontWeight: 700,
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    cursor: "pointer",
    background: mode === m ? "var(--accent)" : "transparent",
    color:      mode === m ? "var(--bg)"     : "var(--muted)",
    transition: "all 0.15s",
  });

  const btnNav = {
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "var(--radius)",
    padding: "0.3rem 0.65rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    lineHeight: 1,
  };

  return (
    <div className="calendar-view">
      {/* ── Controles ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {/* Selector de modo */}
        <div style={{ display: "flex", gap: "0.3rem" }}>
          {[MODES.DIA, MODES.SEMANA, MODES.MES].map((m) => (
            <button key={m} style={btnMode(m)} onClick={() => setMode(m)}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Navegación */}
        <div style={{ display: "flex", gap: "0.3rem", marginLeft: "0.5rem" }}>
          <button style={btnNav} onClick={goBack}>‹</button>
          <button style={{ ...btnNav, fontSize: "0.72rem", padding: "0.3rem 0.6rem" }} onClick={goToday}>Hoy</button>
          <button style={btnNav} onClick={goForward}>›</button>
        </div>

        {/* Título */}
        <div style={{
          fontSize: "0.75rem", color: "var(--muted)",
          letterSpacing: "1px", textTransform: "uppercase",
          marginLeft: "0.3rem",
        }}>
          {getTitle()}
        </div>
      </div>

      {/* ── Vista Día ── */}
      {mode === MODES.DIA && (
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "1.2rem",
          minHeight: 120,
        }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: "2rem", fontWeight: 800,
            color: isToday(currentDate) ? "var(--accent)" : "var(--text)", marginBottom: "0.8rem" }}>
            {format(currentDate, "d")}
            {isToday(currentDate) && (
              <span style={{ fontSize: "0.7rem", marginLeft: "0.5rem", color: "var(--accent)",
                letterSpacing: "2px", verticalAlign: "middle" }}>HOY</span>
            )}
          </div>
          {getTasksForDay(currentDate).length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "var(--border)" }}>Sin tareas este día</div>
          ) : (
            <div style={{ marginTop: "0.5rem" }}>
              {getTasksForDay(currentDate).map((t) => (
                <TaskCard key={t.id} task={t} isPublic={isPublic} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Vista Semana ── */}
      {mode === MODES.SEMANA && (
        <div className="week-grid">
          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={`week-day ${isToday(day) ? "today" : ""}`}
                onClick={() => { onDayClick?.(day); setCurrentDate(day); setMode(MODES.DIA); }}
                style={{ cursor: "pointer", outline: selectedDay && isSameDay(day, selectedDay) ? "2px solid var(--accent)" : "none", outlineOffset: "2px" }}
              >
                <div className="week-day-label">{format(day, "EEE", { locale: es })}</div>
                <div className="week-day-num">{format(day, "d")}</div>
                {dayTasks.length === 0 ? (
                  <div style={{ fontSize: "0.65rem", color: "var(--border)" }}>—</div>
                ) : (
                  dayTasks.slice(0, 3).map((t, i) => (
                    <div key={i} className="week-task-dot"
                      style={{ color: t.status === "done" ? "var(--success)" : "var(--accent2)" }}>
                      • {t.title}
                    </div>
                  ))
                )}
                {dayTasks.length > 3 && (
                  <div style={{ fontSize: "0.65rem", color: "var(--muted)" }}>+{dayTasks.length - 3} más</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Vista Mes ── */}
      {mode === MODES.MES && (
        <div className="month-calendar">
          {/* Cabecera días de la semana */}
          <div className="month-weekdays">
            {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => (
              <div key={d} className="month-weekday">
                {d}
              </div>
            ))}
          </div>

          {/* Celdas del mes */}
          <div className="month-grid">
            {/* Espacios vacíos antes del primer día (lunes=0) */}
            {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="month-empty" aria-hidden="true" />
            ))}
            {days.map((day) => {
              const dayTasks = getTasksForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`month-day ${isToday(day) ? "today" : ""}`}
                  onClick={() => { setCurrentDate(day); setMode(MODES.DIA); }}
                  style={{
                    background: isToday(day) ? "rgba(232,255,71,0.08)" : "var(--surface)",
                    border: `1px solid ${isToday(day) ? "var(--accent)" : "var(--border)"}`,
                  }}
                >
                  <div className="month-day-number" style={{ color: isToday(day) ? "var(--accent)" : "var(--text)" }}>
                    {format(day, "d")}
                  </div>
                  {dayTasks.slice(0, 2).map((t, i) => (
                    <div
                      key={i}
                      className="month-task"
                      style={{ color: t.status === "done" ? "var(--success)" : "var(--accent2)" }}
                      title={t.title}
                    >
                      • {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="month-more">+{dayTasks.length - 2}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
