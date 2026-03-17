// =====================================================================
// STUDENTS - Vistas de alumnos, maestros, tutores, cursos y expedientes
// =====================================================================

(function (EC) {

    const S = EC.state;
    const STUDENTS_PER_PAGE = 25;
    let currentStudentPage = 1;
    let currentStudentFilter = 'all';

    // --- Helpers de navegación ---

    function updateNav(activeId) {
        document.querySelectorAll('nav ul li').forEach(li => li.classList.remove('active'));
        const activeLink = document.getElementById(activeId);
        if (activeLink) activeLink.classList.add('active');
        const btnBatch = document.getElementById('btn-batch-capture');
        const btnExport = document.getElementById('btn-export-students');
        if (activeId === 'nav-students') {
            btnBatch.style.display = 'block';
            if (btnExport) btnExport.style.display = 'block';
        } else {
            btnBatch.style.display = 'none';
            if (btnExport) btnExport.style.display = 'none';
        }
    }
    EC.updateNav = updateNav;

    function updateDailyQuote() {
        const title = document.getElementById('welcome-title');
        const quote = document.getElementById('daily-quote');
        const day = new Date().getDate();
        const hour = new Date().getHours();
        const selected = EC.quotes[day % EC.quotes.length];
        let greeting = hour < 12 ? "¡Buenos días!" : (hour < 19 ? "¡Buenas tardes!" : "¡Buenas noches!");
        if (title) title.innerText = `${greeting} Bienvenido al Panel Escolar`;
        if (quote) quote.innerHTML = `"${selected.text}" <br><strong>- ${selected.author}</strong>`;
    }
    EC.updateDailyQuote = updateDailyQuote;

    // --- Vistas principales ---

    window.showSubjects = () => {
        const D = EC.dom;
        updateNav('nav-home');
        D.dashboardHome.style.display = 'block';
        D.recentActivity.style.display = 'block';
        D.viewTitle.innerText = 'Materias Asignadas';
        D.btnBack.style.display = 'none';
        D.groupFilter.style.display = 'none';
        D.tableHead.innerHTML = `<th>Materia</th><th>Grupo</th><th>Alumnos</th><th>Acción</th>`;
        D.tableBody.innerHTML = '';
        S.subjects.forEach(sub => {
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${EC.escapeHtml(sub.name)}</strong></td><td>${EC.escapeHtml(sub.group)}</td><td>${sub.studentsCount}</td><td><button class="btn-action" onclick="viewStudents(${sub.id}, '${sub.name.replace(/'/g, "\\'")}')">Ver Alumnos</button></td>`;
            D.tableBody.appendChild(row);
        });
    };

    window.showStudents = (filter = 'all', page = 1) => {
        const D = EC.dom;
        currentStudentFilter = filter;
        currentStudentPage = page;
        updateNav('nav-students');
        D.dashboardHome.style.display = 'none';
        D.recentActivity.style.display = 'block';
        D.btnBack.style.display = 'none';
        D.groupFilter.style.display = 'block';

        document.getElementById('main-table-container').style.display = 'block';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('reports-container').style.display = 'none';
        document.getElementById('services-batch-container').style.display = 'none';

        D.tableHead.innerHTML = `<th>Nombre</th><th>Nivel</th><th>Grado</th><th>Estado</th><th>Acción</th>`;
        D.tableBody.innerHTML = '';
        let list = filter === 'all' ? [...S.allStudents] : S.allStudents.filter(s => s.level === filter);
        list.sort((a, b) => a.name.localeCompare(b.name));

        const totalItems = list.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / STUDENTS_PER_PAGE));
        if (page > totalPages) page = totalPages;
        const startIdx = (page - 1) * STUDENTS_PER_PAGE;
        const pageItems = list.slice(startIdx, startIdx + STUDENTS_PER_PAGE);

        D.viewTitle.innerText = `Listado de Alumnos (${totalItems})`;

        pageItems.forEach(s => {
            const row = document.createElement('tr');
            const statusClass = s.status === 'Activo' ? 'status-paid' : 'status-due';
            const sId = EC.getStudentKey(s);
            const canDelete = S.currentUser && S.currentUser.role === 'ADMIN';

            row.innerHTML = `
                <td><strong>${EC.escapeHtml(s.name)}</strong></td>
                <td>${EC.escapeHtml(s.level)}</td>
                <td>${EC.escapeHtml(s.grade)}</td>
                <td><span class="${statusClass}">${EC.escapeHtml(s.status)}</span></td>
                <td>
                    <button class="btn-action" onclick="viewExpedienteById('${sId}')">Ver</button>
                    ${s.status === 'Activo' && canDelete ? `<button class="btn-action" style="color:#ef4444;" onclick="unenrollStudentById('${sId}')" title="Dar de Baja"><i class="fas fa-user-minus"></i> Baja</button>` : ''}
                    ${canDelete ? `<button class="btn-action" style="color:#dc2626;" onclick="deleteStudentById('${sId}')" title="Eliminar Definitivamente"><i class="fas fa-trash-alt"></i> Eliminar</button>` : ''}
                </td>
            `;
            D.tableBody.appendChild(row);
        });

        // Paginación
        if (totalPages > 1) {
            const paginationRow = document.createElement('tr');
            let paginationHTML = '<td colspan="5" style="text-align:center; padding:15px;">';
            paginationHTML += `<span style="color:var(--text-muted); font-size:0.85rem; margin-right:15px;">Página ${page} de ${totalPages}</span>`;
            if (page > 1) {
                paginationHTML += `<button onclick="showStudents('${filter}', ${page - 1})" class="btn-secondary" style="padding:5px 12px; font-size:0.8rem; margin:0 3px;"><i class="fas fa-chevron-left"></i> Anterior</button>`;
            }
            const startPage = Math.max(1, page - 2);
            const endPage = Math.min(totalPages, page + 2);
            for (let i = startPage; i <= endPage; i++) {
                const isActive = i === page;
                paginationHTML += `<button onclick="showStudents('${filter}', ${i})" style="padding:5px 10px; margin:0 2px; font-size:0.8rem; border-radius:4px; border:1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}; background:${isActive ? 'var(--primary)' : 'white'}; color:${isActive ? 'white' : 'var(--text-main)'}; cursor:pointer; font-weight:${isActive ? '700' : '400'};">${i}</button>`;
            }
            if (page < totalPages) {
                paginationHTML += `<button onclick="showStudents('${filter}', ${page + 1})" class="btn-secondary" style="padding:5px 12px; font-size:0.8rem; margin:0 3px;">Siguiente <i class="fas fa-chevron-right"></i></button>`;
            }
            paginationHTML += '</td>';
            paginationRow.innerHTML = paginationHTML;
            D.tableBody.appendChild(paginationRow);
        }
    };

    window.unenrollStudent = (name) => {
        const student = EC.findStudentByName(name);
        if (student) unenrollStudentById(EC.getStudentKey(student));
    };

    window.unenrollStudentById = (id) => {
        const student = S.allStudents.find(s => EC.getStudentKey(s) === id);
        if (!student) return;
        if (confirm(`¿Está seguro que desea dar de BAJA al alumno: ${student.name}?`)) {
            student.status = 'Baja';
            EC.saveData();
            showStudents(EC.dom.groupFilter.value);
            alert(`El alumno ${student.name} ha sido dado de baja exitosamente.`);
        }
    };

    window.deleteStudent = (name) => {
        const student = EC.findStudentByName(name);
        if (student) deleteStudentById(EC.getStudentKey(student));
    };

    window.deleteStudentById = (id) => {
        const student = S.allStudents.find(s => EC.getStudentKey(s) === id);
        if (!student) return;
        if (confirm(`¡ADVERTENCIA! ¿Está seguro que desea ELIMINAR PERMANENTEMENTE a: ${student.name}?\nEsta acción borrará todo su historial y no se puede deshacer.`)) {
            if (confirm(`Confirme nuevamente: ¿Realmente desea borrar a ${student.name}?`)) {
                const index = S.allStudents.indexOf(student);
                if (index !== -1) {
                    S.allStudents.splice(index, 1);
                    delete S.studentDetails[id];
                    delete S.chatHistories[id];
                    EC.saveData();
                    showStudents(EC.dom.groupFilter.value);
                    alert(`El registro de ${student.name} ha sido eliminado totalmente.`);
                }
            }
        }
    };

    window.showTeachers = () => {
        const D = EC.dom;
        updateNav('nav-teachers');
        D.dashboardHome.style.display = 'none';
        D.recentActivity.style.display = 'block';
        D.viewTitle.innerText = 'Listado de Maestros';
        D.btnBack.style.display = 'none';
        D.groupFilter.style.display = 'block';

        document.getElementById('main-table-container').style.display = 'block';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('reports-container').style.display = 'none';

        D.tableHead.innerHTML = `<th>Nombre</th><th>Nivel</th><th>Profesión</th><th>Acción</th>`;
        D.tableBody.innerHTML = '';
        S.teachers.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${EC.escapeHtml(t.name)}</strong></td><td>${EC.escapeHtml(t.level)}</td><td>${EC.escapeHtml(t.profession)}</td><td><button class="btn-action" onclick="viewTeacherExpediente('${t.name.replace(/'/g, "\\'")}')">Ver Expediente</button></td>`;
            D.tableBody.appendChild(row);
        });
    };

    window.showTutors = () => {
        const D = EC.dom;
        updateNav('nav-tutors');
        D.dashboardHome.style.display = 'none';
        D.recentActivity.style.display = 'block';
        D.viewTitle.innerText = 'Listado de Tutores';
        D.btnBack.style.display = 'none';
        D.groupFilter.style.display = 'none';

        document.getElementById('main-table-container').style.display = 'block';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('reports-container').style.display = 'none';

        D.tableHead.innerHTML = `<th>Nombre</th><th>Teléfono</th><th>Email</th><th>Acción</th>`;
        D.tableBody.innerHTML = '';
        S.tutors.forEach(t => {
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${EC.escapeHtml(t.name)}</strong></td><td>${EC.escapeHtml(t.phone)}</td><td>${EC.escapeHtml(t.email)}</td><td><button class="btn-action" onclick="viewTutorExpediente('${t.name.replace(/'/g, "\\'")}')">Ver Datos</button></td>`;
            D.tableBody.appendChild(row);
        });
    };

    window.showCourses = () => {
        const D = EC.dom;
        updateNav('nav-courses');
        D.dashboardHome.style.display = 'none';
        D.recentActivity.style.display = 'block';
        D.viewTitle.innerText = 'Catálogo de Cursos';
        D.btnBack.style.display = 'none';
        D.groupFilter.style.display = 'none';

        document.getElementById('main-table-container').style.display = 'block';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('reports-container').style.display = 'none';

        D.tableHead.innerHTML = `<th>Curso</th><th>Grupo</th><th>Maestro</th><th>Acción</th>`;
        D.tableBody.innerHTML = '';
        S.subjects.forEach(sub => {
            let tName = "Por asignar";
            for (let t in S.teacherGroups) if (S.teacherGroups[t].some(g => g.id === sub.id)) tName = t;
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${EC.escapeHtml(sub.name)}</strong></td><td>${EC.escapeHtml(sub.group)}</td><td>${EC.escapeHtml(tName)}</td><td><button class="btn-action" onclick="viewGroupGrades(${sub.id}, '${sub.name.replace(/'/g, "\\'")}')">Ver Alumnos</button></td>`;
            D.tableBody.appendChild(row);
        });
    };

    // --- Expedientes ---

    window.viewExpedienteById = (id) => {
        S.currentStudent = S.allStudents.find(s => EC.getStudentKey(s) === id);
        if (!S.currentStudent) return;
        if (EC.dom.tutorModal) EC.dom.tutorModal.style.display = 'none';
        if (EC.dom.teacherModal) EC.dom.teacherModal.style.display = 'none';
        document.getElementById('modal-student-name').innerText = S.currentStudent.name;
        document.getElementById('modal-student-level').innerText = S.currentStudent.level;
        document.getElementById('modal-student-grade').innerText = S.currentStudent.grade;
        EC.dom.studentModal.style.display = 'block';
        switchTab('grades');
    };

    window.viewExpediente = (name) => {
        const student = EC.findStudentByName(name);
        if (!student) return;
        viewExpedienteById(EC.getStudentKey(student));
    };

    window.viewStudents = (id, name) => {
        const D = EC.dom;
        D.dashboardHome.style.display = 'none';
        D.viewTitle.innerText = `Alumnos: ${name}`;
        D.btnBack.style.display = 'block';
        D.btnBack.onclick = showSubjects;
        D.tableHead.innerHTML = `<th>Nombre</th><th>Nivel</th><th>Grado</th><th>Acción</th>`;
        D.tableBody.innerHTML = '';
        S.allStudents.filter(s => s.level === (id === 2 ? 'Bachillerato' : 'Primaria')).forEach(s => {
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${s.name}</strong></td><td>${s.level}</td><td>${s.grade}</td><td><button class="btn-action" onclick="viewExpediente('${s.name}')">Ver Expediente</button></td>`;
            D.tableBody.appendChild(row);
        });
    };

    window.viewTeacherExpediente = (name) => {
        S.currentTeacher = S.teachers.find(t => t.name === name);
        if (!S.currentTeacher) return;
        document.getElementById('modal-teacher-name').innerText = S.currentTeacher.name;
        EC.dom.teacherModal.style.display = 'block';
        switchTeacherTab('digital');
    };

    window.viewTutorExpediente = (name) => {
        S.currentTutor = S.tutors.find(t => t.name === name);
        if (!S.currentTutor) return;
        document.getElementById('modal-tutor-name').innerText = S.currentTutor.name;
        EC.dom.tutorModal.style.display = 'block';
        switchTutorTab('info');
    };

    window.viewGroupGrades = (id, name) => {
        const D = EC.dom;
        D.dashboardHome.style.display = 'none';
        D.viewTitle.innerText = `Calificaciones: ${name}`;
        D.btnBack.style.display = 'block';
        D.btnBack.onclick = showCourses;
        D.tableHead.innerHTML = `<th>Alumno</th><th>P1</th><th>P2</th><th>P3</th><th>Promedio</th>`;
        D.tableBody.innerHTML = '';
        const grads = S.periodGrades[id === 1 ? 201 : 101] || [];
        grads.forEach(g => {
            const avg = ((g.p1 + g.p2 + g.p3) / 3).toFixed(1);
            const row = document.createElement('tr');
            row.innerHTML = `<td><strong>${g.name}</strong></td><td>${g.p1}</td><td>${g.p2}</td><td>${g.p3}</td><td>${avg}</td>`;
            D.tableBody.appendChild(row);
        });
    };

    // --- Pestañas de modales ---

    window.switchTab = (tab) => {
        if (S.currentUser && (S.currentUser.role === 'MAESTRO')) {
            if (tab === 'payments' || tab === 'digital') {
                alert("Acceso Restringido: Tu rol no tiene permisos para ver esta sección.");
                return;
            }
        }

        document.querySelectorAll('.tab-btn').forEach(b => {
            if (S.currentUser && S.currentUser.role === 'MAESTRO' && (b.innerText.includes('Estado') || b.innerText.includes('Document'))) {
                b.style.display = 'none';
            }
            b.classList.toggle('active', b.innerText.toLowerCase().includes(tab === 'grades' ? 'calif' : (tab === 'payments' ? 'pagos' : (tab === 'digital' ? 'digital' : (tab === 'edit' ? 'editar' : 'chat')))))
        });

        const content = document.getElementById('tab-content');
        if (tab === 'grades') {
            renderGradesTab(content);
        } else if (tab === 'payments') {
            renderPaymentsTab(content);
        } else if (tab === 'digital') {
            renderDigitalTab(content);
        } else if (tab === 'edit') {
            renderEditTab(content);
        } else if (tab === 'chat') {
            content.innerHTML = `<div id="chat-messages" class="chat-messages"></div><textarea id="chat-input" placeholder="Mensaje..."></textarea><button onclick="sendMessage()">Enviar</button>`;
            renderMessages();
        }
    };

    function renderGradesTab(content) {
        let gradesHTML = '';
        let totalGrades = 0;
        let gradeCount = 0;

        for (let subjectId in S.periodGrades) {
            const gradesList = S.periodGrades[subjectId] || [];
            const studentGrade = gradesList.find(g => g.name === S.currentStudent.name);
            if (studentGrade) {
                const sub = S.subjects.find(s => s.id === parseInt(subjectId)) || { name: 'Materia ' + subjectId };
                const p1 = studentGrade.p1 || 0;
                const p2 = studentGrade.p2 || 0;
                const p3 = studentGrade.p3 || 0;
                const periods = [p1, p2, p3].filter(p => p > 0);
                const avg = periods.length > 0 ? (periods.reduce((a, b) => a + b, 0) / periods.length) : 0;
                if (avg > 0) { totalGrades += avg; gradeCount++; }
                gradesHTML += `
                    <tr>
                        <td style="padding:8px; border-bottom:1px solid #e2e8f0;"><strong>${EC.escapeHtml(sub.name)}</strong></td>
                        <td style="padding:8px; border-bottom:1px solid #e2e8f0; text-align:center;">${p1 || '-'}</td>
                        <td style="padding:8px; border-bottom:1px solid #e2e8f0; text-align:center;">${p2 || '-'}</td>
                        <td style="padding:8px; border-bottom:1px solid #e2e8f0; text-align:center;">${p3 || '-'}</td>
                        <td style="padding:8px; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:bold; color:${avg >= 6 ? '#059669' : '#dc2626'}">${avg > 0 ? avg.toFixed(1) : '-'}</td>
                    </tr>
                `;
            }
        }

        const promedioGeneral = gradeCount > 0 ? (totalGrades / gradeCount).toFixed(1) : 'N/A';

        if (gradesHTML) {
            content.innerHTML = `
                <div class="expediente-section">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <h4>Calificaciones por Materia</h4>
                        <span style="background:${promedioGeneral !== 'N/A' && parseFloat(promedioGeneral) >= 6 ? '#dcfce7' : '#fee2e2'}; color:${promedioGeneral !== 'N/A' && parseFloat(promedioGeneral) >= 6 ? '#166534' : '#991b1b'}; padding:6px 14px; border-radius:8px; font-weight:700;">Promedio General: ${promedioGeneral}</span>
                    </div>
                    <table style="width:100%; font-size:0.85rem; border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:2px solid var(--primary-light);">
                                <th style="padding:8px; text-align:left;">Materia</th>
                                <th style="padding:8px; text-align:center;">P1</th>
                                <th style="padding:8px; text-align:center;">P2</th>
                                <th style="padding:8px; text-align:center;">P3</th>
                                <th style="padding:8px; text-align:center;">Promedio</th>
                            </tr>
                        </thead>
                        <tbody>${gradesHTML}</tbody>
                    </table>
                </div>
            `;
        } else {
            content.innerHTML = `<div style="text-align:center; padding:30px; color:#64748b;"><i class="fas fa-book-open" style="font-size:2rem; margin-bottom:10px; display:block; opacity:0.5;"></i>No hay calificaciones registradas para este alumno.</div>`;
        }
    }

    function renderPaymentsTab(content) {
        const studentKey = EC.getStudentKey(S.currentStudent);
        const history = S.studentDetails[studentKey]?.payments || [];
        let balance = 0;

        let rowsHTML = history.map((p, index) => {
            const discount = p.discount || 0;
            let cargo = 0;
            if (p.type === 'CARGO') {
                cargo = p.netAmount !== undefined ? p.netAmount : (p.amount - discount);
            }
            let abono = p.type !== 'CARGO' ? p.amount : 0;
            balance += cargo - abono;

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
            const cargo = history.find(p => p.type === 'CARGO' && p.concept && p.concept.toLowerCase().includes(m.key));
            const abono = history.find(p => p.type !== 'CARGO' && p.concept && p.concept.toLowerCase().includes(m.key));
            const disc = cargo ? (cargo.discount || 0) : 0;
            const netCargo = cargo ? (cargo.netAmount !== undefined ? cargo.netAmount : (cargo.amount - disc)) : 0;
            const totalPaid = abono ? abono.amount : 0;
            const pending = netCargo - totalPaid;
            const isPaid = abono && pending <= 0;
            const hasCargo = !!cargo;

            let bgColor, textColor, borderColor, icon;
            if (!hasCargo) {
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
                    ${S.currentUser && S.currentUser.role === 'PADRE' ? '' : `<button onclick="showAddDebtForm()" class="btn-primary" style="font-size:0.8rem; padding:6px 12px; background:var(--primary); color:white; border:none; border-radius:4px; cursor:pointer;"><i class="fas fa-plus"></i> Asignar Adeudo</button>`}
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
    }

    function renderDigitalTab(content) {
        const d = S.studentDetails[EC.getStudentKey(S.currentStudent)] || {};
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
    }

    function renderEditTab(content) {
        if (S.currentUser && (S.currentUser.role === 'MAESTRO' || S.currentUser.role === 'PADRE')) {
            alert("Acceso Restringido: Tu rol no tiene permisos para editar datos.");
            return;
        }
        const studentKey = EC.getStudentKey(S.currentStudent);
        const d = S.studentDetails[studentKey] || {};
        const m = d.mother || { name: '', phone: '', address: '', email: '', profession: '', isTutor: false };
        const f = d.father || { name: '', phone: '', address: '', email: '', profession: '', isTutor: false };

        content.innerHTML = `
            <div class="expediente-section">
                <h4><i class="fas fa-user-graduate"></i> Datos del Alumno</h4>
                <div class="info-grid" style="margin-bottom:20px;">
                    <div class="info-group">
                        <label>Nombre Completo:</label>
                        <input type="text" id="edit-student-name" class="form-select" style="width:100%;" value="${EC.escapeHtml(S.currentStudent.name)}">
                    </div>
                    <div class="info-group">
                        <label>Nivel:</label>
                        <select id="edit-student-level" class="form-select" style="width:100%;">
                            <option value="Por Definir" ${S.currentStudent.level === 'Por Definir' ? 'selected' : ''}>Por Definir</option>
                            <option value="Preescolar" ${S.currentStudent.level === 'Preescolar' ? 'selected' : ''}>Preescolar</option>
                            <option value="Primaria" ${S.currentStudent.level === 'Primaria' ? 'selected' : ''}>Primaria</option>
                            <option value="Secundaria" ${S.currentStudent.level === 'Secundaria' ? 'selected' : ''}>Secundaria</option>
                            <option value="Bachillerato" ${S.currentStudent.level === 'Bachillerato' ? 'selected' : ''}>Bachillerato</option>
                        </select>
                    </div>
                    <div class="info-group">
                        <label>Grado/Grupo:</label>
                        <input type="text" id="edit-student-grade" class="form-select" style="width:100%;" value="${EC.escapeHtml(S.currentStudent.grade)}">
                    </div>
                    <div class="info-group">
                        <label>Estado:</label>
                        <select id="edit-student-status" class="form-select" style="width:100%;">
                            <option value="Activo" ${S.currentStudent.status === 'Activo' ? 'selected' : ''}>Activo</option>
                            <option value="Baja" ${S.currentStudent.status === 'Baja' ? 'selected' : ''}>Baja</option>
                        </select>
                    </div>
                </div>

                <h4><i class="fas fa-female"></i> Datos de la Madre</h4>
                <div class="info-grid" style="margin-bottom:20px;">
                    <div class="info-group"><label>Nombre:</label><input type="text" id="edit-mother-name" class="form-select" style="width:100%;" value="${EC.escapeHtml(m.name)}"></div>
                    <div class="info-group"><label>Teléfono:</label><input type="text" id="edit-mother-phone" class="form-select" style="width:100%;" value="${EC.escapeHtml(m.phone)}"></div>
                    <div class="info-group"><label>Dirección:</label><input type="text" id="edit-mother-address" class="form-select" style="width:100%;" value="${EC.escapeHtml(m.address)}"></div>
                    <div class="info-group"><label>Correo:</label><input type="email" id="edit-mother-email" class="form-select" style="width:100%;" value="${EC.escapeHtml(m.email)}"></div>
                    <div class="info-group"><label>Profesión:</label><input type="text" id="edit-mother-profession" class="form-select" style="width:100%;" value="${EC.escapeHtml(m.profession)}"></div>
                    <div class="info-group"><label>Es Tutor:</label><input type="checkbox" id="edit-mother-tutor" ${m.isTutor ? 'checked' : ''}></div>
                </div>

                <h4><i class="fas fa-male"></i> Datos del Padre</h4>
                <div class="info-grid" style="margin-bottom:20px;">
                    <div class="info-group"><label>Nombre:</label><input type="text" id="edit-father-name" class="form-select" style="width:100%;" value="${EC.escapeHtml(f.name)}"></div>
                    <div class="info-group"><label>Teléfono:</label><input type="text" id="edit-father-phone" class="form-select" style="width:100%;" value="${EC.escapeHtml(f.phone)}"></div>
                    <div class="info-group"><label>Dirección:</label><input type="text" id="edit-father-address" class="form-select" style="width:100%;" value="${EC.escapeHtml(f.address)}"></div>
                    <div class="info-group"><label>Correo:</label><input type="email" id="edit-father-email" class="form-select" style="width:100%;" value="${EC.escapeHtml(f.email)}"></div>
                    <div class="info-group"><label>Profesión:</label><input type="text" id="edit-father-profession" class="form-select" style="width:100%;" value="${EC.escapeHtml(f.profession)}"></div>
                    <div class="info-group"><label>Es Tutor:</label><input type="checkbox" id="edit-father-tutor" ${f.isTutor ? 'checked' : ''}></div>
                </div>

                <div style="text-align:right; padding-top:15px; border-top:1px solid #e2e8f0;">
                    <button onclick="saveStudentEdit()" style="background:#10b981; color:white; border:none; padding:10px 25px; border-radius:8px; font-weight:700; cursor:pointer;"><i class="fas fa-save"></i> Guardar Cambios</button>
                </div>
            </div>
        `;
    }

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
        const debtKey = EC.getStudentKey(S.currentStudent);
        if (!S.studentDetails[debtKey]) S.studentDetails[debtKey] = { mother: { name: 'S/D' }, father: { name: 'S/D' }, payments: [] };
        if (!S.studentDetails[debtKey].payments) S.studentDetails[debtKey].payments = [];
        S.studentDetails[debtKey].payments.push({
            type: 'CARGO', date: new Date().toLocaleDateString(), concept: concept, amount: amount, folio: 'ADEUDO'
        });
        EC.saveData();
        switchTab('payments');
        alert(`¡Cargo de $${amount} registrado exitosamente para ${S.currentStudent.name}!`);
    };

    window.saveStudentEdit = () => {
        if (!S.currentStudent) return;
        const studentKey = EC.getStudentKey(S.currentStudent);
        const newName = document.getElementById('edit-student-name').value.trim();
        if (!newName) { alert('El nombre no puede estar vacío.'); return; }

        S.currentStudent.name = newName;
        S.currentStudent.level = document.getElementById('edit-student-level').value;
        S.currentStudent.grade = document.getElementById('edit-student-grade').value.trim();
        S.currentStudent.status = document.getElementById('edit-student-status').value;

        if (!S.studentDetails[studentKey]) {
            S.studentDetails[studentKey] = { mother: {}, father: {}, payments: [] };
        }

        S.studentDetails[studentKey].mother = {
            name: document.getElementById('edit-mother-name').value.trim(),
            phone: document.getElementById('edit-mother-phone').value.trim(),
            address: document.getElementById('edit-mother-address').value.trim(),
            email: document.getElementById('edit-mother-email').value.trim(),
            profession: document.getElementById('edit-mother-profession').value.trim(),
            isTutor: document.getElementById('edit-mother-tutor').checked
        };

        S.studentDetails[studentKey].father = {
            name: document.getElementById('edit-father-name').value.trim(),
            phone: document.getElementById('edit-father-phone').value.trim(),
            address: document.getElementById('edit-father-address').value.trim(),
            email: document.getElementById('edit-father-email').value.trim(),
            profession: document.getElementById('edit-father-profession').value.trim(),
            isTutor: document.getElementById('edit-father-tutor').checked
        };

        if (!S.studentDetails[studentKey].payments) {
            S.studentDetails[studentKey].payments = [];
        }

        document.getElementById('modal-student-name').innerText = S.currentStudent.name;
        document.getElementById('modal-student-level').innerText = S.currentStudent.level;
        document.getElementById('modal-student-grade').innerText = S.currentStudent.grade;

        EC.saveData();
        alert('Datos del alumno actualizados correctamente.');
    };

    window.deleteStudentPayment = (index) => {
        if (confirm("¿Seguro que deseas eliminar este registro del Estado de Cuenta? (No alterará el saldo global de la caja)")) {
            const delKey = EC.getStudentKey(S.currentStudent);
            S.studentDetails[delKey].payments.splice(index, 1);
            EC.saveData();
            switchTab('payments');
        }
    };

    window.switchTeacherTab = (tab) => {
        document.querySelectorAll('.tab-btn-teacher').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase().includes(tab === 'digital' ? 'perso' : 'grupos')));
        const content = document.getElementById('teacher-tab-content');
        if (tab === 'digital') content.innerHTML = `<p>Email: ${S.currentTeacher.email}</p>`;
        else {
            content.innerHTML = '';
            (S.teacherGroups[S.currentTeacher.name] || []).forEach(g => {
                const btn = document.createElement('button'); btn.innerText = g.name; btn.onclick = () => viewGroupGrades(g.id, g.name);
                content.appendChild(btn);
            });
        }
    };

    window.switchTutorTab = (tab) => {
        document.querySelectorAll('.tab-btn-tutor').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase().includes(tab === 'info' ? 'gene' : 'hijos')));
        const content = document.getElementById('tutor-tab-content');
        if (tab === 'info') content.innerHTML = `<p>Tel: ${S.currentTutor.phone}</p>`;
        else {
            content.innerHTML = '';
            (S.tutorChildren[S.currentTutor.name] || []).forEach(c => {
                const div = document.createElement('div');
                div.innerHTML = `<span>${c.name}</span> <button onclick="viewExpediente('${c.name}')">Ver</button>`;
                content.appendChild(div);
            });
        }
    };

    // --- Chat ---
    function renderMessages() {
        const chatKey = EC.getStudentKey(S.currentStudent);
        const history = S.chatHistories[chatKey] || [];
        const container = document.getElementById('chat-messages');
        if (!container) return;
        container.innerHTML = history.map(m => `<div class="message ${m.type}">${m.text}</div>`).join('');
    }

    window.sendMessage = () => {
        const input = document.getElementById('chat-input');
        if (!input.value) return;
        const chatKey = EC.getStudentKey(S.currentStudent);
        if (!S.chatHistories[chatKey]) S.chatHistories[chatKey] = [];
        S.chatHistories[chatKey].push({ type: 'sent', text: input.value });
        input.value = '';
        renderMessages();
    };

})(window.EduControl);
