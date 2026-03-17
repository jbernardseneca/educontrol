// =====================================================================
// PAYMENTS - Módulo de pagos, egresos, reportes y transferencias
// =====================================================================

(function (EC) {

    const S = EC.state;

    // --- Módulo de Pagos / Caja ---

    window.showPaymentsModule = () => {
        EC.updateNav('nav-payments');
        const D = EC.dom;
        D.dashboardHome.style.display = 'none';
        D.recentActivity.style.display = 'block';
        D.viewTitle.innerText = 'Caja y Cobranza';
        D.btnBack.style.display = 'none';
        D.groupFilter.style.display = 'none';

        document.getElementById('main-table-container').style.display = 'none';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'block';
        document.getElementById('reports-container').style.display = 'none';
        document.getElementById('services-batch-container').style.display = 'none';

        const datalist = document.getElementById('students-datalist');
        datalist.innerHTML = S.allStudents.map(s => `<option value="${s.name}">`).join('');
    };

    window.onPaymentStudentSelect = (name) => {
        const student = S.allStudents.find(s => s.name === name);
        const gradeInput = document.getElementById('pay-student-grade');
        gradeInput.value = student ? student.grade : '';
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

        const payStudent = EC.findStudentByName(name);
        const payKey = payStudent ? EC.getStudentKey(payStudent) : name;
        if (!S.studentDetails[payKey]) {
            S.studentDetails[payKey] = { mother: { name: 'S/D' }, father: { name: 'S/D' }, payments: [] };
        }
        if (!S.studentDetails[payKey].payments) {
            S.studentDetails[payKey].payments = [];
        }

        S.studentDetails[payKey].payments.push({
            type: 'ABONO', date: new Date().toLocaleDateString(), concept: conceptLabel,
            amount: parseFloat(amount), folio: folio, method: method, receiver: receiver, status: 'PAGADO'
        });

        S.boxBalances[receiver] += parseFloat(amount);
        S.financialHistory.push({
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
            box: receiver, concept: `PAGO ALUMNO: ${name} (${conceptLabel})`,
            type: 'ENTRY', amount: parseFloat(amount), folio: folio
        });

        EC.saveData();
        alert(`¡PAGO PROCESADO!\nAlumno: ${name}\nConcepto: ${conceptLabel}\nForma: ${method}\nRecibe: ${receiver}\nFolio: ${folio}`);
        resetPaymentForm();
    };

    // --- Módulo de Egresos / Gastos ---

    window.showExpenses = () => {
        EC.updateNav('nav-expenses');
        const D = EC.dom;
        D.dashboardHome.style.display = 'none';
        D.recentActivity.style.display = 'none';
        D.viewTitle.innerText = 'Gastos y Egresos';
        D.btnBack.style.display = 'none';
        D.groupFilter.style.display = 'none';

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

        if (S.boxBalances[box] < amount) {
            const confirmOverdraft = confirm(`La caja ${box} solo tiene $${S.boxBalances[box].toLocaleString()}. ¿Desea registrar el gasto de todos modos dejándola en negativo?`);
            if (!confirmOverdraft) return;
        }

        S.financialHistory.push({
            id: 'EXP-' + Date.now(), date: date, type: 'EXIT', concept: concept,
            receiver: receiver, amount: amount, box: box, timestamp: new Date().toISOString()
        });
        S.boxBalances[box] -= amount;

        EC.saveData();
        renderExpensesTable();
        document.getElementById('expense-form').reset();
        document.getElementById('expense-date').valueAsDate = new Date();
        alert("Gasto registrado y restado de la caja exitosamente.");
    };

    function renderExpensesTable() {
        const tBody = document.getElementById('expenses-table-body');
        if (!tBody) return;
        tBody.innerHTML = '';
        const expenses = S.financialHistory.filter(h => h.type === 'EXIT').sort((a, b) => new Date(b.date) - new Date(a.date));
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

    // --- Reportes Financieros ---

    window.showReports = () => {
        EC.updateNav('nav-reports');
        const D = EC.dom;
        D.dashboardHome.style.display = 'none';
        D.recentActivity.style.display = 'block';
        D.viewTitle.innerText = 'Informes Financieros';
        D.btnBack.style.display = 'none';
        D.groupFilter.style.display = 'none';

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
        for (let box in S.boxBalances) {
            const card = document.createElement('div');
            card.className = 'summary-card';
            card.style.padding = '15px';
            card.innerHTML = `
                <div class="card-title" style="font-size:0.9rem; margin-bottom:10px;">${box}</div>
                <div class="card-value" style="font-size:1.4rem; color:var(--primary)">$${S.boxBalances[box].toLocaleString()}</div>
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

        const reportTitle = document.querySelector('.expediente-section h4');
        if (reportTitle) {
            if (boxFilter === 'Todas') reportTitle.innerText = 'Reporte General de Movimientos';
            else if (boxFilter === 'SOLO_BANCOS') reportTitle.innerText = 'Reporte de Movimientos a Bancos (Banorte / MP)';
            else reportTitle.innerText = 'Reporte de Movimientos - ' + boxFilter;
        }

        let runningBalance = 0;

        const filteredTransactions = S.financialHistory.filter(t => {
            let matchBox = false;
            if (boxFilter === 'Todas') matchBox = true;
            else if (boxFilter === 'SOLO_BANCOS') matchBox = (t.box === 'Banorte' || t.box === 'Mercado Pago');
            else matchBox = (t.box === boxFilter);

            const matchStudent = !studentFilter || t.concept.toLowerCase().includes(studentFilter);
            const matchConcept = (conceptFilter === 'todos' || t.concept.toLowerCase().includes(conceptFilter));

            let matchDate = true;
            if (dateStart || dateEnd) {
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

        filteredTransactions.forEach((t) => {
            const realIdx = S.financialHistory.indexOf(t);
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

    window.cancelTransaction = (indexOrFolio) => {
        let index;
        if (typeof indexOrFolio === 'number') {
            index = indexOrFolio;
        } else {
            index = S.financialHistory.findIndex(t => t.folio === indexOrFolio);
        }
        const t = S.financialHistory[index];
        if (!t) return alert("No se encontró la transacción.");
        if (t.isCancelled) return alert("Esta operación ya fue cancelada.");

        if (S.currentUser && S.currentUser.role !== "ADMIN") {
            return alert("Acceso Denegado: Solo el Administrador general puede cancelar recibos y pagos.");
        }

        if (confirm(`¿Está seguro de CANCELAR este pago de $${t.amount.toLocaleString()} folio ${t.folio}? \nEsta acción: \r- Descontará el dinero de la Caja: ${t.box} \r- Marcará el folio como CANCELADO en el expediente del alumno.`)) {
            t.isCancelled = true;
            S.boxBalances[t.box] -= t.amount;

            for (let key in S.studentDetails) {
                if (S.studentDetails[key].payments) {
                    const payIdx = S.studentDetails[key].payments.findIndex(p => p.folio === t.folio);
                    if (payIdx !== -1) {
                        S.studentDetails[key].payments[payIdx].status = 'CANCELADO';
                        S.studentDetails[key].payments[payIdx].cancelDate = new Date().toLocaleString();
                    }
                }
            }

            EC.saveData();
            updateBoxReport();
            alert("Pago cancelado correctamente. Los saldos de caja se han actualizado.");
        }
    };

    // --- Transferencias entre cajas ---

    window.showTransferModal = () => { document.getElementById('transfer-modal').style.display = 'flex'; };
    window.closeTransferModal = () => { document.getElementById('transfer-modal').style.display = 'none'; };

    window.processTransfer = () => {
        const from = document.getElementById('transfer-from').value;
        const to = document.getElementById('transfer-to').value;
        const amount = parseFloat(document.getElementById('transfer-amount').value);

        if (from === to) { alert('La caja de origen y destino deben ser diferentes.'); return; }
        if (!amount || amount <= 0) { alert('Ingrese un importe válido.'); return; }
        if (S.boxBalances[from] < amount) { alert('Fondos insuficientes en la caja de origen.'); return; }

        S.boxBalances[from] -= amount;
        S.boxBalances[to] += amount;

        const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();

        S.financialHistory.push({
            date: dateStr, box: from, concept: `TRASPASO A CAJA: ${to}`,
            type: 'EXIT', amount: amount, folio: 'TRANSF'
        });
        S.financialHistory.push({
            date: dateStr, box: to, concept: `TRASPASO DESDE CAJA: ${from}`,
            type: 'ENTRY', amount: amount, folio: 'TRANSF'
        });

        EC.saveData();
        alert(`¡Traspaso Exitoso!\n$${amount} transferidos de ${from} a ${to}.`);
        closeTransferModal();
        updateBoxBalances();
        updateBoxReport();
    };

})(window.EduControl);
