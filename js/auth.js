// =====================================================================
// AUTH - Autenticación y control de acceso por roles
// =====================================================================

(function (EC) {

    window.handleLogin = async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-username').value.trim();
        const pass = document.getElementById('login-password').value;
        const errorMsg = document.getElementById('login-error-msg');

        try {
            EC.showLoadingState(true);

            const credential = await auth.signInWithEmailAndPassword(email, pass);
            const uid = credential.user.uid;

            let userDoc;
            try {
                userDoc = await db.collection('users').doc(uid).get();
            } catch (fsError) {
                errorMsg.innerText = `⚠️ Error de conexión: ${fsError.code}`;
                errorMsg.style.display = 'block';
                await auth.signOut();
                EC.showLoadingState(false);
                return;
            }

            if (!userDoc.exists) {
                const perfilesConocidos = {
                    'jmartinez.seneca@gmail.com': { name: 'Administrador', role: 'ADMIN' },
                    'jbernard@prodigy.net.mx': { name: 'José Bernardo', role: 'TESORERIA' },
                    'jbernard63@hotmail.com': { name: 'Profesor(a)', role: 'MAESTRO' }
                };
                const perfil = perfilesConocidos[email.toLowerCase()];
                if (perfil) {
                    await db.collection('users').doc(uid).set({ email: email, ...perfil });
                    userDoc = await db.collection('users').doc(uid).get();
                } else {
                    await auth.signOut();
                    errorMsg.innerText = 'Usuario sin perfil configurado. Contacta al administrador.';
                    errorMsg.style.display = 'block';
                    EC.showLoadingState(false);
                    return;
                }
            }

            EC.state.currentUser = { uid, ...userDoc.data() };

            await EC.loadAllData();

            errorMsg.style.display = 'none';
            document.getElementById('login-overlay').style.display = 'none';
            document.getElementById('main-app-container').style.display = 'flex';
            document.getElementById('header-user-name').innerText = EC.state.currentUser.name;
            document.getElementById('header-user-avatar').src =
                `https://ui-avatars.com/api/?name=${encodeURIComponent(EC.state.currentUser.name)}&background=0D8ABC&color=fff`;

            EC.applyRoleRestrictions(EC.state.currentUser.role);

        } catch (error) {
            console.error('Error de autenticación:', error);
            let msg = 'Correo o contraseña incorrectos.';
            if (error.code === 'auth/too-many-requests') msg = 'Demasiados intentos. Intenta más tarde.';
            if (error.code === 'auth/network-request-failed') msg = 'Sin conexión a internet.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') msg = 'Correo o contraseña incorrectos.';
            errorMsg.innerText = `⚠️ ${msg}`;
            errorMsg.style.display = 'block';
            EC.showLoadingState(false);
        }
    };

    window.logout = async () => {
        await auth.signOut();
        const S = EC.state;
        S.currentUser = null;
        S.allStudents = []; S.financialHistory = []; S.studentDetails = {};
        S.teachers = []; S.subjects = []; S.tutors = []; S.chatHistories = {};

        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('main-app-container').style.display = 'none';
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        document.body.classList.remove('padre-readonly-mode');
        document.querySelectorAll('.hidden-by-role').forEach(n => n.classList.remove('hidden-by-role'));
        EC.showLoadingState(false);
    };

    EC.applyRoleRestrictions = function (role) {
        document.body.classList.remove('padre-readonly-mode');
        document.querySelectorAll('.hidden-by-role').forEach(n => n.classList.remove('hidden-by-role'));
        document.getElementById('top-search-bar').style.display = 'flex';

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
            document.body.classList.add('padre-readonly-mode');
            const hijoName = EC.state.currentUser.studentName || '';
            if (hijoName) {
                viewExpediente(hijoName);
            } else {
                alert('Tu perfil no tiene alumno asignado. Contacta al administrador.');
            }
        }
    };

})(window.EduControl);
