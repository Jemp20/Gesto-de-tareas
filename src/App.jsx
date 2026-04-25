// src/App.jsx
import PublicView from "./views/PublicView";
import AdminView  from "./views/AdminView";

// Decide qué renderizar según la URL — sin mezclar nunca los dos
export default function App() {
  const onAdmin = window.location.pathname === "/admin";
  return onAdmin ? <AdminView /> : <PublicView />;
}
