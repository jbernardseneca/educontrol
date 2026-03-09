// =====================================================================
// CONFIGURACIÓN FIREBASE - EduControl Seneca
// =====================================================================
// INSTRUCCIONES DE CONFIGURACIÓN:
//
// 1. Ve a: https://console.firebase.google.com
// 2. Inicia sesión con: educativo.seneca@gmail.com
// 3. Clic en "Agregar proyecto" → Nombrar: "educontrol-seneca"
// 4. En el proyecto creado:
//    a) Clic en "Firestore Database" → Crear base de datos → Modo de prueba
//    b) Clic en "Authentication" → Comenzar → Habilitar "Correo/Contraseña"
//    c) Clic en "Configuración del proyecto" (ícono ⚙) → "Tus apps" → Web (</>)
//    d) Registrar app como "EduControl Web" → Copiar el firebaseConfig que aparece
//    e) Pegar aquí reemplazando los valores de abajo
// =====================================================================

const firebaseConfig = {
    apiKey: "AIzaSyAqrtT0qgkvOKldBd_uh26CEyQuB7g3NH4",
    authDomain: "educontrol-seneca.firebaseapp.com",
    projectId: "educontrol-seneca",
    storageBucket: "educontrol-seneca.firebasestorage.app",
    messagingSenderId: "528706471723",
    appId: "1:528706471723:web:96c50e4e7a48039b06a76e",
    measurementId: "G-J7J91H8LE7"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Habilitar persistencia offline (permite que la app funcione
// brevemente sin internet y sincronice al reconectar)
db.enablePersistence({ synchronizeTabs: true })
    .catch(err => {
        if (err.code === 'failed-precondition') {
            console.warn('Persistencia deshabilitada: múltiples pestañas abiertas.');
        } else if (err.code === 'unimplemented') {
            console.warn('Persistencia offline no soportada en este navegador.');
        }
    });

// =====================================================================
// CREAR PRIMER USUARIO ADMINISTRADOR:
//
// Una vez que hayas configurado Firebase, necesitas crear el usuario
// admin manualmente. Sigue estos pasos:
//
// 1. En Firebase Console → Authentication → Users → Agregar usuario
//    Email:    admin@educativoseneca.edu.mx
//    Password: (elige una contraseña segura)
//    Anota el UID que aparece después de crearlo.
//
// 2. En Firebase Console → Firestore → Iniciar colección:
//    Colección: "users"
//    Document ID: (el UID que copiaste del paso anterior)
//    Campos:
//      email  (string): admin@educativoseneca.edu.mx
//      name   (string): Administrador
//      role   (string): ADMIN
//
// 3. Repite para los demás roles:
//    TESORERIA → role: "TESORERIA"
//    MAESTRO   → role: "MAESTRO"
//    PADRE     → role: "PADRE", studentName: "Nombre Completo del Alumno"
// =====================================================================
