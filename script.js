document.addEventListener('DOMContentLoaded', () => {

    // --- ESTADO ACTUAL DE USUARIO ---
    let currentUser = null;

    // --- DATOS EN MEMORIA (se cargan desde Firestore al iniciar sesión) ---
    let allStudents = [];
    let boxBalances = {
        'Recepción': 0,
        'José Bernardo': 0,
        'Georgina A': 0,
        'Banorte': 0,
        'Mercado Pago': 0,
        'Otros': 0
    };
    let financialHistory = [];
    let studentDetails = {};
    let teachers = [];
    let teacherGroups = {};
    let periodGrades = {};
    let subjects = [];
    let tutors = [];
    let tutorChildren = {};
    let chatHistories = {};

    // --- CARGA DE DATOS DESDE FIRESTORE ---
    async function loadAllData() {
        try {
            showLoadingState(true);
            const [studentsDoc, balancesDoc, historyDoc, detailsDoc,
                teachersDoc, tGroupsDoc, pGradesDoc, subjectsDoc,
                tutorsDoc, tChildrenDoc, chatDoc] = await Promise.all([
                    db.collection('crm_data').doc('students').get(),
                    db.collection('crm_data').doc('balances').get(),
                    db.collection('crm_data').doc('history').get(),
                    db.collection('crm_data').doc('details').get(),
                    db.collection('crm_data').doc('teachers').get(),
                    db.collection('crm_data').doc('teacherGroups').get(),
                    db.collection('crm_data').doc('periodGrades').get(),
                    db.collection('crm_data').doc('subjects').get(),
                    db.collection('crm_data').doc('tutors').get(),
                    db.collection('crm_data').doc('tutorChildren').get(),
                    db.collection('crm_data').doc('chatHistories').get(),
                ]);

            allStudents = studentsDoc.exists ? (studentsDoc.data().data || []) : [];
            boxBalances = balancesDoc.exists ? (balancesDoc.data().data || boxBalances) : boxBalances;
            financialHistory = historyDoc.exists ? (historyDoc.data().data || []) : [];
            studentDetails = detailsDoc.exists ? (detailsDoc.data().data || {}) : {};
            teachers = teachersDoc.exists ? (teachersDoc.data().data || []) : [];
            teacherGroups = tGroupsDoc.exists ? (tGroupsDoc.data().data || {}) : {};
            periodGrades = pGradesDoc.exists ? (pGradesDoc.data().data || {}) : {};
            subjects = subjectsDoc.exists ? (subjectsDoc.data().data || []) : [];
            tutors = tutorsDoc.exists ? (tutorsDoc.data().data || []) : [];
            tutorChildren = tChildrenDoc.exists ? (tChildrenDoc.data().data || {}) : {};
            chatHistories = chatDoc.exists ? (chatDoc.data().data || {}) : {};

            showLoadingState(false);
        } catch (error) {
            console.error('Error cargando datos de Firestore:', error);
            showLoadingState(false);
            alert('Error al conectar con la base de datos. Verifica tu conexión a internet.');
        }
    }

    function showLoadingState(isLoading) {
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.disabled = isLoading;
            loginBtn.innerHTML = isLoading
                ? '<i class="fas fa-spinner fa-spin"></i> Cargando...'
                : '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
        }
    }

    // --- FIN INICIALIZACIÓN ---



    const quotes = [
        { text: "Largo es el camino de la enseñanza por medio de teorías; breve y eficaz por medio de ejemplos.", author: "Séneca" },
        { text: "La educación es el encendido de una llama, no el llenado de un recipiente.", author: "Sócrates" },
        { text: "La inteligencia más el carácter, esa es la meta de la verdadera educación.", author: "Martin Luther King Jr." },
        { text: "Donde hay educación, no hay distinción de clases.", author: "Confucio" },
        { text: "El objetivo de la educación es preparar a los jóvenes para que se eduquen a sí mismos durante toda su vida.", author: "Robert M. Hutchins" },
        { text: "Educar la mente sin educar el corazón no es educación en absoluto.", author: "Aristóteles" },
        { text: "La raíces de la educación son amargas, pero la fruta es dulce.", author: "Aristóteles" },
        { text: "Vive como si fueras a morir mañana. Aprende como si fueras a vivir siempre.", author: "Mahatma Gandhi" }
    ];






    function updateDashboardStats() {
        // Alumnos activos
        const activeStudents = allStudents.filter(s => s.status === 'Activo').length;

        // Profesores
        const totalTeachers = teachers.length;

        // Cursos (Materias únicas)
        const totalCourses = subjects.length;

        // Ingresos del mes actual
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const monthlyRevenue = financialHistory.reduce((acc, t) => {
            if (t.type === 'ENTRY') {
                const [datePart] = t.date.split(' ');
                const [day, month, year] = datePart.split('/');
                if (parseInt(month) === currentMonth && parseInt(year) === currentYear) {
                    return acc + t.amount;
                }
            }
            return acc;
        }, 0);

        // Animación de los valores
        animateValue('total-students', 0, activeStudents, 1000);
        animateValue('total-teachers', 0, totalTeachers, 1000);
        animateValue('total-courses', 0, totalCourses, 1000);
        animateValue('monthly-revenue', 0, monthlyRevenue, 1500);
    }

    // --- FUNCIONES DE GUARDADO Y CARGA ---
    async function saveData() {
        try {
            // Guardar todos los datos en Firestore (escritura en paralelo)
            await Promise.all([
                db.collection('crm_data').doc('students').set({ data: allStudents }),
                db.collection('crm_data').doc('balances').set({ data: boxBalances }),
                db.collection('crm_data').doc('history').set({ data: financialHistory }),
                db.collection('crm_data').doc('details').set({ data: studentDetails }),
                db.collection('crm_data').doc('teachers').set({ data: teachers }),
                db.collection('crm_data').doc('teacherGroups').set({ data: teacherGroups }),
                db.collection('crm_data').doc('periodGrades').set({ data: periodGrades }),
                db.collection('crm_data').doc('subjects').set({ data: subjects }),
                db.collection('crm_data').doc('tutors').set({ data: tutors }),
                db.collection('crm_data').doc('tutorChildren').set({ data: tutorChildren }),
                db.collection('crm_data').doc('chatHistories').set({ data: chatHistories }),
            ]);
            updateDashboardStats();
        } catch (error) {
            console.error('Error guardando en Firestore:', error);
            alert('Advertencia: no se pudo guardar en la nube. Verifica tu conexión.');
        }
    }

    // --- ELEMENTOS DEL DOM ---

    const dashboardHome = document.getElementById('dashboard-home');
    const recentActivity = document.querySelector('.recent-activity');
    const tableBody = document.getElementById('activity-table-body');
    const tableHead = document.querySelector('thead tr');
    const viewTitle = document.getElementById('view-title');
    const btnBack = document.getElementById('btn-back');
    const groupFilter = document.getElementById('group-filter');
    const studentModal = document.getElementById('student-modal');
    const teacherModal = document.getElementById('teacher-modal');
    const tutorModal = document.getElementById('tutor-modal');

    // --- FUNCIONES AUTENTICACIÓN Y ROLES (Firebase Auth) ---

    window.handleLogin = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-username').value.trim();
        const pass = document.getElementById('login-password').value;
        const errorMsg = document.getElementById('login-error-msg');

        try {
            showLoadingState(true);

            // 1. Autenticar con Firebase
            const credential = await auth.signInWithEmailAndPassword(email, pass);
            const uid = credential.user.uid;

            // 2. Obtener perfil y rol desde Firestore
            const userDoc = await db.collection('users').doc(uid).get();
            if (!userDoc.exists) {
                await auth.signOut();
                errorMsg.innerText = `⚠️ Sin perfil. UID del usuario: ${uid} — Cópielo y úselo como Document ID en Firestore → users`;
                errorMsg.style.display = 'block';
                showLoadingState(false);
                return;
            }

            currentUser = { uid, ...userDoc.data() };

            // 3. Cargar todos los datos de la escuela
            await loadAllData();

            // 4. Mostrar la app
            errorMsg.style.display = 'none';
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('main-app-container').style.display = 'flex';
            document.getElementById('header-user-name').innerText = currentUser.name;
            document.getElementById('header-user-avatar').src =
                `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0D8ABC&color=fff`;

            applyRoleRestrictions(currentUser.role);

        } catch (error) {
            console.error('Error de autenticación:', error);
            let msg = 'Correo o contraseña incorrectos.';
            if (error.code === 'auth/too-many-requests') msg = 'Demasiados intentos. Intenta más tarde.';
            if (error.code === 'auth/network-request-failed') msg = 'Sin conexión a internet.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') msg = 'Correo o contraseña incorrectos.';
            errorMsg.innerText = `⚠️ ${msg}`;
            errorMsg.style.display = 'block';
            showLoadingState(false);
        }
    };

    window.logout = async () => {
        await auth.signOut();
        currentUser = null;
        // Limpiar datos en memoria
        allStudents = []; financialHistory = []; studentDetails = {};
        teachers = []; subjects = []; tutors = []; chatHistories = {};

        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('main-app-container').style.display = 'none';
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        document.body.classList.remove('padre-readonly-mode');
        document.querySelectorAll('.hidden-by-role').forEach(n => n.classList.remove('hidden-by-role'));
        showLoadingState(false);
    };

    function applyRoleRestrictions(role) {
        // Reset permissions first
        document.body.classList.remove('padre-readonly-mode');
        document.querySelectorAll('.hidden-by-role').forEach(n => n.classList.remove('hidden-by-role'));
        document.getElementById('top-search-bar').style.display = 'flex';

        // Mostrar todos los nav items por defecto
        const navs = ['nav-home', 'nav-students', 'nav-teachers', 'nav-tutors', 'nav-courses', 'nav-payments', 'nav-services', 'nav-reports', 'nav-settings'];
        navs.forEach(id => { if (document.getElementById(id)) document.getElementById(id).style.display = 'block'; });

        if (role === 'ADMIN') {
            showSubjects();
        } else if (role === 'TESORERIA') {
            showStudents();
        } else if (role === 'MAESTRO') {
            ['nav-payments', 'nav-services', 'nav-reports', 'nav-settings'].forEach(id => {
                if (document.getElementById(id)) document.getElementById(id).style.display = 'none';
            });
            showStudents();
        } else if (role === 'PADRE') {
            // Modo solo lectura: el padre ve únicamente el expediente de su hijo
            document.body.classList.add('padre-readonly-mode');
            // currentUser.studentName viene del perfil en Firestore
            const hijoName = currentUser.studentName || '';
            if (hijoName) {
                viewExpediente(hijoName);
            } else {
                alert('Tu perfil no tiene alumno asignado. Contacta al administrador.');
            }
        }
    }


    // --- FUNCIONES HELPER ---

    function updateNav(activeId) {
        document.querySelectorAll('nav ul li').forEach(li => li.classList.remove('active'));
        const activeLink = document.getElementById(activeId);
        if (activeLink) activeLink.classList.add('active');

        // Manejo del botón de captura por lote
        const btnBatch = document.getElementById('btn-batch-capture');
        if (activeId === 'nav-students') {
            btnBatch.style.display = 'block';
        } else {
            btnBatch.style.display = 'none';
        }
    }

    function updateDailyQuote() {
        const title = document.getElementById('welcome-title');
        const quote = document.getElementById('daily-quote');
        const day = new Date().getDate();
        const hour = new Date().getHours();
        const selected = quotes[day % quotes.length];
        let greeting = hour < 12 ? "¡Buenos días!" : (hour < 19 ? "¡Buenas tardes!" : "¡Buenas noches!");
        if (title) title.innerText = `${greeting} Bienvenido al Panel Escolar`;
        if (quote) quote.innerHTML = `"${selected.text}" <br><strong>- ${selected.author}</strong>`;
    }

    // --- VISTAS PRINCIPALES ---

    window.showSubjects = () => {
        updateNav('nav-home');
        dashboardHome.style.display = 'block';
        recentActivity.style.display = 'block';
        viewTitle.innerText = 'Materias Asignadas';
        btnBack.style.display = 'none';
        groupFilter.style.display = 'none';
        tableHead.innerHTML = `<th>Materia</th><th>Grupo</th><th>Alumnos</th><th>Acción</th>`;
        tableBody.innerHTML = '';
        subjects.forEach(sub => {
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${sub.name}</strong></td><td>${sub.group}</td><td>${sub.studentsCount}</td><td><button class="btn-action" onclick="viewStudents(${sub.id}, '${sub.name}')">Ver Alumnos</button></td>`;
            tableBody.appendChild(row);
        });
    };

    window.showStudents = (filter = 'all') => {
        updateNav('nav-students');
        dashboardHome.style.display = 'none';
        recentActivity.style.display = 'block';
        viewTitle.innerText = 'Listado de Alumnos';
        btnBack.style.display = 'none';
        groupFilter.style.display = 'block';

        // Reset view containers
        document.getElementById('main-table-container').style.display = 'block';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('reports-container').style.display = 'none';
        document.getElementById('services-batch-container').style.display = 'none';

        tableHead.innerHTML = `<th>Nombre</th><th>Nivel</th><th>Grado</th><th>Estado</th><th>Acción</th>`;
        tableBody.innerHTML = '';
        let list = filter === 'all' ? allStudents : allStudents.filter(s => s.level === filter);
        list.sort((a, b) => a.level.localeCompare(b.level));
        list.forEach(s => {
            const row = document.createElement('tr');
            const statusClass = s.status === 'Activo' ? 'status-paid' : 'status-due';

            // Permisos para botones en la tabla:
            const canDelete = currentUser && currentUser.role === 'ADMIN';

            row.innerHTML = `
                <td><strong>${s.name}</strong></td>
                <td>${s.level}</td>
                <td>${s.grade}</td>
                <td><span class="${statusClass}">${s.status}</span></td>
                <td>
                    <button class="btn-action" onclick="viewExpediente('${s.name}')">Ver</button>
                    ${s.status === 'Activo' && canDelete ? `<button class="btn-action" style="color:#ef4444;" onclick="unenrollStudent('${s.name}')" title="Dar de Baja"><i class="fas fa-user-minus"></i> Baja</button>` : ''}
                    ${canDelete ? `<button class="btn-action" style="color:#dc2626;" onclick="deleteStudent('${s.name}')" title="Eliminar Definitivamente"><i class="fas fa-trash-alt"></i> Eliminar</button>` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
    };

    window.unenrollStudent = (name) => {
        if (confirm(`¿Está seguro que desea dar de BAJA al alumno: ${name}?`)) {
            const student = allStudents.find(s => s.name === name);
            if (student) {
                student.status = 'Baja';
                saveData();
                showStudents(groupFilter.value); // Recargar vista actual
                alert(`El alumno ${name} ha sido dado de baja exitosamente.`);
            }
        }
    };

    window.deleteStudent = (name) => {
        if (confirm(`¡ADVERTENCIA! ¿Está seguro que desea ELIMINAR PERMANENTEMENTE a: ${name}?\nEsta acción borrará todo su historial y no se puede deshacer.`)) {
            if (confirm(`Confirme nuevamente: ¿Realmente desea borrar a ${name}?`)) {
                const index = allStudents.findIndex(s => s.name === name);
                if (index !== -1) {
                    allStudents.splice(index, 1);
                    delete studentDetails[name];
                    saveData();
                    showStudents(groupFilter.value);
                    alert(`El registro de ${name} ha sido eliminado totalmente.`);
                }
            }
        }
    };

    window.showTeachers = () => {
        updateNav('nav-teachers');
        dashboardHome.style.display = 'none';
        recentActivity.style.display = 'block';
        viewTitle.innerText = 'Listado de Maestros';
        btnBack.style.display = 'none';
        groupFilter.style.display = 'block';

        document.getElementById('main-table-container').style.display = 'block';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('reports-container').style.display = 'none';

        tableHead.innerHTML = `<th>Nombre</th><th>Nivel</th><th>Profesión</th><th>Acción</th>`;
        tableBody.innerHTML = '';
        teachers.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${t.name}</strong></td><td>${t.level}</td><td>${t.profession}</td><td><button class="btn-action" onclick="viewTeacherExpediente('${t.name}')">Ver Expediente</button></td>`;
            tableBody.appendChild(row);
        });
    };

    function showTutors() {
        updateNav('nav-tutors');
        dashboardHome.style.display = 'none';
        recentActivity.style.display = 'block';
        viewTitle.innerText = 'Listado de Tutores';
        btnBack.style.display = 'none';
        groupFilter.style.display = 'none';

        document.getElementById('main-table-container').style.display = 'block';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('reports-container').style.display = 'none';

        tableHead.innerHTML = `<th>Nombre</th><th>Teléfono</th><th>Email</th><th>Acción</th>`;
        tableBody.innerHTML = '';
        tutors.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${t.name}</strong></td><td>${t.phone}</td><td>${t.email}</td><td><button class="btn-action" onclick="viewTutorExpediente('${t.name}')">Ver Datos</button></td>`;
            tableBody.appendChild(row);
        });
    }

    function showCourses() {
        updateNav('nav-courses');
        dashboardHome.style.display = 'none';
        recentActivity.style.display = 'block';
        viewTitle.innerText = 'Catálogo de Cursos';
        btnBack.style.display = 'none';
        groupFilter.style.display = 'none';

        document.getElementById('main-table-container').style.display = 'block';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('reports-container').style.display = 'none';

        tableHead.innerHTML = `<th>Curso</th><th>Grupo</th><th>Maestro</th><th>Acción</th>`;
        tableBody.innerHTML = '';
        subjects.forEach(sub => {
            let tName = "Por asignar";
            for (let t in teacherGroups) if (teacherGroups[t].some(g => g.id === sub.id)) tName = t;
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${sub.name}</strong></td><td>${sub.group}</td><td>${tName}</td><td><button class="btn-action" onclick="viewGroupGrades(${sub.id}, '${sub.name}')">Ver Alumnos</button></td>`;
            tableBody.appendChild(row);
        });
    }

    // --- MÓDULO DE PAGOS / CAJA ---

    function showPaymentsModule() {
        updateNav('nav-payments');
        dashboardHome.style.display = 'none';
        recentActivity.style.display = 'block';
        viewTitle.innerText = 'Caja y Cobranza';
        btnBack.style.display = 'none';
        groupFilter.style.display = 'none';

        document.getElementById('main-table-container').style.display = 'none';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'block';
        document.getElementById('reports-container').style.display = 'none';
        document.getElementById('services-batch-container').style.display = 'none';

        // Actualizar datalist de alumnos
        const datalist = document.getElementById('students-datalist');
        datalist.innerHTML = allStudents.map(s => `<option value="${s.name}">`).join('');
    }

    window.onPaymentStudentSelect = (name) => {
        const student = allStudents.find(s => s.name === name);
        const gradeInput = document.getElementById('pay-student-grade');
        if (student) {
            gradeInput.value = student.grade;
        } else {
            gradeInput.value = '';
        }
    };

    window.toggleOtherConcept = (val) => {
        document.getElementById('other-concept-div').style.display = val === 'Otros' ? 'block' : 'none';
        document.getElementById('month-select-div').style.display = val === 'Colegiatura' ? 'block' : 'none';
    };

    window.resetPaymentForm = () => {
        document.getElementById('pay-student-search').value = '';
        document.getElementById('pay-student-grade').value = '';
        document.getElementById('pay-concept').value = '';
        document.getElementById('pay-amount').value = '';
        document.getElementById('pay-concept-other').value = '';
        toggleOtherConcept('');
    };

    window.processPayment = () => {
        const name = document.getElementById('pay-student-search').value;
        const concept = document.getElementById('pay-concept').value;
        const amount = document.getElementById('pay-amount').value;
        const month = document.getElementById('pay-month').value;
        const method = document.getElementById('pay-method').value;
        const receiver = document.getElementById('pay-receiver').value;

        if (!name || !concept || !amount) {
            alert('Por favor complete todos los datos del pago.');
            return;
        }

        const finalConcept = concept === 'Otros' ? document.getElementById('pay-concept-other').value : concept;
        const conceptLabel = concept === 'Colegiatura' ? `${finalConcept} (${month})` : finalConcept;
        const folio = `${method === 'Efectivo' ? 'EF' : (method === 'Tarjeta' ? 'TJ' : 'TR')}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // VINCULACIÓN CON EXPEDIENTE
        if (!studentDetails[name]) {
            studentDetails[name] = { mother: { name: 'S/D' }, father: { name: 'S/D' }, payments: [] };
        }
        if (!studentDetails[name].payments) {
            studentDetails[name].payments = [];
        }

        studentDetails[name].payments.push({
            type: 'ABONO',
            date: new Date().toLocaleDateString(),
            concept: conceptLabel,
            amount: parseFloat(amount),
            folio: folio,
            method: method,
            receiver: receiver,
            status: 'PAGADO'
        });

        // REGISTRO EN CONTABILIDAD DE CAJAS
        boxBalances[receiver] += parseFloat(amount);
        financialHistory.push({
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
            box: receiver,
            concept: `PAGO ALUMNO: ${name} (${conceptLabel})`,
            type: 'ENTRY',
            amount: parseFloat(amount),
            folio: folio
        });

        saveData();
        alert(`¡PAGO PROCESADO!\nAlumno: ${name}\nConcepto: ${conceptLabel}\nForma: ${method}\nRecibe: ${receiver}\nFolio: ${folio}`);
        resetPaymentForm();
    };

    // --- MÓDULO DE EGRESOS / GASTOS ---
    window.showExpenses = () => {
        updateNav('nav-expenses');
        dashboardHome.style.display = 'none';
        recentActivity.style.display = 'none';
        viewTitle.innerText = 'Gastos y Egresos';
        btnBack.style.display = 'none';
        groupFilter.style.display = 'none';

        document.getElementById('main-table-container').style.display = 'none';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('reports-container').style.display = 'none';
        document.getElementById('services-batch-container').style.display = 'none';
        document.getElementById('expenses-container').style.display = 'block';

        document.getElementById('expense-date').valueAsDate = new Date();
        renderExpensesTable();
    };

    window.processExpense = (e) => {
        e.preventDefault();
        const concept = document.getElementById('expense-concept').value.trim();
        const receiver = document.getElementById('expense-receiver').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;
        const box = document.getElementById('expense-box').value;

        if (!concept || !receiver || !amount || !date || !box) return alert("Por favor complete todos los campos.");

        if (boxBalances[box] < amount) {
            const confirmOverdraft = confirm(`La caja ${box} solo tiene $${boxBalances[box].toLocaleString()}. ¿Desea registrar el gasto de todos modos dejándola en negativo?`);
            if (!confirmOverdraft) return;
        }

        const expenseRecord = {
            id: 'EXP-' + Date.now(),
            date: date,
            type: 'EXIT',
            concept: concept,
            receiver: receiver, // Proveedor o Maestro
            amount: amount,
            box: box,
            timestamp: new Date().toISOString()
        };

        financialHistory.push(expenseRecord);
        boxBalances[box] -= amount;

        saveData();
        renderExpensesTable();
        document.getElementById('expense-form').reset();
        document.getElementById('expense-date').valueAsDate = new Date();
        alert("Gasto registrado y restado de la caja exitosamente.");
    };

    function renderExpensesTable() {
        const tBody = document.getElementById('expenses-table-body');
        if (!tBody) return;
        tBody.innerHTML = '';
        const expenses = financialHistory.filter(h => h.type === 'EXIT').sort((a, b) => new Date(b.date) - new Date(a.date));

        expenses.forEach(e => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${e.date}</td>
                <td>${e.concept}</td>
                <td>${e.receiver}</td>
                <td>${e.box}</td>
                <td style="color:#ef4444; font-weight:bold;">-$${e.amount.toLocaleString()}</td>
            `;
            tBody.appendChild(tr);
        });
    }

    // --- MÓDULO DE REPORTES FINANCIEROS ---

    window.showReports = () => {
        updateNav('nav-reports');
        dashboardHome.style.display = 'none';
        recentActivity.style.display = 'block';
        viewTitle.innerText = 'Informes Financieros';
        btnBack.style.display = 'none';
        groupFilter.style.display = 'none';

        document.getElementById('main-table-container').style.display = 'none';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('reports-container').style.display = 'block';

        updateBoxBalances();
        updateBoxReport();
    };

    function updateBoxBalances() {
        const grid = document.getElementById('box-balances-grid');
        grid.innerHTML = '';
        for (let box in boxBalances) {
            const card = document.createElement('div');
            card.className = 'summary-card';
            card.style.padding = '15px';
            card.innerHTML = `
                <div class="card-title" style="font-size:0.9rem; margin-bottom:10px;">${box}</div>
                <div class="card-value" style="font-size:1.4rem; color:var(--primary)">$${boxBalances[box].toLocaleString()}</div>
            `;
            grid.appendChild(card);
        }
    }

    window.updateBoxReport = () => {
        const boxFilter = document.getElementById('report-box-filter').value;
        const dateStart = document.getElementById('report-date-start').value;
        const dateEnd = document.getElementById('report-date-end').value;
        const studentFilter = document.getElementById('report-student-filter').value.toLowerCase();
        const conceptFilter = document.getElementById('report-concept-filter').value.toLowerCase();

        const body = document.getElementById('box-transactions-body');
        body.innerHTML = '';

        // Actualizar título dinámico para el usuario
        const reportTitle = document.querySelector('.expediente-section h4');
        if (reportTitle) {
            if (boxFilter === 'Todas') reportTitle.innerText = 'Reporte General de Movimientos';
            else if (boxFilter === 'SOLO_BANCOS') reportTitle.innerText = 'Reporte de Movimientos a Bancos (Banorte / MP)';
            else reportTitle.innerText = 'Reporte de Movimientos - ' + boxFilter;
        }

        let runningBalance = 0;

        const filteredTransactions = financialHistory.filter(t => {
            // Filtro por caja / banco
            let matchBox = false;
            if (boxFilter === 'Todas') matchBox = true;
            else if (boxFilter === 'SOLO_BANCOS') matchBox = (t.box === 'Banorte' || t.box === 'Mercado Pago');
            else matchBox = (t.box === boxFilter);

            // Filtro por alumno
            const matchStudent = !studentFilter || t.concept.toLowerCase().includes(studentFilter);

            // Filtro por concepto
            const matchConcept = (conceptFilter === 'todos' || t.concept.toLowerCase().includes(conceptFilter));

            // Filtro por fecha (Parsear fecha del registro "DD/MM/YYYY HH:MM:SS" o similar)
            let matchDate = true;
            if (dateStart || dateEnd) {
                // Extraer solo la parte de la fecha DD/MM/YYYY
                const [datePart] = t.date.split(' ');
                const [day, month, year] = datePart.split('/');
                const transDate = new Date(year, month - 1, day);

                if (dateStart) {
                    const start = new Date(dateStart);
                    start.setHours(0, 0, 0, 0);
                    if (transDate < start) matchDate = false;
                }
                if (dateEnd) {
                    const end = new Date(dateEnd);
                    end.setHours(23, 59, 59, 999);
                    if (transDate > end) matchDate = false;
                }
            }

            return matchBox && matchStudent && matchConcept && matchDate;
        });

        filteredTransactions.forEach((t, index) => {
            // Obtenemos el índice real en financialHistory (para cancelar)
            const realIdx = financialHistory.indexOf(t);
            const isEntry = t.type === 'ENTRY';
            const isCancelled = t.isCancelled;

            if (!isCancelled) {
                if (isEntry) runningBalance += t.amount;
                else if (t.type === 'EXIT') runningBalance -= t.amount;
            }

            const row = document.createElement('tr');
            row.style.opacity = isCancelled ? '0.5' : '1';
            row.style.textDecoration = isCancelled ? 'line-through' : 'none';

            row.innerHTML = `
            <td>${t.date}</td>
            <td>${t.box}</td>
            <td>${isCancelled ? '<span style="color:#ef4444">[CANCELADO]</span> ' : ''}${t.concept}</td>
            <td style="color:#059669">${isEntry && !isCancelled ? '+$' + t.amount.toLocaleString() : ''}</td>
            <td style="color:#dc2626">${t.type === 'EXIT' && !isCancelled ? '-$' + t.amount.toLocaleString() : ''}</td>
            <td style="font-weight:700">$${runningBalance.toLocaleString()}</td>
            <td>
                ${isEntry && !isCancelled ? `<button onclick="cancelTransaction(${realIdx})" class="btn-delete-row" title="Cancelar Pago"><i class="fas fa-undo-alt"></i></button>` : ''}
            </td>
        `;
            body.appendChild(row);
        });
    };

    window.cancelTransaction = (index) => {
        const t = financialHistory[index];
        if (!t) return;
        if (t.isCancelled) return alert("Esta operación ya fue cancelada.");

        if (currentUser && currentUser.role !== "ADMIN") {
            return alert("Acceso Denegado: Solo el Administrador general puede cancelar recibos y pagos.");
        }

        if (confirm(`¿Está seguro de CANCELAR este pago de $${t.amount.toLocaleString()} folio ${t.folio}? \nEsta acción: \r- Descontará el dinero de la Caja: ${t.box} \r- Marcará el folio como CANCELADO en el expediente del alumno.`)) {

            // 1. Marcar transacción central como cancelada
            t.isCancelled = true;

            // 2. Descontar del saldo de la Caja
            boxBalances[t.box] -= t.amount;

            // 3. Buscar y cancelar en el expediente individual de CADA alumno
            for (let studentName in studentDetails) {
                if (studentDetails[studentName].payments) {
                    const payIdx = studentDetails[studentName].payments.findIndex(p => p.folio === t.folio);
                    if (payIdx !== -1) {
                        studentDetails[studentName].payments[payIdx].status = 'CANCELADO';
                        studentDetails[studentName].payments[payIdx].cancelDate = new Date().toLocaleString();
                    }
                }
            }

            // 4. Guardar y refrescar
            saveData();
            updateBoxReport();
            alert("Pago cancelado correctamente. Los saldos de caja se han actualizado.");
        }
    };
    window.showTransferModal = () => { document.getElementById('transfer-modal').style.display = 'flex'; };
    window.closeTransferModal = () => { document.getElementById('transfer-modal').style.display = 'none'; };

    window.processTransfer = () => {
        const from = document.getElementById('transfer-from').value;
        const to = document.getElementById('transfer-to').value;
        const amount = parseFloat(document.getElementById('transfer-amount').value);

        if (from === to) { alert('La caja de origen y destino deben ser diferentes.'); return; }
        if (!amount || amount <= 0) { alert('Ingrese un importe válido.'); return; }
        if (boxBalances[from] < amount) { alert('Fondos insuficientes en la caja de origen.'); return; }

        // Ejecutar Transferencia
        boxBalances[from] -= amount;
        boxBalances[to] += amount;

        const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();

        // Registrar salidas/entradas en historial
        financialHistory.push({
            date: dateStr,
            box: from,
            concept: `TRASPASO A CAJA: ${to}`,
            type: 'EXIT',
            amount: amount,
            folio: 'TRANSF'
        });
        financialHistory.push({
            date: dateStr,
            box: to,
            concept: `TRASPASO DESDE CAJA: ${from}`,
            type: 'ENTRY',
            amount: amount,
            folio: 'TRANSF'
        });

        saveData();
        alert(`¡Traspaso Exitoso!\n$${amount} transferidos de ${from} a ${to}.`);
        closeTransferModal();
        updateBoxBalances();
        updateBoxReport();
    };

    // --- CAPTURA POR LOTE ---

    window.showBatchCapture = () => {
        dashboardHome.style.display = 'none';
        document.getElementById('main-table-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('batch-capture-container').style.display = 'block';
        viewTitle.innerText = 'Captura Masiva de Alumnos';
        groupFilter.style.display = 'none';

        const batchBody = document.getElementById('batch-table-body');
        batchBody.innerHTML = '';
        // Add 3 initial empty rows
        addBatchRow();
        addBatchRow();
        addBatchRow();
    };

    window.addBatchRow = (data = {}) => {
        const batchBody = document.getElementById('batch-table-body');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" placeholder="Ej. 4º A" class="batch-grade" value="${data.grade || ''}"></td>
            <td><input type="text" placeholder="Ej. A2" class="batch-english" value="${data.english || ''}"></td>
            <td><input type="text" placeholder="Ej. 555..." class="batch-phone" value="${data.phone || ''}"></td>
            <td><input type="text" placeholder="Nombre" class="batch-name" value="${data.name || ''}"></td>
            <td><input type="text" placeholder="2do Nombre" class="batch-name2" value="${data.name2 || ''}"></td>
            <td><input type="text" placeholder="1er Apellido" class="batch-lastName1" value="${data.lastName1 || ''}"></td>
            <td><input type="text" placeholder="2do Apellido" class="batch-lastName2" value="${data.lastName2 || ''}"></td>
            <td><input type="number" placeholder="$" class="batch-pay-ins" value="${data.pay_ins || ''}"></td>
            <td><input type="number" placeholder="$" class="batch-pay-support" value="${data.pay_support || ''}"></td>
            <td><input type="number" placeholder="$" class="batch-pay-insurance" value="${data.pay_insurance || ''}"></td>
            <td style="text-align: center;"><button class="btn-delete-row" onclick="removeBatchRow(this)"><i class="fas fa-trash"></i></button></td>
        `;
        batchBody.appendChild(row);
    };

    window.downloadExcelTemplate = () => {
        const templateData = [
            {
                "Grado": "4º A",
                "Nivel de inglés": "A2",
                "No. de télefono de tutor": "5551234567",
                "Nombre del Alumno": "Juan",
                "2DO NOMBRE": "Pablo",
                "1er Apellido": "Pérez",
                "2o Apellido": "García",
                "Pago Inscripción": 3500,
                "Pago Gastos Apoyo": 1200,
                "Pago Seguro Escolar": 850
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
        XLSX.writeFile(workbook, "Formato_Importacion_Alumnos_Con_Pagos.xlsx");
    };

    window.importFromGoogleSheets = async () => {
        const url = prompt("Pega aquí el enlace de tu Google Sheet (Asegúrate de que esté compartido como 'Cualquier persona con el enlace puede leer'):");
        if (!url) return;

        // Extraer el ID de la hoja de cálculo
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            alert("El enlace de Google Sheets no parece ser válido.");
            return;
        }

        const sheetId = match[1];
        // Exportar a CSV usando el endpoint de visualización pública
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

        try {
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error("No se pudo acceder a la hoja. Verifica que sea pública.");

            const csvText = await response.text();

            // Procesar CSV básico (asumiendo primera fila encabezados)
            const rows = csvText.split('\n').map(row => {
                // Manejar comillas en CSV
                return row.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim());
            });

            const headers = rows[0];
            const dataRows = rows.slice(1);

            if (dataRows.length === 0) {
                alert("La hoja de Google parece estar vacía.");
                return;
            }

            if (confirm(`Se han detectado ${dataRows.length} filas en Google Sheets. ¿Deseas cargarlas?`)) {
                const batchBody = document.getElementById('batch-table-body');
                batchBody.innerHTML = ''; // Limpiar actuales

                dataRows.forEach(row => {
                    if (row[3]) { // Si tiene nombre
                        window.addBatchRow({
                            grade: row[0],
                            english: row[1],
                            phone: row[2],
                            name: row[3],
                            name2: row[4],
                            lastName1: row[5],
                            lastName2: row[6],
                            pay_ins: row[7] || '',
                            pay_support: row[8] || '',
                            pay_insurance: row[9] || ''
                        });
                    }
                });
            }
        } catch (error) {
            console.error("Error importando desde Google Sheets:", error);
            alert("Error al conectar con Google Sheets. Asegúrate de que el documento esté compartido para que 'Cualquier persona con el enlace pueda leer'.");
        }
    };

    window.importFromExcel = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    alert('El archivo Excel está vacío.');
                    return;
                }

                if (confirm(`Se han encontrado ${json.length} registros. ¿Deseas cargarlos en la tabla?`)) {
                    const batchBody = document.getElementById('batch-table-body');
                    batchBody.innerHTML = ''; // Limpiar actuales

                    json.forEach(row => {
                        const grade = row.Grado || row.grado || '';
                        const english = row['Nivel de inglés'] || row.ingles || '';
                        const phone = row['No. de télefono de tutor'] || row.telefono || '';
                        const name = row['Nombre del Alumno'] || row.nombre || '';
                        const name2 = row['2DO NOMBRE'] || row.nombre2 || '';
                        const lastName1 = row['1er Apellido'] || row.apellido1 || '';
                        const lastName2 = row['2o Apellido'] || row.apellido2 || '';
                        const pay_ins = row['Pago Inscripción'] || row.inscripcion || '';
                        const pay_support = row['Pago Gastos Apoyo'] || row['gastos apoyo'] || '';
                        const pay_insurance = row['Pago Seguro Escolar'] || row.seguro || '';

                        if (name) {
                            window.addBatchRow({ grade, english, phone, name, name2, lastName1, lastName2, pay_ins, pay_support, pay_insurance });
                        }
                    });
                }
            } catch (error) {
                console.error('Error procesando Excel:', error);
                alert('Hubo un error al leer el archivo Excel. Asegúrate de que sea un formato válido.');
            }
            // Reset input to allow same file again
            event.target.value = '';
        };
        reader.readAsArrayBuffer(file);
    };

    window.removeBatchRow = (btn) => {
        const row = btn.closest('tr');
        row.remove();
        if (document.getElementById('batch-table-body').children.length === 0) {
            addBatchRow();
        }
    };

    window.cancelBatch = () => {
        if (confirm('¿Estás seguro de cancelar? Se perderán los datos no guardados.')) {
            showStudents();
        }
    };

    window.saveBatch = () => {
        const rows = document.querySelectorAll('#batch-table-body tr');
        let newCount = 0;

        rows.forEach(row => {
            const name = row.querySelector('.batch-name').value.trim();
            const name2 = row.querySelector('.batch-name2').value.trim();
            const ln1 = row.querySelector('.batch-lastName1').value.trim();
            const ln2 = row.querySelector('.batch-lastName2').value.trim();
            const grade = row.querySelector('.batch-grade').value.trim();
            const english = row.querySelector('.batch-english').value.trim();
            const phone = row.querySelector('.batch-phone').value.trim();
            const payIns = row.querySelector('.batch-pay-ins').value;
            const paySupport = row.querySelector('.batch-pay-support').value;
            const payInsurance = row.querySelector('.batch-pay-insurance').value;

            if (name !== '') {
                const fullName = `${name} ${name2} ${ln1} ${ln2}`.replace(/\s+/g, ' ').trim();
                allStudents.push({
                    name: fullName,
                    level: 'Por Definir', // Opcional: podrías inferirlo del grado
                    grade: grade,
                    english: english,
                    tutorPhone: phone,
                    status: 'Activo'
                });

                // Registrar pagos iniciales en el expediente
                studentDetails[fullName] = {
                    initialPayments: {
                        inscripcion: payIns || 0,
                        gastosApoyo: paySupport || 0,
                        seguro: payInsurance || 0
                    },
                    mother: { name: 'S/D', phone: phone },
                    father: { name: 'S/D', phone: phone }
                };
                newCount++;
            }
        });

        if (newCount > 0) {
            saveData();
            alert(`¡Éxito! Se han registrado ${newCount} alumnos correctamente.`);
            showStudents();
        } else {
            alert('No se ingresó ningún nombre de alumno.');
        }
    };

    // --- CAPTURA DE SERVICIOS POR LOTE ---
    window.showServicesBatch = () => {
        updateNav('nav-services');
        dashboardHome.style.display = 'none';
        recentActivity.style.display = 'block';
        viewTitle.innerText = 'Cobros Masivos / Servicios';

        document.getElementById('main-table-container').style.display = 'none';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('reports-container').style.display = 'none';
        document.getElementById('services-batch-container').style.display = 'block';

        const body = document.getElementById('services-batch-body');
        body.innerHTML = '';

        // Reset selectors
        const globalConcept = document.getElementById('services-batch-global-concept');
        globalConcept.value = 'Inscripción';
        toggleBatchMonthSelect('Inscripción');

        addServiceBatchRow();
    };

    window.toggleBatchMonthSelect = (val) => {
        document.getElementById('batch-month-select-div').style.display = val === 'Colegiatura' ? 'block' : 'none';
    };

    window.addServiceBatchRow = (data = {}) => {
        const body = document.getElementById('services-batch-body');
        const row = document.createElement('tr');
        const globalConcept = document.getElementById('services-batch-global-concept').value;
        const initialQuote = data.quote !== '' ? data.quote : '';
        const initialDiscount = data.discount !== '' ? data.discount : 0;

        let initialPaid = '';
        if (data.amount !== '' && data.amount !== undefined) {
            initialPaid = data.amount;
        } else if (initialQuote !== '') {
            initialPaid = initialQuote - initialDiscount;
        }

        const initialBalance = (initialQuote !== '' ? initialQuote - initialDiscount : 0) - (initialPaid !== '' ? initialPaid : 0);

        row.innerHTML = `
            <td><input type="text" list="students-datalist" class="s-batch-student form-select" style="width:100%" value="${data.student || ''}"></td>
            <td style="color:var(--primary); font-weight:600; font-size:0.7rem;">${globalConcept}</td>
            <td><input type="number" placeholder="0" class="s-batch-quote form-select" style="width:100%" value="${initialQuote}" oninput="calcBatchReal(this)"></td>
            <td><input type="number" placeholder="0" class="s-batch-discount form-select" style="width:100%" value="${initialDiscount}" oninput="calcBatchReal(this)"></td>
            <td><input type="number" placeholder="0" class="s-batch-amount form-select" style="width:100%;" value="${initialPaid}" oninput="calcBatchReal(this)"></td>
            <td><input type="number" placeholder="0" class="s-batch-balance form-select" style="width:100%; background:#fff1f2; color:#be123c; font-weight:bold;" value="${initialBalance}" readonly></td>
            <td><input type="date" class="s-batch-date form-select" style="width:100%" value="${data.date || new Date().toISOString().split('T')[0]}"></td>
            <td><input type="text" placeholder="Auto" class="s-batch-folio form-select" style="width:100%" value="${data.folio || ''}"></td>
            <td>
                <select class="s-batch-method form-select" style="width:100%">
                    <option value="Efectivo" ${data.method === 'Efectivo' ? 'selected' : ''}>Ef</option>
                    <option value="Tarjeta" ${data.method === 'Tarjeta' ? 'selected' : ''}>Tj</option>
                    <option value="Transferencia" ${data.method === 'Transferencia' ? 'selected' : ''}>Tr</option>
                </select>
            </td>
            <td>
                <select class="s-batch-receiver form-select" style="width:100%">
                    <option value="Recepción" ${data.receiver === 'Recepción' ? 'selected' : ''}>Rec</option>
                    <option value="José Bernardo" ${data.receiver === 'José Bernardo' ? 'selected' : ''}>JB</option>
                    <option value="Georgina A" ${data.receiver === 'Georgina A' ? 'selected' : ''}>GA</option>
                    <option value="Banorte" ${data.receiver === 'Banorte' ? 'selected' : ''}>Ban</option>
                </select>
            </td>
            <td style="text-align: center;"><button class="btn-delete-row" style="padding:2px 5px;" onclick="this.closest('tr').remove()"><i class="fas fa-trash"></i></button></td>
        `;
        body.appendChild(row);
    };

    window.calcBatchReal = (input) => {
        const row = input.closest('tr');
        const quote = parseFloat(row.querySelector('.s-batch-quote').value) || 0;
        const discount = parseFloat(row.querySelector('.s-batch-discount').value) || 0;
        const paid = parseFloat(row.querySelector('.s-batch-amount').value) || 0;
        const balance = (quote - discount) - paid;
        row.querySelector('.s-batch-balance').value = balance;
    };

    window.downloadServiceExcelTemplate = () => {
        const globalConcept = document.getElementById('services-batch-global-concept').value;
        let templateData = [];

        if (globalConcept === 'Inscripción') {
            templateData = [{
                "alumno": "Juan Pérez",
                "concepto": "Inscripción",
                "inscripcion normal": 4500,
                "descuento por promocion": 1000,
                "inscripcion pagada": 3500,
                "fecha de pago": "2025-03-05",
                "folio": "A-123",
                "caja": "Recepción"
            }];
        } else {
            templateData = [{
                "Alumno": "Juan Pérez",
                "Cotizado": 4500,
                "Descuento": 1000,
                "Monto Pagado": 3500,
                "Fecha Pago": "2025-03-05",
                "Folio": "A-123",
                "Forma Pago": "Efectivo",
                "Recibe": "Recepción"
            }];
        }
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Pagos");
        XLSX.writeFile(workbook, "Formato_Pagos_Lote.xlsx");
    };

    window.importServiceFromExcel = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    alert('El archivo Excel está vacío.');
                    return;
                }

                if (confirm(`Se han encontrado ${json.length} pagos. ¿Deseas cargarlos en la tabla?`)) {
                    const body = document.getElementById('services-batch-body');
                    body.innerHTML = ''; // Limpiar actuales

                    const globalConcept = document.getElementById('services-batch-global-concept').value;

                    const getVal = (rowObj, ...keys) => {
                        const cleanStr = s => s.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
                        const rKey = Object.keys(rowObj).find(k => keys.some(search => cleanStr(k) === cleanStr(search)));
                        return rKey ? rowObj[rKey] : undefined;
                    };

                    const parseExcelNumber = (val) => {
                        if (val === undefined || val === null || val === '') return '';
                        if (typeof val === 'number') return val;
                        const cleanStr = String(val).replace(/[^0-9.-]+/g, "");
                        const num = parseFloat(cleanStr);
                        return isNaN(num) ? '' : num;
                    };

                    const parseExcelDate = (val) => {
                        if (!val) return '';
                        if (typeof val === 'number') {
                            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                            return date.toISOString().split('T')[0];
                        }
                        const str = String(val).trim();
                        if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;
                        if (str.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                            const [d, m, y] = str.split('/');
                            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                        }
                        return '';
                    };

                    json.forEach((row, i) => {
                        let student = '', folio = '', quote = '', discount = 0, amount = '', dateInput = '', method = 'Efectivo', receiver = 'Recepción';

                        if (globalConcept === 'Inscripción') {
                            student = getVal(row, 'alumno');
                            folio = getVal(row, 'folio');
                            quote = parseExcelNumber(getVal(row, 'inscripcion normal', 'inscripción normal', 'cotizado', 'inscripcion', 'normal'));

                            let rawDiscount = parseExcelNumber(getVal(row, 'descuento por promocion', 'descuento por promoción', 'descuento', 'promocion', 'desceunto'));
                            // If quote is defined, discount is a percentage
                            if (rawDiscount !== '' && quote !== '') {
                                // e.g. 10 becomes 0.10, 0.15 stays 0.15
                                let percentage = rawDiscount > 1 ? rawDiscount / 100 : rawDiscount;
                                discount = quote * percentage;
                            } else {
                                discount = rawDiscount || 0;
                            }

                            amount = parseExcelNumber(getVal(row, 'inscripcion pagada', 'inscripción pagada', 'pagada', 'pagado', 'monto pagado', 'inscripcion'));
                            dateInput = parseExcelDate(getVal(row, 'fecha de pago', 'fecha pago', 'fecha', 'fehca', 'fehca de pago'));
                            receiver = getVal(row, 'caja', 'recibe');
                            method = getVal(row, 'forma pago', 'forma', 'metodo') || 'Efectivo';
                        } else {
                            student = getVal(row, 'alumno');
                            folio = getVal(row, 'folio');
                            quote = parseExcelNumber(getVal(row, 'cotizado', 'inscripcion normal', 'normal'));
                            discount = parseExcelNumber(getVal(row, 'descuento', 'desceunto', 'promocion'));
                            amount = parseExcelNumber(getVal(row, 'monto pagado', 'pagado', 'inscripcion pagada'));
                            dateInput = parseExcelDate(getVal(row, 'fecha pago', 'fecha de pago', 'fecha', 'fehca', 'fehca de pago'));
                            method = getVal(row, 'forma pago', 'forma', 'metodo') || 'Efectivo';
                            receiver = getVal(row, 'recibe', 'caja') || 'Recepción';
                        }

                        student = student || '';
                        folio = folio || '';
                        quote = quote === '' ? '' : quote;
                        discount = discount || 0;
                        amount = amount === '' ? '' : amount;
                        dateInput = dateInput || '';

                        if (student) {
                            window.addServiceBatchRow({ student, folio, quote, discount, amount, date: dateInput, method, receiver });
                        }
                    });
                }
            } catch (error) {
                console.error('Error procesando Excel:', error);
                alert('Hubo un error al leer el archivo Excel.');
            }
            event.target.value = '';
        };
        reader.readAsArrayBuffer(file);
    };

    window.saveServicesBatch = () => {
        const rows = document.querySelectorAll('#services-batch-body tr');
        const globalConcept = document.getElementById('services-batch-global-concept').value;
        const globalMonth = document.getElementById('services-batch-global-month').value;
        let processed = 0;

        rows.forEach(row => {
            const student = row.querySelector('.s-batch-student').value;
            const folioManual = row.querySelector('.s-batch-folio').value;
            const quote = parseFloat(row.querySelector('.s-batch-quote').value) || 0;
            const discount = parseFloat(row.querySelector('.s-batch-discount').value) || 0;
            const paid = parseFloat(row.querySelector('.s-batch-amount').value) || 0;
            const balance = parseFloat(row.querySelector('.s-batch-balance').value) || 0;
            const date = row.querySelector('.s-batch-date').value;
            const method = row.querySelector('.s-batch-method').value;
            const receiver = row.querySelector('.s-batch-receiver').value;

            if (student && (paid > 0 || balance !== 0)) {
                const finalConcept = globalConcept === 'Colegiatura' ? `${globalConcept} (${globalMonth})` : globalConcept;
                const [y, m, d] = date.split('-');
                const formattedDate = `${d}/${m}/${y}`;

                const folio = folioManual || `${method.substring(0, 2).toUpperCase()}-${y}-${Math.floor(1000 + Math.random() * 9000)}`;

                if (!studentDetails[student]) studentDetails[student] = { mother: { name: 'S/D' }, father: { name: 'S/D' }, payments: [] };
                if (!studentDetails[student].payments) studentDetails[student].payments = [];

                if (quote > 0) {
                    studentDetails[student].payments.push({
                        type: 'CARGO',
                        date: formattedDate,
                        concept: finalConcept,
                        amount: quote,          // Monto original sin descuento
                        discount: discount,     // Descuento aplicado
                        netAmount: quote - discount, // Monto neto a pagar
                        folio: 'SRV-LOTE'
                    });
                }

                if (paid > 0 || quote === 0) {
                    studentDetails[student].payments.push({
                        type: 'ABONO',
                        date: formattedDate,
                        concept: quote > 0 ? 'Pago ' + finalConcept : finalConcept,
                        quote: quote,
                        discount: discount,
                        paid: paid,
                        balance: balance,
                        amount: paid, // El monto que realmente entró a caja
                        folio: folio,
                        method: method,
                        receiver: receiver,
                        status: balance === 0 ? 'PAGADO' : 'CON SALDO'
                    });
                }

                if (paid > 0) {
                    boxBalances[receiver] += paid;
                    financialHistory.push({
                        date: formattedDate + ' 12:00:00',
                        box: receiver,
                        concept: `PAGO LOTE: ${student} (${finalConcept})`,
                        type: 'ENTRY',
                        amount: paid,
                        folio: folio
                    });
                }
                processed++;
            }
        });

        if (processed > 0) {
            saveData();
            alert(`¡Éxito! Se procesaron ${processed} cobros correctamente.`);
            showStudents();
        } else {
            alert('No se detectaron cobros válidos para procesar.');
        }
    };

    window.showExpenses = () => {
        dashboardHome.style.display = 'none';
        viewTitle.innerText = 'Gestión de Gastos';
        btnBack.style.display = 'block';
        btnBack.onclick = showPaymentsModule;
        tableHead.innerHTML = `
            <th>Fecha</th>
            <th>Concepto</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Caja Origen</th>
            <th>Acción</th>
        `;
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div style="padding: 15px; background: #f8fafc; border-radius: 8px; margin-bottom: 15px;">
                        <h5 style="margin-top:0; color:var(--primary);">Registrar Nuevo Gasto</h5>
                        <div style="display:grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap:10px;">
                            <input type="text" id="expense-concept" placeholder="Concepto del Gasto" class="form-select">
                            <input type="number" id="expense-amount" placeholder="Monto ($)" class="form-select">
                            <input type="date" id="expense-date" class="form-select" value="${new Date().toISOString().split('T')[0]}">
                            <select id="expense-method" class="form-select">
                                <option value="Efectivo">Efectivo</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Transferencia">Transferencia</option>
                            </select>
                            <select id="expense-receiver" class="form-select">
                                <option value="Recepción">Recepción</option>
                                <option value="José Bernardo">José Bernardo</option>
                                <option value="Georgina A">Georgina A</option>
                                <option value="Banorte">Banorte</option>
                            </select>
                        </div>
                        <div style="margin-top:10px; text-align:right;">
                            <button onclick="processExpense()" class="btn-primary" style="padding:6px 12px; font-size:0.8rem; background:#ef4444; color:white; border:none; border-radius:4px; cursor:pointer;">Registrar Gasto</button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
        renderExpensesTable();
    };

    window.processExpense = () => {
        const concept = document.getElementById('expense-concept').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;
        const method = document.getElementById('expense-method').value;
        const receiver = document.getElementById('expense-receiver').value;

        if (!concept || !amount || amount <= 0 || !date) {
            alert("Por favor, complete todos los campos y asegúrese de que el monto sea válido.");
            return;
        }

        const [y, m, d] = date.split('-');
        const formattedDate = `${d}/${m}/${y}`;

        // Generate a unique folio for the expense
        const folio = `GTO-${method.substring(0, 2).toUpperCase()}-${y}-${Math.floor(1000 + Math.random() * 9000)}`;

        financialHistory.push({
            date: formattedDate + ' 12:00:00',
            box: receiver,
            concept: concept,
            type: 'EXIT',
            amount: amount,
            folio: folio,
            method: method,
            isCancelled: false
        });

        // Deduct from the box balance
        boxBalances[receiver] -= amount;

        saveData();
        renderExpensesTable();
        alert(`Gasto de $${amount} registrado exitosamente.`);

        // Clear form
        document.getElementById('expense-concept').value = '';
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    };

    window.renderExpensesTable = () => {
        const expenses = financialHistory.filter(item => item.type === 'EXIT' && !item.isCancelled);
        let rowsHTML = '';

        expenses.sort((a, b) => new Date(b.date.split(' ')[0].split('/').reverse().join('-')) - new Date(a.date.split(' ')[0].split('/').reverse().join('-')));

        expenses.forEach((expense, index) => {
            rowsHTML += `
                <tr>
                    <td>${expense.date.split(' ')[0]}</td>
                    <td>${expense.concept}</td>
                    <td style="color:#dc2626;">-$${expense.amount.toLocaleString()}</td>
                    <td>${expense.method}</td>
                    <td>${expense.box}</td>
                    <td>
                        <button onclick="cancelTransaction('${expense.folio}')" title="Anular Gasto" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fas fa-times-circle"></i></button>
                    </td>
                </tr>
            `;
        });

        // Find the tableBody and insert rows after the expense form row
        const tableBodyElement = document.getElementById('table-body');
        if (tableBodyElement) {
            // Assuming the first row is the form, append subsequent rows
            const formRow = tableBodyElement.querySelector('tr:first-child');
            if (formRow) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = `<table><tbody>${rowsHTML}</tbody></table>`;
                const newRows = Array.from(tempDiv.querySelector('tbody').children);

                // Remove existing expense rows (all except the first form row)
                while (tableBodyElement.children.length > 1) {
                    tableBodyElement.removeChild(tableBodyElement.lastChild);
                }

                newRows.forEach(row => tableBodyElement.appendChild(row));
            } else {
                tableBodyElement.innerHTML = rowsHTML; // Fallback if form row not found
            }
        }
    };

    // --- FUNCIONES DE EXPEDIENTE ---

    let currentStudent = null;
    window.viewExpediente = (name) => {
        currentStudent = allStudents.find(s => s.name === name);
        if (!currentStudent) return;
        if (tutorModal) tutorModal.style.display = 'none';
        if (teacherModal) teacherModal.style.display = 'none';
        document.getElementById('modal-student-name').innerText = currentStudent.name;
        document.getElementById('modal-student-level').innerText = currentStudent.level;
        document.getElementById('modal-student-grade').innerText = currentStudent.grade;
        studentModal.style.display = 'block';
        switchTab('grades');
    };

    window.viewStudents = (id, name) => {
        dashboardHome.style.display = 'none';
        viewTitle.innerText = `Alumnos: ${name}`;
        btnBack.style.display = 'block';
        btnBack.onclick = showSubjects;
        tableHead.innerHTML = `<th>Nombre</th><th>Nivel</th><th>Grado</th><th>Acción</th>`;
        tableBody.innerHTML = '';
        allStudents.filter(s => s.level === (id === 2 ? 'Bachillerato' : 'Primaria')).forEach(s => {
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${s.name}</strong></td><td>${s.level}</td><td>${s.grade}</td><td><button class="btn-action" onclick="viewExpediente('${s.name}')">Ver Expediente</button></td>`;
            tableBody.appendChild(row);
        });
    };

    let currentTeacher = null;
    window.viewTeacherExpediente = (name) => {
        currentTeacher = teachers.find(t => t.name === name);
        if (!currentTeacher) return;
        document.getElementById('modal-teacher-name').innerText = currentTeacher.name;
        teacherModal.style.display = 'block';
        switchTeacherTab('digital');
    };

    let currentTutor = null;
    window.viewTutorExpediente = (name) => {
        currentTutor = tutors.find(t => t.name === name);
        if (!currentTutor) return;
        document.getElementById('modal-tutor-name').innerText = currentTutor.name;
        tutorModal.style.display = 'block';
        switchTutorTab('info');
    };

    window.viewGroupGrades = (id, name) => {
        dashboardHome.style.display = 'none';
        viewTitle.innerText = `Calificaciones: ${name}`;
        btnBack.style.display = 'block';
        btnBack.onclick = showCourses;
        tableHead.innerHTML = `<th>Alumno</th><th>P1</th><th>P2</th><th>P3</th><th>Promedio</th>`;
        tableBody.innerHTML = '';
        const grads = periodGrades[id === 1 ? 201 : 101] || [];
        grads.forEach(g => {
            const avg = ((g.p1 + g.p2 + g.p3) / 3).toFixed(1);
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${g.name}</strong></td><td>${g.p1}</td><td>${g.p2}</td><td>${g.p3}</td><td>${avg}</td>`;
            tableBody.appendChild(row);
        });
    };

    // --- LÓGICA DE PESTAÑAS (MODALES) ---

    window.switchTab = (tab) => {
        // MAESTRO / PADRE RBAC Restriction
        if (currentUser && (currentUser.role === 'MAESTRO')) {
            if (tab === 'payments' || tab === 'digital') {
                alert("Acceso Restringido: Tu rol no tiene permisos para ver esta sección.");
                return;
            }
        }

        document.querySelectorAll('.tab-btn').forEach(b => {
            // Ocultar botones si es maestro o padre
            if (currentUser && currentUser.role === 'MAESTRO' && (b.innerText.includes('Estado') || b.innerText.includes('Document'))) {
                b.style.display = 'none';
            }
            b.classList.toggle('active', b.innerText.toLowerCase().includes(tab === 'grades' ? 'calif' : (tab === 'payments' ? 'pagos' : (tab === 'digital' ? 'digital' : 'chat'))))
        });
        const content = document.getElementById('tab-content');
        if (tab === 'grades') {
            content.innerHTML = `<div class="data-item"><span>Promedio General</span> <strong>9.2</strong></div>`;
        } else if (tab === 'payments') {
            const history = studentDetails[currentStudent.name]?.payments || [];
            let balance = 0;

            let rowsHTML = history.map((p, index) => {
                // Para CARGO: el monto neto es amount - discount (si tiene discount)
                const discount = p.discount || 0;
                let cargo = 0;
                if (p.type === 'CARGO') {
                    // netAmount ya está guardado, o calculamos: amount - discount
                    cargo = p.netAmount !== undefined ? p.netAmount : (p.amount - discount);
                }
                let abono = p.type !== 'CARGO' ? p.amount : 0;
                balance += cargo - abono;

                // Descripción de concepto enriquecida para CARGO con descuento
                let conceptDisplay = p.concept;
                if (p.type === 'CARGO' && discount > 0) {
                    conceptDisplay = `${p.concept} <span style="font-size:0.75rem; color:#059669; font-weight:600;">(-$${discount.toLocaleString()} desc.)</span>`;
                }

                return `
                <tr>
                    <td style="padding:8px 4px; border-bottom:1px solid #e2e8f0;">${p.date}</td>
                    <td style="padding:8px 4px; border-bottom:1px solid #e2e8f0;">${conceptDisplay}</td>
                    <td style="padding:8px 4px; border-bottom:1px solid #e2e8f0; color:#dc2626">${cargo > 0 ? '$' + cargo.toLocaleString() : ''}</td>
                    <td style="padding:8px 4px; border-bottom:1px solid #e2e8f0; color:#059669">${abono > 0 ? '$' + abono.toLocaleString() : ''}</td>
                    <td style="padding:8px 4px; border-bottom:1px solid #e2e8f0; font-weight:bold; color:${balance > 0 ? '#dc2626' : '#059669'}">$${Math.max(0, balance).toLocaleString()}</td>
                    <td style="padding:8px 4px; border-bottom:1px solid #e2e8f0; text-align:center;">
                        ${p.type === 'CARGO' ? '' : `<div style="font-size:0.65rem; color:#64748b; margin-bottom:2px;">Folio: ${p.folio}</div>`}
                        <button onclick="deleteStudentPayment(${index})" title="Eliminar Registro" style="background:none; border:none; color:var(--text-muted); cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
                `;
            }).join('');

            const cycleMonths = [
                { name: 'Inscrip.', key: 'inscripci' },
                { name: 'Sep 25', key: 'septiembre' }, { name: 'Oct 25', key: 'octubre' },
                { name: 'Nov 25', key: 'noviembre' }, { name: 'Dic 25', key: 'diciembre' },
                { name: 'Ene 26', key: 'enero' }, { name: 'Feb 26', key: 'febrero' },
                { name: 'Mar 26', key: 'marzo' }, { name: 'Abr 26', key: 'abril' },
                { name: 'May 26', key: 'mayo' }, { name: 'Jun 26', key: 'junio' },
                { name: 'Jul 26', key: 'julio' }
            ];

            let cycleHTML = `<div style="margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
                <h4 style="margin-bottom: 15px; color: var(--primary-dark);"><i class="fas fa-calendar-alt"></i> Control de Colegiaturas e Inscripción (Ciclo 25-26)</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px;">`;

            cycleMonths.forEach(m => {
                // Buscar el CARGO (la deuda) para ese mes
                const cargo = history.find(p => p.type === 'CARGO' && p.concept && p.concept.toLowerCase().includes(m.key));
                // Buscar el ABONO (pago) para ese mes
                const abono = history.find(p => p.type !== 'CARGO' && p.concept && p.concept.toLowerCase().includes(m.key));

                const disc = cargo ? (cargo.discount || 0) : 0;
                const netCargo = cargo ? (cargo.netAmount !== undefined ? cargo.netAmount : (cargo.amount - disc)) : 0;
                const totalPaid = abono ? abono.amount : 0;
                const pending = netCargo - totalPaid;

                const isPaid = abono && pending <= 0;
                const hasCargo = !!cargo;

                let bgColor, textColor, borderColor, icon;

                if (!hasCargo) {
                    // Sin cargo registrado: gris (sin datos)
                    bgColor = '#f1f5f9'; textColor = '#64748b'; borderColor = '#e2e8f0';
                    icon = '<i class="fas fa-minus" style="color:#94a3b8;"></i>';
                } else if (isPaid) {
                    bgColor = '#dcfce7'; textColor = '#166534'; borderColor = '#bbf7d0';
                    icon = `<i class="fas fa-check-circle" style="color:#16a34a;"></i><br><span style="font-size:0.6rem; color:#15803d;">${abono.date.split(' ')[0]}</span>`;
                } else if (pending > 0) {
                    bgColor = '#fee2e2'; textColor = '#991b1b'; borderColor = '#fecaca';
                    icon = `<i class="fas fa-exclamation-circle" style="color:#dc2626;"></i><br><span style="font-size:0.65rem; font-weight:700; color:#b91c1c;">$${pending.toLocaleString()}</span>`;
                } else {
                    bgColor = '#fee2e2'; textColor = '#991b1b'; borderColor = '#fecaca';
                    icon = '<i class="fas fa-times-circle" style="color:#dc2626;"></i>';
                }

                // Tooltip con detalle
                const tooltipText = hasCargo
                    ? `Cargo: $${netCargo.toLocaleString()}${disc > 0 ? ' (con desc. $' + disc.toLocaleString() + ')' : ''} | Pagado: $${totalPaid.toLocaleString()} | Pendiente: $${Math.max(0, pending).toLocaleString()}`
                    : 'Sin cargo registrado';

                cycleHTML += `
                    <div title="${tooltipText}" style="background: ${bgColor}; color: ${textColor}; padding: 8px 4px; border-radius: 6px; text-align: center; font-size: 0.72rem; font-weight: 600; border: 1px solid ${borderColor}; box-shadow: 0 1px 2px rgba(0,0,0,0.05); cursor:default;">
                        <div style="margin-bottom: 4px;">${m.name}</div>
                        <div style="font-size: 1rem; line-height: 1.3;">${icon}</div>
                        ${hasCargo ? `<div style="font-size:0.6rem; margin-top:3px; opacity:0.8;">Cob: $${netCargo.toLocaleString()}</div>` : ''}
                    </div>
                `;
            });
            cycleHTML += `</div></div>`;

            content.innerHTML = `
                <div class="expediente-section">
                    ${cycleHTML}
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h4>Estado de Cuenta General</h4>
                        ${currentUser && currentUser.role === 'PADRE' ? '' : `<button onclick="showAddDebtForm()" class="btn-primary" style="font-size:0.8rem; padding:6px 12px; background:var(--primary); color:white; border:none; border-radius:4px; cursor:pointer;"><i class="fas fa-plus"></i> Asignar Adeudo</button>`}
                    </div>
                    
                    <div id="add-debt-form" style="display:none; background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:15px;">
                        <h5 style="margin-top:0; color:var(--primary);">Nuevo Cargo / Adeudo</h5>
                        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:10px;">
                            <input type="text" id="debt-concept" placeholder="Concepto (ej. Colegiatura Mayo)" class="form-select">
                            <input type="number" id="debt-amount" placeholder="Monto ($)" class="form-select">
                        </div>
                        <div style="margin-top:10px; text-align:right;">
                            <button onclick="document.getElementById('add-debt-form').style.display='none'" class="btn-secondary" style="padding:6px 12px; font-size:0.8rem; border:1px solid #e2e8f0; border-radius:4px; cursor:pointer;">Cancelar</button>
                            <button onclick="saveStudentDebt()" class="btn-primary" style="padding:6px 12px; font-size:0.8rem; background:#10b981; color:white; border:none; border-radius:4px; cursor:pointer;">Guardar Cargo</button>
                        </div>
                    </div>

                    <table style="width:100%; font-size:0.85rem; border-collapse:collapse; margin-top:20px;">
                        <thead>
                            <tr style="text-align:left; border-bottom:2px solid var(--primary-light);">
                                <th style="padding:8px 4px;">Fecha</th>
                                <th style="padding:8px 4px;">Concepto</th>
                                <th style="padding:8px 4px;">Cargo</th>
                                <th style="padding:8px 4px;">Abono</th>
                                <th style="padding:8px 4px;">Saldo</th>
                                <th style="padding:8px 4px; text-align:center;">Detalles</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML || '<tr><td colspan="6" style="text-align:center; padding:15px; color:#64748b;">No hay registros de pagos ni adeudos.</td></tr>'}
                        </tbody>
                        <tfoot>
                            <tr style="border-top:2px solid var(--primary); font-weight:bold;">
                                <td colspan="4" style="text-align:right; padding:12px 4px;">SALDO PENDIENTE REQUERIDO:</td>
                                <td colspan="2" style="padding:12px 4px; font-size:1.1rem; color:${balance > 0 ? '#dc2626' : '#059669'}">$${Math.max(0, balance).toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        } else if (tab === 'digital') {
            const d = studentDetails[currentStudent.name] || {};
            const m = d.mother || { name: 'S/D', phone: 'S/D', address: 'S/D', email: 'S/D', profession: 'S/D', isTutor: false };
            const f = d.father || { name: 'S/D', phone: 'S/D', address: 'S/D', email: 'S/D', profession: 'S/D', isTutor: false };

            content.innerHTML = `
                <div class="expediente-section">
                    <h4>Datos de la Madre ${m.isTutor ? '<span class="tutor-badge">TUTOR</span>' : ''}</h4>
                    <div class="info-grid">
                        <div class="info-group"><strong>Nombre:</strong> <span>${m.name}</span></div>
                        <div class="info-group"><strong>Teléfono:</strong> <span>${m.phone}</span></div>
                        <div class="info-group"><strong>Dirección:</strong> <span>${m.address}</span></div>
                        <div class="info-group"><strong>Correo:</strong> <span>${m.email}</span></div>
                        <div class="info-group"><strong>Profesión:</strong> <span>${m.profession}</span></div>
                    </div>
                </div>
                <div class="expediente-section" style="margin-top:20px;">
                    <h4>Datos del Padre ${f.isTutor ? '<span class="tutor-badge">TUTOR</span>' : ''}</h4>
                    <div class="info-grid">
                        <div class="info-group"><strong>Nombre:</strong> <span>${f.name}</span></div>
                        <div class="info-group"><strong>Teléfono:</strong> <span>${f.phone}</span></div>
                        <div class="info-group"><strong>Dirección:</strong> <span>${f.address}</span></div>
                        <div class="info-group"><strong>Correo:</strong> <span>${f.email}</span></div>
                        <div class="info-group"><strong>Profesión:</strong> <span>${f.profession}</span></div>
                    </div>
                </div>
                <div class="expediente-section" style="margin-top:20px;">
                    <h4>Documentación Entregada</h4>
                    <div class="data-item"><span>Acta de Nacimiento</span> <strong>Entregado</strong></div>
                    <div class="data-item"><span>CURP Actualizado</span> <strong>Entregado</strong></div>
                    <div class="data-item"><span>Certificado de Nivel Anterior</span> <strong>Entregado</strong></div>
                </div>
            `;
        } else if (tab === 'chat') {
            content.innerHTML = `<div id="chat-messages" class="chat-messages"></div><textarea id="chat-input" placeholder="Mensaje..."></textarea><button onclick="sendMessage()">Enviar</button>`;
            renderMessages();
        }
    };

    window.showAddDebtForm = () => {
        document.getElementById('add-debt-form').style.display = 'block';
    };

    window.saveStudentDebt = () => {
        const concept = document.getElementById('debt-concept').value.trim();
        const amount = parseFloat(document.getElementById('debt-amount').value);
        if (!concept || !amount || amount <= 0) {
            alert("Por favor ingrese un concepto y un monto válido mayor a 0.");
            return;
        }

        if (!studentDetails[currentStudent.name]) studentDetails[currentStudent.name] = { mother: { name: 'S/D' }, father: { name: 'S/D' }, payments: [] };
        if (!studentDetails[currentStudent.name].payments) studentDetails[currentStudent.name].payments = [];

        studentDetails[currentStudent.name].payments.push({
            type: 'CARGO',
            date: new Date().toLocaleDateString(),
            concept: concept,
            amount: amount,
            folio: 'ADEUDO'
        });

        // Ordenar por fecha temporal si se quisiera, pero al agregarlo al final queda como hoy
        saveData();
        switchTab('payments');
        alert(`¡Cargo de $${amount} registrado exitosamente para ${currentStudent.name}!`);
    };

    window.deleteStudentPayment = (index) => {
        if (confirm("¿Seguro que deseas eliminar este registro del Estado de Cuenta? (No alterará el saldo global de la caja)")) {
            studentDetails[currentStudent.name].payments.splice(index, 1);
            saveData();
            switchTab('payments');
        }
    };

    window.switchTeacherTab = (tab) => {
        document.querySelectorAll('.tab-btn-teacher').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase().includes(tab === 'digital' ? 'perso' : 'grupos')));
        const content = document.getElementById('teacher-tab-content');
        if (tab === 'digital') content.innerHTML = `<p>Email: ${currentTeacher.email}</p>`;
        else {
            content.innerHTML = '';
            (teacherGroups[currentTeacher.name] || []).forEach(g => {
                const btn = document.createElement('button'); btn.innerText = g.name; btn.onclick = () => viewGroupGrades(g.id, g.name);
                content.appendChild(btn);
            });
        }
    };

    window.switchTutorTab = (tab) => {
        document.querySelectorAll('.tab-btn-tutor').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase().includes(tab === 'info' ? 'gene' : 'hijos')));
        const content = document.getElementById('tutor-tab-content');
        if (tab === 'info') content.innerHTML = `<p>Tel: ${currentTutor.phone}</p>`;
        else {
            content.innerHTML = '';
            (tutorChildren[currentTutor.name] || []).forEach(c => {
                const div = document.createElement('div');
                div.innerHTML = `<span>${c.name}</span> <button onclick="viewExpediente('${c.name}')">Ver</button>`;
                content.appendChild(div);
            });
        }
    };

    // --- CHAT LOGIC ---

    function renderMessages() {
        const history = chatHistories[currentStudent.name] || [];
        const container = document.getElementById('chat-messages');
        if (!container) return;
        container.innerHTML = history.map(m => `<div class="message ${m.type}">${m.text}</div>`).join('');
    }

    window.sendMessage = () => {
        const input = document.getElementById('chat-input');
        if (!input.value) return;
        if (!chatHistories[currentStudent.name]) chatHistories[currentStudent.name] = [];
        chatHistories[currentStudent.name].push({ type: 'sent', text: input.value });
        input.value = '';
        renderMessages();
    };

    // --- EVENT LISTENERS ---

    document.getElementById('nav-home').addEventListener('click', (e) => { e.preventDefault(); showSubjects(); });
    document.getElementById('nav-students').addEventListener('click', (e) => { e.preventDefault(); showStudents(); });
    document.getElementById('nav-teachers').addEventListener('click', (e) => { e.preventDefault(); showTeachers(); });
    document.getElementById('nav-tutors').addEventListener('click', (e) => { e.preventDefault(); showTutors(); });
    document.getElementById('nav-courses').addEventListener('click', (e) => { e.preventDefault(); showCourses(); });
    document.getElementById('nav-payments').addEventListener('click', (e) => { e.preventDefault(); showPaymentsModule(); });
    document.getElementById('nav-services').addEventListener('click', (e) => { e.preventDefault(); showServicesBatch(); });

    const navExpenses = document.getElementById('nav-expenses');
    if (navExpenses) {
        navExpenses.addEventListener('click', (e) => { e.preventDefault(); showExpenses(); });
    }

    document.getElementById('nav-reports').addEventListener('click', (e) => { e.preventDefault(); showReports(); });
    groupFilter.addEventListener('change', (e) => showStudents(e.target.value));

    window.closeStudentModal = () => studentModal.style.display = 'none';
    window.closeTeacherModal = () => teacherModal.style.display = 'none';
    window.closeTutorModal = () => tutorModal.style.display = 'none';
    window.closeChatModal = () => document.getElementById('chat-modal').style.display = 'none';

    window.onclick = (e) => {
        if (e.target === studentModal && currentUser && currentUser.role !== 'PADRE') closeStudentModal(); // Padre no puede cerrar el modal de su hijo (por simplicidad de la demo readonly)
        if (e.target === teacherModal) closeTeacherModal();
        if (e.target === tutorModal) closeTutorModal();
        if (e.target === document.getElementById('chat-modal')) closeChatModal();
    };

    // --- INIT ---
    updateDailyQuote();
    // Default start view is now overridden by handleLogin, but we calculate basic initial stats in background
    updateDashboardStats();

    function animateValue(id, start, end, duration) {
        let obj = document.getElementById(id); if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            let val = Math.floor(progress * (end - start) + start);
            obj.innerHTML = (id.includes('revenue') ? '$' : '') + val.toLocaleString();
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }
});
