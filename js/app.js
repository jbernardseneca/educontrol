// =====================================================================
// APP - Inicialización y event listeners
// =====================================================================

document.addEventListener('DOMContentLoaded', function () {

    const EC = window.EduControl;
    const S = EC.state;

    // Inicializar referencias al DOM
    EC.initDom();

    // Event listeners de navegación
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
    EC.dom.groupFilter.addEventListener('change', (e) => showStudents(e.target.value, 1));

    // Cerrar modales
    window.closeStudentModal = () => EC.dom.studentModal.style.display = 'none';
    window.closeTeacherModal = () => EC.dom.teacherModal.style.display = 'none';
    window.closeTutorModal = () => EC.dom.tutorModal.style.display = 'none';
    window.closeChatModal = () => document.getElementById('chat-modal').style.display = 'none';

    window.onclick = (e) => {
        if (e.target === EC.dom.studentModal && S.currentUser && S.currentUser.role !== 'PADRE') closeStudentModal();
        if (e.target === EC.dom.teacherModal) closeTeacherModal();
        if (e.target === EC.dom.tutorModal) closeTutorModal();
        if (e.target === document.getElementById('chat-modal')) closeChatModal();
    };

    // Búsqueda global
    const searchInput = document.querySelector('#top-search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (query.length < 2) return;

            const matchedStudents = S.allStudents.filter(s => s.name.toLowerCase().includes(query));
            const matchedTeachers = S.teachers.filter(t => t.name.toLowerCase().includes(query));
            const matchedTutors = S.tutors.filter(t => t.name.toLowerCase().includes(query));

            if (matchedStudents.length === 0 && matchedTeachers.length === 0 && matchedTutors.length === 0) return;

            const D = EC.dom;
            D.dashboardHome.style.display = 'none';
            D.recentActivity.style.display = 'block';
            D.viewTitle.innerText = `Resultados de búsqueda: "${e.target.value.trim()}"`;
            D.btnBack.style.display = 'none';
            D.groupFilter.style.display = 'none';
            document.getElementById('main-table-container').style.display = 'block';
            document.getElementById('batch-capture-container').style.display = 'none';
            document.getElementById('payments-capture-container').style.display = 'none';
            document.getElementById('reports-container').style.display = 'none';
            document.getElementById('services-batch-container').style.display = 'none';
            document.getElementById('expenses-container').style.display = 'none';

            D.tableHead.innerHTML = `<th>Nombre</th><th>Tipo</th><th>Detalle</th><th>Acción</th>`;
            D.tableBody.innerHTML = '';

            matchedStudents.forEach(s => {
                const sId = EC.getStudentKey(s);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${EC.escapeHtml(s.name)}</strong></td>
                    <td><span style="background:#dbeafe; color:#1e40af; padding:3px 8px; border-radius:4px; font-size:0.75rem;">Alumno</span></td>
                    <td>${EC.escapeHtml(s.level)} - ${EC.escapeHtml(s.grade)} (${s.status})</td>
                    <td><button class="btn-action" onclick="viewExpedienteById('${sId}')">Ver Expediente</button></td>
                `;
                D.tableBody.appendChild(row);
            });

            matchedTeachers.forEach(t => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${EC.escapeHtml(t.name)}</strong></td>
                    <td><span style="background:#dcfce7; color:#166534; padding:3px 8px; border-radius:4px; font-size:0.75rem;">Profesor</span></td>
                    <td>${EC.escapeHtml(t.level || '')} - ${EC.escapeHtml(t.profession || '')}</td>
                    <td><button class="btn-action" onclick="viewTeacherExpediente('${t.name.replace(/'/g, "\\'")}')">Ver Expediente</button></td>
                `;
                D.tableBody.appendChild(row);
            });

            matchedTutors.forEach(t => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${EC.escapeHtml(t.name)}</strong></td>
                    <td><span style="background:#fef3c7; color:#92400e; padding:3px 8px; border-radius:4px; font-size:0.75rem;">Tutor</span></td>
                    <td>${EC.escapeHtml(t.phone || '')} - ${EC.escapeHtml(t.email || '')}</td>
                    <td><button class="btn-action" onclick="viewTutorExpediente('${t.name.replace(/'/g, "\\'")}')">Ver Datos</button></td>
                `;
                D.tableBody.appendChild(row);
            });
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                showStudents();
            }
        });
    }

    // Inicialización
    EC.updateDailyQuote();
    EC.updateDashboardStats();

});
