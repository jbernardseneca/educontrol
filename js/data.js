// =====================================================================
// DATA - Carga y guardado de datos en Firestore
// =====================================================================

(function (EC) {

    function showLoadingState(isLoading) {
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.disabled = isLoading;
            loginBtn.innerHTML = isLoading
                ? '<i class="fas fa-spinner fa-spin"></i> Cargando...'
                : '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
        }
    }
    EC.showLoadingState = showLoadingState;

    EC.loadAllData = async function () {
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

            const S = EC.state;
            S.allStudents = studentsDoc.exists ? (studentsDoc.data().data || []) : [];
            S.boxBalances = balancesDoc.exists ? (balancesDoc.data().data || S.boxBalances) : S.boxBalances;
            S.financialHistory = historyDoc.exists ? (historyDoc.data().data || []) : [];
            S.studentDetails = detailsDoc.exists ? (detailsDoc.data().data || {}) : {};
            S.teachers = teachersDoc.exists ? (teachersDoc.data().data || []) : [];
            S.teacherGroups = tGroupsDoc.exists ? (tGroupsDoc.data().data || {}) : {};
            S.periodGrades = pGradesDoc.exists ? (pGradesDoc.data().data || {}) : {};
            S.subjects = subjectsDoc.exists ? (subjectsDoc.data().data || []) : [];
            S.tutors = tutorsDoc.exists ? (tutorsDoc.data().data || []) : [];
            S.tutorChildren = tChildrenDoc.exists ? (tChildrenDoc.data().data || {}) : {};
            S.chatHistories = chatDoc.exists ? (chatDoc.data().data || {}) : {};

            EC.migrateStudentIds();
            showLoadingState(false);
        } catch (error) {
            console.error('Error cargando datos de Firestore:', error);
            showLoadingState(false);
            alert('Error al conectar con la base de datos. Verifica tu conexión a internet.');
        }
    };

    EC.saveData = async function () {
        try {
            const S = EC.state;
            await Promise.all([
                db.collection('crm_data').doc('students').set({ data: S.allStudents }),
                db.collection('crm_data').doc('balances').set({ data: S.boxBalances }),
                db.collection('crm_data').doc('history').set({ data: S.financialHistory }),
                db.collection('crm_data').doc('details').set({ data: S.studentDetails }),
                db.collection('crm_data').doc('teachers').set({ data: S.teachers }),
                db.collection('crm_data').doc('teacherGroups').set({ data: S.teacherGroups }),
                db.collection('crm_data').doc('periodGrades').set({ data: S.periodGrades }),
                db.collection('crm_data').doc('subjects').set({ data: S.subjects }),
                db.collection('crm_data').doc('tutors').set({ data: S.tutors }),
                db.collection('crm_data').doc('tutorChildren').set({ data: S.tutorChildren }),
                db.collection('crm_data').doc('chatHistories').set({ data: S.chatHistories }),
            ]);
            EC.updateDashboardStats();
        } catch (error) {
            console.error('Error guardando en Firestore:', error);
            alert('Advertencia: no se pudo guardar en la nube. Verifica tu conexión.');
        }
    };

    EC.updateDashboardStats = function () {
        const S = EC.state;
        const activeStudents = S.allStudents.filter(s => s.status === 'Activo').length;
        const totalTeachers = S.teachers.length;
        const totalCourses = S.subjects.length;

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const monthlyRevenue = S.financialHistory.reduce((acc, t) => {
            if (t.type === 'ENTRY') {
                const [datePart] = t.date.split(' ');
                const [day, month, year] = datePart.split('/');
                if (parseInt(month) === currentMonth && parseInt(year) === currentYear) {
                    return acc + t.amount;
                }
            }
            return acc;
        }, 0);

        EC.animateValue('total-students', 0, activeStudents, 1000);
        EC.animateValue('total-teachers', 0, totalTeachers, 1000);
        EC.animateValue('total-courses', 0, totalCourses, 1000);
        EC.animateValue('monthly-revenue', 0, monthlyRevenue, 1500);
    };

})(window.EduControl);
