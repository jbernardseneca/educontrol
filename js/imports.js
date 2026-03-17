// =====================================================================
// IMPORTS - Captura por lote, importación/exportación de datos
// =====================================================================

(function (EC) {

    const S = EC.state;

    // --- Exportar Reporte a Excel ---
    window.exportReportToExcel = () => {
        const table = document.getElementById('box-transactions-table');
        if (!table) { alert('No hay datos para exportar.'); return; }

        const boxFilter = document.getElementById('report-box-filter').value;
        const dateStart = document.getElementById('report-date-start').value;
        const dateEnd = document.getElementById('report-date-end').value;

        const rows = table.querySelectorAll('tbody tr');
        const exportData = [];
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 6) {
                exportData.push({
                    'Fecha': cells[0].textContent.trim(),
                    'Caja': cells[1].textContent.trim(),
                    'Concepto': cells[2].textContent.replace('[CANCELADO]', '').trim(),
                    'Entrada': cells[3].textContent.trim(),
                    'Salida': cells[4].textContent.trim(),
                    'Saldo': cells[5].textContent.trim()
                });
            }
        });

        if (exportData.length === 0) { alert('No hay movimientos para exportar con los filtros actuales.'); return; }

        const summaryData = [];
        for (let box in S.boxBalances) {
            summaryData.push({ 'Caja': box, 'Saldo Actual': '$' + S.boxBalances[box].toLocaleString() });
        }

        const wb = XLSX.utils.book_new();
        const ws1 = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Movimientos');
        const ws2 = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Saldos de Cajas');

        let fileName = 'Reporte_Financiero';
        if (boxFilter !== 'Todas') fileName += '_' + boxFilter.replace(/\s/g, '');
        if (dateStart) fileName += '_desde_' + dateStart;
        if (dateEnd) fileName += '_hasta_' + dateEnd;
        fileName += '_' + new Date().toISOString().split('T')[0] + '.xlsx';

        XLSX.writeFile(wb, fileName);
        alert('Reporte exportado exitosamente.');
    };

    // --- Exportar Lista de Alumnos a Excel ---
    window.exportStudentsToExcel = () => {
        if (S.allStudents.length === 0) { alert('No hay alumnos para exportar.'); return; }

        const data = S.allStudents.map(s => {
            const d = EC.getStudentDetails(s) || {};
            const m = d.mother || {};
            const f = d.father || {};
            return {
                'Nombre': s.name, 'Nivel': s.level, 'Grado': s.grade, 'Estado': s.status,
                'Teléfono Tutor': s.tutorPhone || '',
                'Madre': m.name || '', 'Tel. Madre': m.phone || '',
                'Padre': f.name || '', 'Tel. Padre': f.phone || ''
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');
        XLSX.writeFile(wb, 'Lista_Alumnos_' + new Date().toISOString().split('T')[0] + '.xlsx');
    };

    // --- Captura por Lote ---

    window.showBatchCapture = () => {
        EC.dom.dashboardHome.style.display = 'none';
        document.getElementById('main-table-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('batch-capture-container').style.display = 'block';
        EC.dom.viewTitle.innerText = 'Captura Masiva de Alumnos';
        EC.dom.groupFilter.style.display = 'none';

        const batchBody = document.getElementById('batch-table-body');
        batchBody.innerHTML = '';
        addBatchRow(); addBatchRow(); addBatchRow();
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
        const templateData = [{
            "Grado": "4º A", "Nivel de inglés": "A2", "No. de télefono de tutor": "5551234567",
            "Nombre del Alumno": "Juan", "2DO NOMBRE": "Pablo", "1er Apellido": "Pérez", "2o Apellido": "García",
            "Pago Inscripción": 3500, "Pago Gastos Apoyo": 1200, "Pago Seguro Escolar": 850
        }];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
        XLSX.writeFile(workbook, "Formato_Importacion_Alumnos_Con_Pagos.xlsx");
    };

    window.importFromGoogleSheets = async () => {
        const url = prompt("Pega aquí el enlace de tu Google Sheet (Asegúrate de que esté compartido como 'Cualquier persona con el enlace puede leer'):");
        if (!url) return;

        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) { alert("El enlace de Google Sheets no parece ser válido."); return; }

        const sheetId = match[1];
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

        try {
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error("No se pudo acceder a la hoja. Verifica que sea pública.");
            const csvText = await response.text();
            const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim()));
            const dataRows = rows.slice(1);

            if (dataRows.length === 0) { alert("La hoja de Google parece estar vacía."); return; }

            if (confirm(`Se han detectado ${dataRows.length} filas en Google Sheets. ¿Deseas cargarlas?`)) {
                const batchBody = document.getElementById('batch-table-body');
                batchBody.innerHTML = '';
                dataRows.forEach(row => {
                    if (row[3]) {
                        window.addBatchRow({
                            grade: row[0], english: row[1], phone: row[2], name: row[3],
                            name2: row[4], lastName1: row[5], lastName2: row[6],
                            pay_ins: row[7] || '', pay_support: row[8] || '', pay_insurance: row[9] || ''
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
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) { alert('El archivo Excel está vacío.'); return; }

                if (confirm(`Se han encontrado ${json.length} registros. ¿Deseas cargarlos en la tabla?`)) {
                    const batchBody = document.getElementById('batch-table-body');
                    batchBody.innerHTML = '';
                    json.forEach(row => {
                        const name = row['Nombre del Alumno'] || row.nombre || '';
                        if (name) {
                            window.addBatchRow({
                                grade: row.Grado || row.grado || '',
                                english: row['Nivel de inglés'] || row.ingles || '',
                                phone: row['No. de télefono de tutor'] || row.telefono || '',
                                name: name,
                                name2: row['2DO NOMBRE'] || row.nombre2 || '',
                                lastName1: row['1er Apellido'] || row.apellido1 || '',
                                lastName2: row['2o Apellido'] || row.apellido2 || '',
                                pay_ins: row['Pago Inscripción'] || row.inscripcion || '',
                                pay_support: row['Pago Gastos Apoyo'] || row['gastos apoyo'] || '',
                                pay_insurance: row['Pago Seguro Escolar'] || row.seguro || ''
                            });
                        }
                    });
                }
            } catch (error) {
                console.error('Error procesando Excel:', error);
                alert('Hubo un error al leer el archivo Excel. Asegúrate de que sea un formato válido.');
            }
            event.target.value = '';
        };
        reader.readAsArrayBuffer(file);
    };

    // --- Importación CSV (Alumnos) ---
    window.importFromCSV = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const separator = text.includes('\t') ? '\t' : ',';
                const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                if (lines.length < 2) { alert('El archivo CSV está vacío o no tiene datos.'); return; }

                const headers = lines[0].split(separator).map(h => h.replace(/^"(.*)"$/, '$1').trim().toLowerCase());
                const dataRows = lines.slice(1);

                if (confirm(`Se detectaron ${dataRows.length} filas. ¿Cargarlas en la tabla?`)) {
                    const batchBody = document.getElementById('batch-table-body');
                    batchBody.innerHTML = '';
                    dataRows.forEach(line => {
                        const cols = line.split(separator).map(c => c.replace(/^"(.*)"$/, '$1').trim());
                        const getCol = (...keys) => {
                            const idx = headers.findIndex(h => keys.some(k => h.includes(k)));
                            return idx >= 0 ? cols[idx] : '';
                        };
                        const name = getCol('nombre', 'name', 'alumno');
                        if (name) {
                            window.addBatchRow({
                                grade: getCol('grado', 'grade', 'grupo'),
                                english: getCol('inglés', 'ingles', 'english', 'nivel'),
                                phone: getCol('teléfono', 'telefono', 'phone', 'tel'),
                                name: name,
                                name2: getCol('2do nombre', 'segundo nombre', 'middle'),
                                lastName1: getCol('1er apellido', 'apellido1', 'primer apellido', 'apellido paterno'),
                                lastName2: getCol('2o apellido', 'apellido2', 'segundo apellido', 'apellido materno'),
                                pay_ins: getCol('inscripción', 'inscripcion', 'pago inscripción'),
                                pay_support: getCol('apoyo', 'gastos apoyo', 'gastos'),
                                pay_insurance: getCol('seguro', 'seguro escolar')
                            });
                        }
                    });
                }
            } catch (error) {
                console.error('Error procesando CSV:', error);
                alert('Error al leer el archivo CSV.');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    // --- Importación SQL (Alumnos) ---
    window.importFromSQL = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const insertRegex = /INSERT\s+INTO\s+\S+\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi;
                const rows = [];
                let match;

                while ((match = insertRegex.exec(text)) !== null) {
                    const columns = match[1].split(',').map(c => c.replace(/[`"'\[\]]/g, '').trim().toLowerCase());
                    const values = match[2].split(',').map(v => v.replace(/^['"]|['"]$/g, '').trim());
                    const row = {};
                    columns.forEach((col, i) => { row[col] = values[i] || ''; });
                    rows.push(row);
                }

                const multiRegex = /INSERT\s+INTO\s+\S+\s*\(([^)]+)\)\s*VALUES\s*((?:\([^)]+\)\s*,?\s*)+)/gi;
                while ((match = multiRegex.exec(text)) !== null) {
                    const columns = match[1].split(',').map(c => c.replace(/[`"'\[\]]/g, '').trim().toLowerCase());
                    const valuesBlock = match[2];
                    const valueGroups = valuesBlock.match(/\(([^)]+)\)/g);
                    if (valueGroups) {
                        valueGroups.forEach(group => {
                            const values = group.replace(/^\(|\)$/g, '').split(',').map(v => v.replace(/^['"]|['"]$/g, '').trim());
                            const row = {};
                            columns.forEach((col, i) => { row[col] = values[i] || ''; });
                            const isDup = rows.some(r => JSON.stringify(r) === JSON.stringify(row));
                            if (!isDup) rows.push(row);
                        });
                    }
                }

                if (rows.length === 0) {
                    alert('No se encontraron sentencias INSERT válidas en el archivo SQL.\n\nFormato esperado:\nINSERT INTO alumnos (nombre, grado, telefono) VALUES (\'Juan\', \'4A\', \'555...\');');
                    return;
                }

                if (confirm(`Se detectaron ${rows.length} registros SQL. ¿Cargarlos en la tabla?`)) {
                    const batchBody = document.getElementById('batch-table-body');
                    batchBody.innerHTML = '';
                    rows.forEach(row => {
                        const getVal = (...keys) => {
                            const key = Object.keys(row).find(k => keys.some(search => k.includes(search)));
                            return key ? row[key] : '';
                        };
                        const name = getVal('nombre', 'name', 'alumno', 'primer_nombre');
                        if (name) {
                            window.addBatchRow({
                                grade: getVal('grado', 'grade', 'grupo'),
                                english: getVal('ingles', 'english', 'nivel_ingles'),
                                phone: getVal('telefono', 'phone', 'tel', 'celular'),
                                name: name,
                                name2: getVal('segundo_nombre', 'nombre2', 'middle'),
                                lastName1: getVal('apellido_paterno', 'apellido1', 'primer_apellido'),
                                lastName2: getVal('apellido_materno', 'apellido2', 'segundo_apellido'),
                                pay_ins: getVal('inscripcion', 'pago_inscripcion'),
                                pay_support: getVal('apoyo', 'gastos_apoyo'),
                                pay_insurance: getVal('seguro', 'seguro_escolar')
                            });
                        }
                    });
                }
            } catch (error) {
                console.error('Error procesando SQL:', error);
                alert('Error al leer el archivo SQL.');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    // --- Importación CSV/SQL (Servicios/Pagos) ---
    window.importServiceFromCSV = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const separator = text.includes('\t') ? '\t' : ',';
                const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                if (lines.length < 2) { alert('El archivo CSV está vacío.'); return; }

                const headers = lines[0].split(separator).map(h => h.replace(/^"(.*)"$/, '$1').trim().toLowerCase());
                const dataRows = lines.slice(1);

                if (confirm(`Se detectaron ${dataRows.length} pagos. ¿Cargarlos?`)) {
                    const body = document.getElementById('services-batch-body');
                    body.innerHTML = '';
                    dataRows.forEach(line => {
                        const cols = line.split(separator).map(c => c.replace(/^"(.*)"$/, '$1').trim());
                        const getCol = (...keys) => {
                            const idx = headers.findIndex(h => keys.some(k => h.includes(k)));
                            return idx >= 0 ? cols[idx] : '';
                        };
                        const student = getCol('alumno', 'nombre', 'student');
                        if (student) {
                            window.addServiceBatchRow({
                                student, quote: getCol('cotizado', 'normal', 'inscripcion normal') || '',
                                discount: getCol('descuento', 'promocion') || 0,
                                amount: getCol('pagado', 'monto', 'amount') || '',
                                date: getCol('fecha', 'date') || '',
                                folio: getCol('folio') || '',
                                method: getCol('forma', 'metodo', 'method') || 'Efectivo',
                                receiver: getCol('recibe', 'caja', 'receiver') || 'Recepción'
                            });
                        }
                    });
                }
            } catch (error) {
                console.error('Error CSV servicios:', error);
                alert('Error al leer el archivo CSV.');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    };

    window.importServiceFromSQL = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const insertRegex = /INSERT\s+INTO\s+\S+\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi;
                const rows = [];
                let match;
                while ((match = insertRegex.exec(text)) !== null) {
                    const columns = match[1].split(',').map(c => c.replace(/[`"'\[\]]/g, '').trim().toLowerCase());
                    const values = match[2].split(',').map(v => v.replace(/^['"]|['"]$/g, '').trim());
                    const row = {};
                    columns.forEach((col, i) => { row[col] = values[i] || ''; });
                    rows.push(row);
                }

                if (rows.length === 0) { alert('No se encontraron INSERT válidos en el archivo SQL.'); return; }

                if (confirm(`Se detectaron ${rows.length} registros SQL. ¿Cargarlos?`)) {
                    const body = document.getElementById('services-batch-body');
                    body.innerHTML = '';
                    rows.forEach(row => {
                        const getVal = (...keys) => {
                            const key = Object.keys(row).find(k => keys.some(s => k.includes(s)));
                            return key ? row[key] : '';
                        };
                        const student = getVal('alumno', 'nombre', 'student');
                        if (student) {
                            window.addServiceBatchRow({
                                student, quote: getVal('cotizado', 'normal', 'inscripcion') || '',
                                discount: getVal('descuento', 'promocion') || 0,
                                amount: getVal('pagado', 'monto', 'amount') || '',
                                date: getVal('fecha', 'date') || '',
                                folio: getVal('folio') || '',
                                method: getVal('forma', 'metodo') || 'Efectivo',
                                receiver: getVal('recibe', 'caja') || 'Recepción'
                            });
                        }
                    });
                }
            } catch (error) {
                console.error('Error SQL servicios:', error);
                alert('Error al leer el archivo SQL.');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
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
        let updatedCount = 0;

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
                const existing = S.allStudents.find(s => s.name.toLowerCase().trim() === fullName.toLowerCase().trim());

                if (existing) {
                    if (grade) existing.grade = grade;
                    if (english) existing.english = english;
                    if (phone) existing.tutorPhone = phone;

                    const existKey = EC.getStudentKey(existing);
                    if (!S.studentDetails[existKey]) {
                        // Check if data exists under name (legacy) before creating empty entry
                        const existingData = EC.getStudentDetails(existing);
                        S.studentDetails[existKey] = existingData || { mother: { name: 'S/D', phone: phone }, father: { name: 'S/D', phone: phone }, payments: [] };
                        // Clean up legacy name key if migrated
                        if (existing.id && S.studentDetails[existing.name]) {
                            delete S.studentDetails[existing.name];
                        }
                    }
                    if (phone && S.studentDetails[existKey].mother) {
                        S.studentDetails[existKey].mother.phone = phone;
                    }
                    updatedCount++;
                } else {
                    const newId = EC.generateStudentId();
                    S.allStudents.push({
                        id: newId, name: fullName, level: 'Por Definir', grade: grade,
                        english: english, tutorPhone: phone, status: 'Activo'
                    });
                    S.studentDetails[newId] = {
                        initialPayments: { inscripcion: payIns || 0, gastosApoyo: paySupport || 0, seguro: payInsurance || 0 },
                        mother: { name: 'S/D', phone: phone }, father: { name: 'S/D', phone: phone }, payments: []
                    };
                    newCount++;
                }
            }
        });

        if (newCount > 0 || updatedCount > 0) {
            EC.saveData();
            let msg = '';
            if (newCount > 0) msg += `${newCount} alumnos nuevos registrados. `;
            if (updatedCount > 0) msg += `${updatedCount} alumnos existentes actualizados.`;
            alert(`¡Éxito! ${msg}`);
            showStudents();
        } else {
            alert('No se ingresó ningún nombre de alumno.');
        }
    };

    // --- Captura de Servicios por Lote ---

    window.showServicesBatch = () => {
        EC.updateNav('nav-services');
        const D = EC.dom;
        D.dashboardHome.style.display = 'none';
        D.recentActivity.style.display = 'block';
        D.viewTitle.innerText = 'Cobros Masivos / Servicios';

        document.getElementById('main-table-container').style.display = 'none';
        document.getElementById('batch-capture-container').style.display = 'none';
        document.getElementById('payments-capture-container').style.display = 'none';
        document.getElementById('reports-container').style.display = 'none';
        document.getElementById('services-batch-container').style.display = 'block';

        const body = document.getElementById('services-batch-body');
        body.innerHTML = '';

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
                "alumno": "Juan Pérez", "concepto": "Inscripción", "inscripcion normal": 4500,
                "descuento por promocion": 1000, "inscripcion pagada": 3500,
                "fecha de pago": "2025-03-05", "folio": "A-123", "caja": "Recepción"
            }];
        } else {
            templateData = [{
                "Alumno": "Juan Pérez", "Cotizado": 4500, "Descuento": 1000, "Monto Pagado": 3500,
                "Fecha Pago": "2025-03-05", "Folio": "A-123", "Forma Pago": "Efectivo", "Recibe": "Recepción"
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
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) { alert('El archivo Excel está vacío.'); return; }

                if (confirm(`Se han encontrado ${json.length} pagos. ¿Deseas cargarlos en la tabla?`)) {
                    const body = document.getElementById('services-batch-body');
                    body.innerHTML = '';
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

                    json.forEach((row) => {
                        let student = '', folio = '', quote = '', discount = 0, amount = '', dateInput = '', method = 'Efectivo', receiver = 'Recepción';

                        if (globalConcept === 'Inscripción') {
                            student = getVal(row, 'alumno');
                            folio = getVal(row, 'folio');
                            quote = parseExcelNumber(getVal(row, 'inscripcion normal', 'inscripción normal', 'cotizado', 'inscripcion', 'normal'));
                            let rawDiscount = parseExcelNumber(getVal(row, 'descuento por promocion', 'descuento por promoción', 'descuento', 'promocion', 'desceunto'));
                            if (rawDiscount !== '' && quote !== '') {
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

                const svcStudent = EC.findStudentByName(student);
                const svcKey = svcStudent ? EC.getStudentKey(svcStudent) : student;

                if (!S.studentDetails[svcKey]) S.studentDetails[svcKey] = { mother: { name: 'S/D' }, father: { name: 'S/D' }, payments: [] };
                if (!S.studentDetails[svcKey].payments) S.studentDetails[svcKey].payments = [];

                if (quote > 0) {
                    S.studentDetails[svcKey].payments.push({
                        type: 'CARGO', date: formattedDate, concept: finalConcept,
                        amount: quote, discount: discount, netAmount: quote - discount, folio: 'SRV-LOTE'
                    });
                }

                if (paid > 0 || quote === 0) {
                    S.studentDetails[svcKey].payments.push({
                        type: 'ABONO', date: formattedDate,
                        concept: quote > 0 ? 'Pago ' + finalConcept : finalConcept,
                        quote: quote, discount: discount, paid: paid, balance: balance,
                        amount: paid, folio: folio, method: method, receiver: receiver,
                        status: balance === 0 ? 'PAGADO' : 'CON SALDO'
                    });
                }

                if (paid > 0) {
                    S.boxBalances[receiver] += paid;
                    S.financialHistory.push({
                        date: formattedDate + ' 12:00:00', box: receiver,
                        concept: `PAGO LOTE: ${student} (${finalConcept})`,
                        type: 'ENTRY', amount: paid, folio: folio
                    });
                }
                processed++;
            }
        });

        if (processed > 0) {
            EC.saveData();
            alert(`¡Éxito! Se procesaron ${processed} cobros correctamente.`);
            showStudents();
        } else {
            alert('No se detectaron cobros válidos para procesar.');
        }
    };

})(window.EduControl);
