// =====================================================================
// UTILS - Funciones utilitarias compartidas
// =====================================================================

window.EduControl = window.EduControl || {};

(function (EC) {
    // Sanitizar HTML para prevenir XSS
    EC.escapeHtml = function (str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    };

    // Generar ID único para estudiantes
    EC.generateStudentId = function () {
        return 'STU-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
    };

    // Buscar estudiante por nombre
    EC.findStudentByName = function (name) {
        return EC.state.allStudents.find(s => s.name === name);
    };

    // Obtener la key de studentDetails para un alumno (usa id si existe, sino nombre)
    EC.getStudentKey = function (student) {
        return student.id || student.name;
    };

    // Obtener datos de studentDetails con fallback: busca por id, luego por nombre
    EC.getStudentDetails = function (student) {
        const key = EC.getStudentKey(student);
        if (EC.state.studentDetails[key]) return EC.state.studentDetails[key];
        // Fallback: buscar por nombre si la key es un id
        if (student.id && EC.state.studentDetails[student.name]) {
            return EC.state.studentDetails[student.name];
        }
        return null;
    };

    // Migrar datos legacy: asignar IDs a estudiantes sin ID y migrar studentDetails
    EC.migrateStudentIds = function () {
        let migrated = false;
        EC.state.allStudents.forEach(s => {
            if (!s.id) {
                s.id = EC.generateStudentId();
                migrated = true;
            }
            // Migrar details/chat de nombre a id si aún están bajo el nombre
            if (s.id && EC.state.studentDetails[s.name]) {
                if (!EC.state.studentDetails[s.id]) {
                    // No data under id yet - move name data to id
                    EC.state.studentDetails[s.id] = EC.state.studentDetails[s.name];
                } else {
                    // Both exist - merge: keep id-based entry but copy payments from name if id has none
                    const idData = EC.state.studentDetails[s.id];
                    const nameData = EC.state.studentDetails[s.name];
                    if ((!idData.payments || idData.payments.length === 0) && nameData.payments && nameData.payments.length > 0) {
                        idData.payments = nameData.payments;
                    }
                    if (idData.mother && idData.mother.name === 'S/D' && nameData.mother && nameData.mother.name !== 'S/D') {
                        idData.mother = nameData.mother;
                    }
                    if (idData.father && idData.father.name === 'S/D' && nameData.father && nameData.father.name !== 'S/D') {
                        idData.father = nameData.father;
                    }
                }
                delete EC.state.studentDetails[s.name];
                migrated = true;
            }
            if (s.id && EC.state.chatHistories[s.name] && !EC.state.chatHistories[s.id]) {
                EC.state.chatHistories[s.id] = EC.state.chatHistories[s.name];
                delete EC.state.chatHistories[s.name];
                migrated = true;
            }
        });
        if (migrated) {
            EC.saveData();
            console.log('Migración de IDs completada para', EC.state.allStudents.length, 'estudiantes.');
        }
    };

    // Animación de valores numéricos
    EC.animateValue = function (id, start, end, duration) {
        let obj = document.getElementById(id);
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            let val = Math.floor(progress * (end - start) + start);
            obj.innerHTML = (id.includes('revenue') ? '$' : '') + val.toLocaleString();
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    };

    // Estado global compartido
    EC.state = {
        currentUser: null,
        currentStudent: null,
        currentTeacher: null,
        currentTutor: null,
        allStudents: [],
        boxBalances: {
            'Recepción': 0,
            'José Bernardo': 0,
            'Georgina A': 0,
            'Banorte': 0,
            'Mercado Pago': 0,
            'Otros': 0
        },
        financialHistory: [],
        studentDetails: {},
        teachers: [],
        teacherGroups: {},
        periodGrades: {},
        subjects: [],
        tutors: [],
        tutorChildren: {},
        chatHistories: {}
    };

    // Frases del día
    EC.quotes = [
        { text: "Largo es el camino de la enseñanza por medio de teorías; breve y eficaz por medio de ejemplos.", author: "Séneca" },
        { text: "La educación es el encendido de una llama, no el llenado de un recipiente.", author: "Sócrates" },
        { text: "La inteligencia más el carácter, esa es la meta de la verdadera educación.", author: "Martin Luther King Jr." },
        { text: "Donde hay educación, no hay distinción de clases.", author: "Confucio" },
        { text: "El objetivo de la educación es preparar a los jóvenes para que se eduquen a sí mismos durante toda su vida.", author: "Robert M. Hutchins" },
        { text: "Educar la mente sin educar el corazón no es educación en absoluto.", author: "Aristóteles" },
        { text: "La raíces de la educación son amargas, pero la fruta es dulce.", author: "Aristóteles" },
        { text: "Vive como si fueras a morir mañana. Aprende como si fueras a vivir siempre.", author: "Mahatma Gandhi" }
    ];

    // Elementos del DOM reutilizados
    EC.dom = {};

    EC.initDom = function () {
        EC.dom.dashboardHome = document.getElementById('dashboard-home');
        EC.dom.recentActivity = document.querySelector('.recent-activity');
        EC.dom.tableBody = document.getElementById('activity-table-body');
        EC.dom.tableHead = document.querySelector('#main-table-container thead tr');
        EC.dom.viewTitle = document.getElementById('view-title');
        EC.dom.btnBack = document.getElementById('btn-back');
        EC.dom.groupFilter = document.getElementById('group-filter');
        EC.dom.studentModal = document.getElementById('student-modal');
        EC.dom.teacherModal = document.getElementById('teacher-modal');
        EC.dom.tutorModal = document.getElementById('tutor-modal');
    };

})(window.EduControl);
