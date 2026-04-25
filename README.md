# 📋 TaskLog — Gestor de Tareas con React + Firebase

## 🚀 Instalación rápida

```bash
npm install
npm run dev
```

---

## 🔥 Configurar Firebase (OBLIGATORIO)

### Paso 1 — Crear proyecto en Firebase
1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Clic en **"Agregar proyecto"** → Ponle un nombre
3. Desactiva Google Analytics (opcional) → **Crear proyecto**

### Paso 2 — Activar Firestore
1. En el menú lateral → **Firestore Database**
2. Clic en **"Crear base de datos"**
3. Elige **"Comenzar en modo de prueba"** (para desarrollo)
4. Selecciona la región más cercana → **Habilitar**

### Paso 3 — Activar Storage
1. En el menú lateral → **Storage**
2. Clic en **"Comenzar"**
3. Modo de prueba → **Listo**

### Paso 4 — Obtener credenciales
1. En el menú lateral → **Configuración del proyecto** (ícono de engranaje)
2. Pestaña **"General"** → baja hasta **"Tus apps"**
3. Clic en el ícono `</>` para agregar app web
4. Ponle un nombre y clic en **"Registrar app"**
5. Copia el objeto `firebaseConfig`

### Paso 5 — Pegar credenciales
Abre `src/firebase.js` y reemplaza los valores:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY_REAL",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};
```

---

## 📁 Estructura del proyecto

```
src/
  firebase.js          ← Configuración Firebase (pon tus credenciales aquí)
  main.jsx             ← Punto de entrada React
  App.jsx              ← Componente principal
  components/
    TaskForm.jsx       ← Formulario crear/editar tareas
    TaskCard.jsx       ← Card de cada tarea
    WeekView.jsx       ← Vista de semana en cuadrícula
  styles/
    index.css          ← Todos los estilos
```

---

## ✨ Funcionalidades

- ✅ Registrar tareas con título, descripción y categoría
- ⏰ Fecha y hora de **pedido** y de **entrega**
- ⚡ Cálculo automático del tiempo de respuesta
- 📎 Subir **imágenes y videos** por tarea
- 🖼 Lightbox para ver archivos en pantalla completa
- 📅 Vista **Hoy** / **Esta semana** / **Todas**
- 📆 **Cuadrícula semanal** con tareas por día
- 🔍 Filtros por estado (completada/pendiente) y categoría
- 🔄 Actualización en **tiempo real** con Firestore
- 📊 Estadísticas de productividad

---

## 👑 Crear la cuenta Admin (tu clienta)

### Paso 1 — Activar Authentication en Firebase
1. Firebase Console → **Authentication** → **Comenzar**
2. Pestaña **"Sign-in method"** → habilitar **Correo electrónico/Contraseña** → Guardar

### Paso 2 — Crear el usuario admin
1. En Authentication → pestaña **"Users"** → **"Añadir usuario"**
2. Pon el correo y contraseña de tu clienta → **Añadir usuario**
3. ¡Listo! Ese correo y contraseña son los que usará para entrar como Admin

> El panel es **público para visitantes** (solo lectura) y solo quien tenga
> las credenciales podrá crear, editar y subir archivos.

---

## 🔒 Reglas Firestore recomendadas para producción

En Firebase Console → Firestore → Reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

> Para agregar autenticación, instala Firebase Auth y añade login con Google o email.
