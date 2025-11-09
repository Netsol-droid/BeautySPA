const state = {
    courses: [],
    students: [],
    teachers: [],
    courseMessages: {}, // { courseId: [ {id, fileName, target, timestamp, fromTeacherId} ] }
    courseGrades: {},    // { courseId: [ {id, studentId|'all', grade, comment, timestamp, fromTeacherId} ] }
    user: { name: 'Usuario', email: '', role: 'admin' } // <- new persisted user profile
};

let editingCourseId = null;
let editingStudentId = null;
let editingTeacherId = null;

// add chart containers
let charts = {
    progressChart: null,
    performanceChart: null
};

// NEW: Authentication and role enforcement
const AUTH = {
    adminCredentials: { email: 'enzemates97@gmail.com', password: 'Enzema2025' },
    current: null // {email, role, name}
};

function persistAuth() {
    try { localStorage.setItem('av_auth', JSON.stringify(AUTH.current)); } catch(e){}
}
function loadAuth() {
    try { const raw = localStorage.getItem('av_auth'); if (raw) AUTH.current = JSON.parse(raw); } catch(e){}
}

// Persistence helpers: save/load full app state (including AUTH.current) to localStorage
function persistAppState() {
    try {
        const payload = {
            state,
            auth: AUTH.current
        };
        localStorage.setItem('av_app_state', JSON.stringify(payload));
    } catch (e) { console.warn('No se pudo persistir el estado', e); }
}
function loadAppState() {
    try {
        const raw = localStorage.getItem('av_app_state');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.state) {
            // shallow merge to keep references expected by app
            Object.assign(state, parsed.state);
            // ensure maps exist
            state.courseMessages = state.courseMessages || {};
            state.courseGrades = state.courseGrades || {};
        }
        if (parsed && parsed.auth) {
            AUTH.current = parsed.auth;
            persistAuth();
        }
    } catch (e) { console.warn('No se pudo cargar el estado persistido', e); }
}

// login handler: supports admin fixed credentials, or "register" creating guest/student/teacher accounts (stored locally)
function attemptLogin(email, password) {
    if (!email) return { ok:false, msg:'Email requerido' };
    // admin fixed login
    if (email === AUTH.adminCredentials.email && password === AUTH.adminCredentials.password) {
        AUTH.current = { email, role: 'admin', name: 'Administrador' };
        persistAuth();
        return { ok:true };
    }
    // check stored users (simple localStorage users list)
    try {
        const raw = localStorage.getItem('av_users') || '[]';
        const users = JSON.parse(raw);
        const u = users.find(x => x.email === email && x.password === password);
        if (u) { AUTH.current = { email: u.email, role: u.role, name: u.name || u.email }; persistAuth(); return { ok:true }; }
    } catch(e){}
    return { ok:false, msg:'Credenciales incorrectas' };
}

function registerLocalUser(email, password, role, name) {
    // Prevent creating arbitrary admin accounts: only allow registering admin when credentials exactly match the adminCredentials
    if (role === 'admin') {
        if (email !== AUTH.adminCredentials.email || password !== AUTH.adminCredentials.password) {
            return { ok:false, msg: 'Sólo se puede registrar administrador con credenciales administrativas válidas.' };
        }
        // If admin credentials are exact, just accept but do not store password redundantly; admin is handled by AUTH.adminCredentials
        return { ok:true };
    }
    const u = { email, password, role, name: name || email };
    try {
        const raw = localStorage.getItem('av_users') || '[]';
        const users = JSON.parse(raw);
        if (users.find(x => x.email === email)) return { ok:false, msg:'Usuario ya existe' };
        users.push(u);
        localStorage.setItem('av_users', JSON.stringify(users));
        // persist entire app state (users are part of the environment)
        persistAppState();
        return { ok:true };
    } catch(e){ return { ok:false, msg:'No se pudo registrar' }; }
}

function requireAuthUI() {
    // if no auth present, show login modal and hide app sections/tools until auth
    loadAuth();
    if (!AUTH.current) {
        const lm = document.getElementById('loginModal');
        const bs = new bootstrap.Modal(lm, { backdrop:'static', keyboard:false });
        bs.show();
        // disable top-level nav and content until authenticated
        document.querySelectorAll('body > *:not(#loginModal)').forEach(el => { if (!el.closest('#loginModal')) el.style.filter = 'blur(1px)'; });
    } else {
        applyPermissions();
    }
}

function applyPermissions() {
    // enable/disable UI based on AUTH.current.role
    const role = AUTH.current?.role || 'guest';
    // show user in nav
    state.user.name = AUTH.current?.name || AUTH.current?.email || 'Usuario';
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = state.user.name;
    // admin: full access, teacher: limited, student: minimal, guest: view-only
    const adminOnlySelectors = ['#teacherModal','#saveTeacher','#saveCourse','#saveStudent','#saveProfile','#saveSettings','#teacherCard'];
    adminOnlySelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            if (!el) return;
            el.style.display = (role === 'admin') ? '' : 'none';
        });
    });
    // hide create buttons for non-teacher/non-admin
    if (!['teacher','admin'].includes(role)) {
        document.querySelectorAll('[data-bs-target="#courseModal"],[data-bs-target="#teacherModal"],[data-bs-target="#studentModal"]').forEach(b => b.classList.add('d-none'));
    } else {
        document.querySelectorAll('[data-bs-target="#courseModal"],[data-bs-target="#teacherModal"],[data-bs-target="#studentModal"]').forEach(b => b.classList.remove('d-none'));
    }
    // students cannot access teachers module
    if (role === 'student' || role === 'guest') {
        document.getElementById('teachersLink')?.classList.add('d-none');
    } else {
        document.getElementById('teachersLink')?.classList.remove('d-none');
    }
    // analytics only for admin
    if (role !== 'admin') {
        document.getElementById('analyticsLink')?.classList.add('d-none');
    } else {
        document.getElementById('analyticsLink')?.classList.remove('d-none');
    }
}

// wire login modal buttons on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // login flow
    const loginBtn = document.getElementById('loginBtn');
    const openRegisterBtn = document.getElementById('openRegisterBtn');
    const loginError = document.getElementById('loginError');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const res = attemptLogin(email, password);
            if (!res.ok) {
                if (loginError) { loginError.textContent = res.msg || 'Credenciales incorrectas.'; loginError.classList.remove('d-none'); }
                return;
            }
            // close modal and restore UI
            const lm = document.getElementById('loginModal');
            const bs = bootstrap.Modal.getInstance(lm);
            if (bs) bs.hide();
            document.querySelectorAll('body > *:not(#loginModal)').forEach(el => { if (!el.closest('#loginModal')) el.style.filter = ''; });
            applyPermissions();
        });
    }
    if (openRegisterBtn) {
        openRegisterBtn.addEventListener('click', () => {
            // quick register: uses selected role, simple password (must fill in fields)
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const role = document.getElementById('registerRole').value;
            if (!email || !password) { alert('Rellena email y contraseña para registrarte.'); return; }
            const r = registerLocalUser(email, password, role, email.split('@')[0]);
            if (!r.ok) { alert(r.msg || 'Registro fallido'); return; }
            alert('Registrado correctamente. Ya puedes iniciar sesión.');
        });
    }
    // logout binding
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            AUTH.current = null;
            try { localStorage.removeItem('av_auth'); } catch(e){}
            location.reload();
        });
    }

    // ensure auth is required on start
    requireAuthUI();

    // Load persisted app state early during initialization
    loadAppState();
});

// --- Courses module ---
function renderCoursesList() {
    const container = document.getElementById('coursesList');
    const noMsg = document.getElementById('noCoursesMessage');
    if (!container) return;
    if (state.courses.length === 0) {
        if (noMsg) noMsg.classList.remove('d-none');
        container.innerHTML = '';
        return;
    }
    if (noMsg) noMsg.classList.add('d-none');
    container.innerHTML = state.courses.slice().reverse().map(c => {
        const progress = c.progress || 0;
        return `<div class="col-md-6 mb-3">
            <div class="card course-card p-3" data-id="${c.id}">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="mb-1">${c.name}</h6>
                        <small class="text-muted">${c.category || ''} · ${c.students?.length || 0} estudiantes</small>
                    </div>
                    <div class="text-end">
                        <div class="mb-2"><span class="badge bg-primary">${progress}%</span></div>
                        <div>
                            <button class="btn btn-sm btn-outline-secondary me-1" data-id="${c.id}" onclick="openCourseEdit(event)">Editar</button>
                            <button class="btn btn-sm btn-outline-danger" data-id="${c.id}" onclick="deleteCourse(event)">Eliminar</button>
                        </div>
                    </div>
                </div>
                ${c.description ? `<p class="mt-2 mb-0 small text-muted">${c.description}</p>` : ''}
            </div>
        </div>`;
    }).join('');
}

function renderCoursesTable() {
    const tbody = document.getElementById('coursesTableBody');
    if (!tbody) return;
    tbody.innerHTML = state.courses.map(c => {
        const studentsCount = c.students ? c.students.length : 0;
        const progress = c.progress || 0;
        const status = (() => {
            if (c.startDate && c.endDate) {
                const now = new Date().toISOString().slice(0,10);
                if (now < c.startDate) return 'Pendiente';
                if (now > c.endDate) return 'Finalizado';
                return 'En Curso';
            }
            return 'Activo';
        })();
        return `<tr>
            <td>${c.name}</td>
            <td>${status}</td>
            <td>
                <div class="progress" style="height:8px">
                    <div class="progress-bar" role="progressbar" style="width:${progress}%;" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </td>
            <td>${studentsCount}</td>
            <td>
                <button class="btn btn-sm btn-secondary me-1" data-id="${c.id}" onclick="openCourseEdit(event)">Editar</button>
                <button class="btn btn-sm btn-danger" data-id="${c.id}" onclick="deleteCourse(event)">Eliminar</button>
            </td>
        </tr>`;
    }).join('');
}

function saveCourse() {
    const name = document.getElementById('courseName').value.trim();
    if (!name) return;
    const category = document.getElementById('courseCategory').value;
    const description = document.getElementById('courseDescription').value.trim();
    const startDate = document.getElementById('startDate').value || null;
    const endDate = document.getElementById('endDate').value || null;

    if (editingCourseId) {
        const course = state.courses.find(c => c.id === editingCourseId);
        if (course) {
            course.name = name;
            course.category = category;
            course.description = description;
            course.startDate = startDate;
            course.endDate = endDate;
        }
        editingCourseId = null;
    } else {
        const course = {
            id: 'c-' + Date.now(),
            name,
            category,
            description,
            startDate,
            endDate,
            students: [],
            progress: 0
        };
        state.courses.push(course);
    }

    renderCoursesList();
    renderCoursesTable();
    populateCourseOptions();
    updateStats();
    // persist after changes
    persistAppState();
    // close modal & reset form
    const modalEl = document.getElementById('courseModal');
    if (modalEl) {
        const bs = bootstrap.Modal.getInstance(modalEl);
        if (bs) bs.hide();
    }
    document.getElementById('courseForm').reset();
    // restore modal title/button text
    const title = document.querySelector('#courseModal .modal-title');
    const saveBtn = document.getElementById('saveCourse');
    if (title) title.textContent = 'Nuevo Curso';
    if (saveBtn) saveBtn.textContent = 'Crear Curso';
}

function openCourseEdit(e) {
    const id = e.currentTarget.getAttribute('data-id');
    const course = state.courses.find(c => c.id === id);
    if (!course) return;
    editingCourseId = id;
    document.getElementById('courseName').value = course.name || '';
    document.getElementById('courseCategory').value = course.category || '';
    document.getElementById('courseDescription').value = course.description || '';
    document.getElementById('startDate').value = course.startDate || '';
    document.getElementById('endDate').value = course.endDate || '';
    const title = document.querySelector('#courseModal .modal-title');
    const saveBtn = document.getElementById('saveCourse');
    if (title) title.textContent = 'Editar Curso';
    if (saveBtn) saveBtn.textContent = 'Actualizar Curso';
    const modalEl = document.getElementById('courseModal');
    const bs = new bootstrap.Modal(modalEl);
    bs.show();
}

function deleteCourse(e) {
    const id = e.currentTarget.getAttribute('data-id');
    // Remove course from students assignments
    state.students.forEach(s => {
        if (s.course === id) s.course = '';
    });
    // Remove from teachers' assigned courses
    state.teachers.forEach(t => {
        t.courses = (t.courses || []).filter(cid => cid !== id);
    });
    state.courses = state.courses.filter(c => c.id !== id);
    renderCoursesList();
    renderCoursesTable();
    renderStudentsTable();
    renderTeachersTable();
    populateCourseOptions();
    populateTeacherOptions();
    updateStats();
    // persist after changes
    persistAppState();
}

// --- Students module ---
function renderStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    tbody.innerHTML = state.students.map(s => {
        const courseName = state.courses.find(c => c.id === s.course)?.name || '—';
        const progress = s.progress || 0;
        return `<tr>
            <td>${s.name}</td>
            <td>${s.email}</td>
            <td>${courseName}</td>
            <td>
                <div class="progress" style="height:8px">
                    <div class="progress-bar bg-success" role="progressbar" style="width:${progress}%;" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-secondary me-1" data-id="${s.id}" onclick="openStudentEdit(event)">Editar</button>
                <button class="btn btn-sm btn-danger" data-id="${s.id}" onclick="deleteStudent(event)">Eliminar</button>
            </td>
        </tr>`;
    }).join('');
}

function saveStudent() {
    const name = document.getElementById('studentName').value.trim();
    const email = document.getElementById('studentEmail').value.trim();
    const course = document.getElementById('studentCourse').value || '';
    const progress = Number(document.getElementById('studentProgress').value) || 0;
    if (!name || !email) return;

    if (editingStudentId) {
        const student = state.students.find(s => s.id === editingStudentId);
        if (!student) return;
        // remove previous course assignment if changed
        if (student.course && student.course !== course) {
            const prevCourse = state.courses.find(cc => cc.id === student.course);
            if (prevCourse) prevCourse.students = (prevCourse.students || []).filter(sid => sid !== student.id);
        }
        student.name = name;
        student.email = email;
        student.course = course;
        student.progress = progress;
        editingStudentId = null;
    } else {
        const student = { id: 's-' + Date.now(), name, email, course, progress };
        state.students.push(student);
        // add student to course record
        if (course) {
            const c = state.courses.find(cc => cc.id === course);
            if (c) {
                c.students = c.students || [];
                if (!c.students.includes(student.id)) c.students.push(student.id);
                const vals = state.students.filter(st => st.course === c.id).map(st => st.progress || 0);
                c.progress = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
            }
        }
    }

    // update course progress recalculation for edited or new student
    state.courses.forEach(c => {
        const vals = state.students.filter(st => st.course === c.id).map(st => st.progress || 0);
        c.progress = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
    });

    renderStudentsTable();
    renderCoursesList();
    renderCoursesTable();
    populateTeacherOptions();
    updateStats();
    // persist after changes
    persistAppState();
    const modalEl = document.getElementById('studentModal');
    if (modalEl) {
        const bs = bootstrap.Modal.getInstance(modalEl);
        if (bs) bs.hide();
    }
    document.getElementById('studentForm').reset();
    const title = document.querySelector('#studentModal .modal-title');
    const saveBtn = document.getElementById('saveStudent');
    if (title) title.textContent = 'Nuevo Estudiante';
    if (saveBtn) saveBtn.textContent = 'Guardar Estudiante';
}

function openStudentEdit(e) {
    const id = e.currentTarget.getAttribute('data-id');
    const student = state.students.find(s => s.id === id);
    if (!student) return;
    editingStudentId = id;
    document.getElementById('studentName').value = student.name || '';
    document.getElementById('studentEmail').value = student.email || '';
    document.getElementById('studentCourse').value = student.course || '';
    document.getElementById('studentProgress').value = student.progress || 0;
    const title = document.querySelector('#studentModal .modal-title');
    const saveBtn = document.getElementById('saveStudent');
    if (title) title.textContent = 'Editar Estudiante';
    if (saveBtn) saveBtn.textContent = 'Actualizar Estudiante';
    const modalEl = document.getElementById('studentModal');
    const bs = new bootstrap.Modal(modalEl);
    bs.show();
}

function deleteStudent(e) {
    const id = e.currentTarget.getAttribute('data-id');
    // remove from teachers
    state.teachers.forEach(t => {
        t.students = (t.students || []).filter(sid => sid !== id);
    });
    // remove from courses
    state.courses.forEach(c => {
        c.students = (c.students || []).filter(sid => sid !== id);
        // recalc progress
        const vals = state.students.filter(st => st.course === c.id && st.id !== id).map(st => st.progress || 0);
        c.progress = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
    });
    state.students = state.students.filter(s => s.id !== id);
    renderStudentsTable();
    renderCoursesList();
    renderCoursesTable();
    renderTeachersTable();
    populateTeacherOptions();
    updateStats();
    // persist after changes
    persistAppState();
}

// --- Profesor module ---
function populateTeacherOptions() {
    const courseSelect = document.getElementById('teacherCourses');
    const studentSelect = document.getElementById('teacherStudents');
    if (courseSelect) {
        courseSelect.innerHTML = (state.courses.map(c => `<option value="${c.id}">${c.name}</option>`)).join('') || '';
    }
    if (studentSelect) {
        studentSelect.innerHTML = (state.students.map(s => `<option value="${s.id}">${s.name}</option>`)).join('') || '';
    }
}

function renderTeachersTable() {
    const tbody = document.getElementById('teachersTableBody');
    if (!tbody) return;
    tbody.innerHTML = state.teachers.map(t => {
        const courseNames = (t.courses||[]).map(cid => (state.courses.find(c=>c.id===cid)||{}).name || '—').join(', ');
        const studentNames = (t.students||[]).map(sid => (state.students.find(s=>s.id===sid)||{}).name || '—').join(', ');
        return `<tr>
            <td>${t.name}</td>
            <td>${t.email}</td>
            <td>${courseNames}</td>
            <td>${studentNames}</td>
            <td>
                <button class="btn btn-sm btn-secondary me-1" data-id="${t.id}" onclick="openTeacherEdit(event)">Editar</button>
                <button class="btn btn-sm btn-danger" data-id="${t.id}" onclick="deleteTeacher(event)">Eliminar</button>
            </td>
        </tr>`;
    }).join('');
}

function saveTeacher() {
    const name = document.getElementById('teacherName').value.trim();
    const email = document.getElementById('teacherEmail').value.trim();
    const courseOptions = Array.from(document.getElementById('teacherCourses').selectedOptions).map(o => o.value);
    const studentOptions = Array.from(document.getElementById('teacherStudents').selectedOptions).map(o => o.value);
    if (!name || !email) return;

    if (editingTeacherId) {
        const teacher = state.teachers.find(t => t.id === editingTeacherId);
        if (!teacher) return;
        // unlink from previous courses/students
        (teacher.courses || []).forEach(cid => {
            const c = state.courses.find(cc => cc.id === cid);
            if (c) c.teachers = (c.teachers||[]).filter(tid => tid !== teacher.id);
        });
        (teacher.students || []).forEach(sid => {
            const s = state.students.find(st => st.id === sid);
            if (s) s.teacherIds = (s.teacherIds||[]).filter(tid => tid !== teacher.id);
        });
        teacher.name = name;
        teacher.email = email;
        teacher.courses = courseOptions;
        teacher.students = studentOptions;
        // relink
        courseOptions.forEach(cid => {
            const c = state.courses.find(cc => cc.id === cid);
            if (c) {
                c.teachers = c.teachers || [];
                if (!c.teachers.includes(teacher.id)) c.teachers.push(teacher.id);
            }
        });
        studentOptions.forEach(sid => {
            const s = state.students.find(st => st.id === sid);
            if (s) {
                s.teacherIds = s.teacherIds || [];
                if (!s.teacherIds.includes(teacher.id)) s.teacherIds.push(teacher.id);
            }
        });
        editingTeacherId = null;
    } else {
        const teacher = { id: 't-'+Date.now(), name, email, courses: courseOptions, students: studentOptions };
        state.teachers.push(teacher);
        courseOptions.forEach(cid => {
            const c = state.courses.find(cc => cc.id === cid);
            if (c) {
                c.teachers = c.teachers || [];
                if (!c.teachers.includes(teacher.id)) c.teachers.push(teacher.id);
            }
        });
        studentOptions.forEach(sid => {
            const s = state.students.find(st => st.id === sid);
            if (s) {
                s.teacherIds = s.teacherIds || [];
                if (!s.teacherIds.includes(teacher.id)) s.teacherIds.push(teacher.id);
            }
        });
    }

    renderTeachersTable();
    updateStats();
    // persist after changes
    persistAppState();
    const modalEl = document.getElementById('teacherModal');
    if (modalEl) {
        const bs = bootstrap.Modal.getInstance(modalEl);
        if (bs) bs.hide();
    }
    document.getElementById('teacherForm').reset();
    const title = document.querySelector('#teacherModal .modal-title');
    const saveBtn = document.getElementById('saveTeacher');
    if (title) title.textContent = 'Nuevo Profesor';
    if (saveBtn) saveBtn.textContent = 'Guardar Profesor';
}

function openTeacherEdit(e) {
    const id = e.currentTarget.getAttribute('data-id');
    const teacher = state.teachers.find(t => t.id === id);
    if (!teacher) return;
    editingTeacherId = id;
    document.getElementById('teacherName').value = teacher.name || '';
    document.getElementById('teacherEmail').value = teacher.email || '';
    // populate selects first to ensure options exist
    populateTeacherOptions();
    // set selected options
    const courseSelect = document.getElementById('teacherCourses');
    const studentSelect = document.getElementById('teacherStudents');
    if (courseSelect) Array.from(courseSelect.options).forEach(o => o.selected = (teacher.courses||[]).includes(o.value));
    if (studentSelect) Array.from(studentSelect.options).forEach(o => o.selected = (teacher.students||[]).includes(o.value));
    const title = document.querySelector('#teacherModal .modal-title');
    const saveBtn = document.getElementById('saveTeacher');
    if (title) title.textContent = 'Editar Profesor';
    if (saveBtn) saveBtn.textContent = 'Actualizar Profesor';
    const modalEl = document.getElementById('teacherModal');
    const bs = new bootstrap.Modal(modalEl);
    bs.show();
}

function deleteTeacher(e) {
    const id = e.currentTarget.getAttribute('data-id');
    // remove teacher record
    state.teachers = state.teachers.filter(t => t.id !== id);
    // remove teacher id from courses' teacher lists
    state.courses.forEach(c => {
        c.teachers = (c.teachers || []).filter(tid => tid !== id);
    });
    // remove teacher id from students' teacher lists
    state.students.forEach(s => {
        s.teacherIds = (s.teacherIds || []).filter(tid => tid !== id);
    });
    renderTeachersTable();
    updateStats();
    // persist after changes
    persistAppState();
}

// New: simple AI recommendations renderer
function renderAIRecommendations() {
    const el = document.getElementById('aiRecommendations');
    if (!el) return;
    const now = new Date();
    const parts = [];
    // cursos con bajo progreso
    const low = state.courses.filter(c => (c.progress||0) < 60).slice(0,5);
    if (low.length) parts.push('<div><strong>Cursos con progreso bajo</strong><ul>' + low.map(c=>`<li>${c.name} — ${c.progress||0}% — ${ (c.teachers && c.teachers.length) ? `${c.teachers.length} profesor(es)` : '<em>Sin profesor asignado</em>' }</li>`).join('') + '</ul></div>');
    // estudiantes en riesgo
    const atRisk = state.students.filter(s => (s.progress||0) < 50).slice(0,8);
    if (atRisk.length) parts.push('<div class="mt-2"><strong>Estudiantes en riesgo</strong><ul>' + atRisk.map(s=>`<li>${s.name} — ${s.progress||0}% — ${ state.courses.find(c=>c.id===s.course)?.name || 'Sin curso' }</li>`).join('') + '</ul></div>');
    // cursos sin profesor
    const noTeacher = state.courses.filter(c => !(c.teachers && c.teachers.length)).slice(0,5);
    if (noTeacher.length) parts.push('<div class="mt-2"><strong>Cursos sin profesor</strong><ul>' + noTeacher.map(c=>`<li>${c.name} — ${c.students?.length||0} estudiantes</li>`).join('') + '</ul></div>');
    // finales próximos
    const ending = state.courses.filter(c => c.endDate).filter(c=>{ const d=new Date(c.endDate); const days=(d-now)/(1000*60*60*24); return days>=0 && days<=21; }).slice(0,5);
    if (ending.length) parts.push('<div class="mt-2"><strong>Cursos que finalizan pronto</strong><ul>' + ending.map(c=>`<li>${c.name} — finaliza ${c.endDate}</li>`).join('') + '</ul></div>');
    // recomendaciones accionables
    if (parts.length) {
        parts.push('<div class="mt-3"><strong>Acciones recomendadas</strong><ul class="mb-0">');
        if (low.length) parts.push('<li>Programar intervenciones en los cursos listados y asignar materiales de refuerzo.</li>');
        if (atRisk.length) parts.push('<li>Enviar mensajes personalizados o sesiones de apoyo a los estudiantes en riesgo.</li>');
        if (noTeacher.length) parts.push('<li>Asignar o reclutar profesor para los cursos sin docente.</li>');
        if (ending.length) parts.push('<li>Recordar entregas finales y publicar resumenes de cierre.</li>');
        parts.push('</ul></div>');
        el.innerHTML = parts.join('');
    } else {
        el.innerHTML = '<p class="text-muted small">Sin recomendaciones por el momento. Añade cursos o estudiantes para recibir sugerencias.</p>';
    }
    updateCharts();
}

// Expose to global so inline onclick from HTML can call it when app.js is loaded as type="module"
window.deleteTeacher = deleteTeacher;
window.deleteCourse = deleteCourse;
window.deleteStudent = deleteStudent;
window.openCourseEdit = openCourseEdit;
window.openStudentEdit = openStudentEdit;
window.openTeacherEdit = openTeacherEdit;

// Utility: populate course selects used when creating students or assigning
function populateCourseOptions() {
    const studentCourse = document.getElementById('studentCourse');
    if (!studentCourse) return;
    const opts = ['<option value="">— Ninguno —</option>'].concat(state.courses.map(c => `<option value="${c.id}">${c.name}</option>`));
    studentCourse.innerHTML = opts.join('');
}

// Utility: load/save user profile to localStorage and update UI
function loadUserProfile() {
    try {
        const raw = localStorage.getItem('av_user_profile');
        if (raw) {
            const parsed = JSON.parse(raw);
            state.user = Object.assign(state.user || {}, parsed);
        }
    } catch (e) {
        console.warn('No se pudo cargar el perfil del almacenamiento local', e);
    }
    // update UI elements
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = state.user.name || 'Usuario';
    // populate profile modal fields if present
    const fullName = document.getElementById('fullName');
    const email = document.getElementById('email');
    const role = document.getElementById('userRole');
    if (fullName) fullName.value = state.user.name || '';
    if (email) email.value = state.user.email || '';
    if (role) role.value = state.user.role || 'admin';
}

function saveUserProfile() {
    const fullName = document.getElementById('fullName');
    const email = document.getElementById('email');
    const role = document.getElementById('userRole');
    if (!fullName || !email || !role) return;
    const nameVal = fullName.value.trim();
    const emailVal = email.value.trim();
    const roleVal = role.value;
    if (!nameVal) {
        return alert('El nombre completo es obligatorio.');
    }
    // update state
    state.user = state.user || {};
    state.user.name = nameVal;
    state.user.email = emailVal;
    state.user.role = roleVal;
    // persist
    try {
        localStorage.setItem('av_user_profile', JSON.stringify(state.user));
    } catch (e) {
        console.warn('No se pudo guardar el perfil en localStorage', e);
    }
    // also persist full app state (to keep user changes and auth consistent)
    persistAppState();
    // update UI
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = state.user.name || 'Usuario';
    // close modal
    const modalEl = document.getElementById('profileModal');
    if (modalEl) {
        const bs = bootstrap.Modal.getInstance(modalEl);
        if (bs) bs.hide();
    }
    // simple toast feedback (if environment supports)
    try {
        const toastEl = document.createElement('div');
        toastEl.className = 'toast show';
        toastEl.style.position = 'fixed';
        toastEl.style.top = '80px';
        toastEl.style.right = '20px';
        toastEl.style.zIndex = 1080;
        toastEl.innerHTML = `<div class="toast-body">Perfil guardado correctamente</div>`;
        document.body.appendChild(toastEl);
        setTimeout(() => { toastEl.remove(); }, 2500);
    } catch (e) { /* ignore */ }
}

// Navigation and initialization
function showSectionById(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('d-none'));
    const sec = document.getElementById(sectionId);
    if (sec) sec.classList.remove('d-none');
    const main = document.getElementById('mainContent');
    if (main) main.scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    // hook nav link
    const teachersLink = document.getElementById('teachersLink');
    if (teachersLink) teachersLink.addEventListener('click', (ev) => {
        ev.preventDefault();
        showSectionById('teachersSection');
    });
    const coursesLink = document.getElementById('coursesLink');
    if (coursesLink) coursesLink.addEventListener('click', (ev) => {
        ev.preventDefault();
        showSectionById('coursesSection');
    });
    const studentsLink = document.getElementById('studentsLink');
    if (studentsLink) studentsLink.addEventListener('click', (ev) => {
        ev.preventDefault();
        showSectionById('studentsSection');
    });
    const analyticsLink = document.getElementById('analyticsLink');
    if (analyticsLink) analyticsLink.addEventListener('click', (ev) => {
        ev.preventDefault();
        showSectionById('analyticsSection');
    });

    // add dashboard link handler
    const dashboardLink = document.getElementById('dashboardLink');
    if (dashboardLink) dashboardLink.addEventListener('click', (ev) => {
        ev.preventDefault();
        showSectionById('dashboardSection');
    });

    // back buttons to dashboard
    const backCourses = document.getElementById('backFromCourses');
    if (backCourses) backCourses.addEventListener('click', () => showSectionById('dashboardSection'));
    const backStudents = document.getElementById('backFromStudents');
    if (backStudents) backStudents.addEventListener('click', () => showSectionById('dashboardSection'));
    const backTeachers = document.getElementById('backFromTeachers');
    if (backTeachers) backTeachers.addEventListener('click', () => showSectionById('dashboardSection'));
    const backAnalytics = document.getElementById('backFromAnalytics');
    if (backAnalytics) backAnalytics.addEventListener('click', () => showSectionById('dashboardSection'));

    // make dashboard cards clickable to open modules
    const coursesCard = document.getElementById('coursesCard');
    if (coursesCard) coursesCard.addEventListener('click', () => showSectionById('coursesSection'));
    const progressCard = document.getElementById('progressCard');
    if (progressCard) progressCard.addEventListener('click', () => showSectionById('analyticsSection'));
    const studentsCard = document.getElementById('studentsCard');
    if (studentsCard) studentsCard.addEventListener('click', () => showSectionById('studentsSection'));
    const teachersCard = document.getElementById('teachersCard');
    if (teachersCard) teachersCard.addEventListener('click', () => showSectionById('teachersSection'));

    // populate selects when opening modals
    const teacherModalEl = document.getElementById('teacherModal');
    if (teacherModalEl) {
        teacherModalEl.addEventListener('show.bs.modal', populateTeacherOptions);
    }
    const studentModalEl = document.getElementById('studentModal');
    if (studentModalEl) {
        studentModalEl.addEventListener('show.bs.modal', populateCourseOptions);
    }

    // save buttons
    const saveTeacherBtn = document.getElementById('saveTeacher');
    if (saveTeacherBtn) saveTeacherBtn.addEventListener('click', saveTeacher);
    const saveCourseBtn = document.getElementById('saveCourse');
    if (saveCourseBtn) saveCourseBtn.addEventListener('click', saveCourse);
    const saveStudentBtn = document.getElementById('saveStudent');
    if (saveStudentBtn) saveStudentBtn.addEventListener('click', saveStudent);

    // load persisted user profile and update UI
    loadUserProfile();

    // attach profile save handler
    const saveProfileBtn = document.getElementById('saveProfile');
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveUserProfile);

    // initial render
    renderCoursesList();
    renderCoursesTable();
    renderStudentsTable();
    renderTeachersTable();
    populateCourseOptions();
    populateTeacherOptions();
    updateStats();
    renderAIRecommendations();
    // initialize charts after DOM ready
    initCharts();
});

// Expose core actions so inline handlers and other modules (modals) can call them reliably
window.saveCourse = saveCourse;
window.saveStudent = saveStudent;
window.saveTeacher = saveTeacher;
window.populateCourseOptions = populateCourseOptions;
window.populateTeacherOptions = populateTeacherOptions;
window.renderCoursesList = renderCoursesList;
window.renderCoursesTable = renderCoursesTable;
window.renderStudentsTable = renderStudentsTable;
window.renderTeachersTable = renderTeachersTable;
window.updateStats = updateStats;

// --- Teacher panel and course detail views ---
// render teacher cards with buttons for each assigned course
function renderTeacherPanel() {
    const container = document.getElementById('teacherPanelContainer');
    if (!container) return;
    if (state.teachers.length === 0) {
        container.innerHTML = '<p class="text-muted small">No hay profesores creados.</p>';
        return;
    }
    container.innerHTML = state.teachers.map(t => {
        const courseButtons = (t.courses || []).map(cid => {
            const c = state.courses.find(cc => cc.id === cid) || { name: '—', id: cid };
            return `<button class="btn btn-sm btn-outline-primary me-1 mb-1 teacher-course-btn" data-teacher="${t.id}" data-course="${c.id}">${c.name}</button>`;
        }).join('');
        return `<div class="card mb-2">
            <div class="card-body d-flex justify-content-between align-items-center">
                <div>
                    <strong>${t.name}</strong><div class="text-muted small">${t.email}</div>
                </div>
                <div class="text-end">
                    ${courseButtons || '<small class="text-muted">Sin cursos</small>'}
                </div>
            </div>
        </div>`;
    }).join('');
    // bind buttons
    document.querySelectorAll('.teacher-course-btn').forEach(btn => {
        btn.addEventListener('click', (ev) => {
            const teacherId = ev.currentTarget.getAttribute('data-teacher');
            const courseId = ev.currentTarget.getAttribute('data-course');
            openCourseDetailForTeacher(teacherId, courseId);
        });
    });
}

function openCourseDetailForTeacher(teacherId, courseId) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    // show course detail section
    showSectionById('courseDetailSection');
    // set title/meta
    const titleEl = document.getElementById('courseDetailTitle');
    const metaEl = document.getElementById('courseDetailMeta');
    if (titleEl) titleEl.textContent = course.name || 'Curso';
    if (metaEl) metaEl.textContent = `Profesor: ${state.teachers.find(t=>t.id===teacherId)?.name || '—'}`;
    // render students list
    renderCourseStudentsList(courseId);
    // populate share/grade selects with students
    populateTargetsForCourse(courseId);
    // render existing shared files and grades
    renderSharedFiles(courseId);
    renderGrades(courseId);
    // store current context
    currentCourseContext.courseId = courseId;
    currentCourseContext.teacherId = teacherId;
    // start a short interval to refresh statuses in real time while viewing
    if (currentCourseContext._intervalId) clearInterval(currentCourseContext._intervalId);
    currentCourseContext._intervalId = setInterval(() => {
        // just re-render students list to reflect connected flags / timestamps
        renderCourseStudentsList(courseId);
        renderSharedFiles(courseId);
        renderGrades(courseId);
    }, 2000);
}

function renderCourseStudentsList(courseId) {
    const container = document.getElementById('courseStudentsList');
    if (!container) return;
    const students = state.students.filter(s => s.course === courseId);
    if (students.length === 0) {
        container.innerHTML = '<p class="text-muted small">No hay alumnos en este curso.</p>';
        return;
    }
    container.innerHTML = students.map(s => {
        // compute online status automatically: connected boolean means currently connected,
        // if disconnected show lastOnline timestamp
        const online = !!s.connected;
        const stamp = s.lastOnline ? new Date(s.lastOnline).toLocaleString() : '—';
        const statusText = online ? `En línea (desde ${stamp})` : `Desconectado (últ. ${stamp})`;
        return `<div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
            <div>
                <strong>${s.name}</strong><div class="small text-muted">${s.email}</div>
                <div class="small mt-1 ${online ? 'text-success' : 'text-muted'}">${statusText}</div>
            </div>
            <div class="text-end">
                <button class="btn btn-sm btn-outline-success me-1 toggle-online" data-id="${s.id}">${online ? 'Marcar desconectado' : 'Marcar en línea'}</button>
            </div>
        </div>`;
    }).join('');
    // bind toggle buttons
    document.querySelectorAll('.toggle-online').forEach(btn => {
        btn.addEventListener('click', (ev) => {
            const id = ev.currentTarget.getAttribute('data-id');
            const s = state.students.find(st => st.id === id);
            if (!s) return;
            // toggle connected state; when disconnecting, record lastOnline timestamp
            s.connected = !s.connected;
            if (s.connected) {
                s.lastOnline = new Date().toISOString();
            } else {
                s.lastOnline = new Date().toISOString();
            }
            renderCourseStudentsList(courseId);
        });
    });
}

function populateTargetsForCourse(courseId) {
    const shareTarget = document.getElementById('shareTarget');
    const gradeTarget = document.getElementById('gradeTarget');
    if (!shareTarget || !gradeTarget) return;
    const students = state.students.filter(s => s.course === courseId);
    const opts = ['<option value="all">Enviar a todos los alumnos</option>']
        .concat(students.map(s => `<option value="${s.id}">${s.name}</option>`));
    shareTarget.innerHTML = opts.join('');
    gradeTarget.innerHTML = ['<option value="all">Enviar calificación a todos</option>']
        .concat(students.map(s => `<option value="${s.id}">${s.name}</option>`)).join('');
}

function renderSharedFiles(courseId) {
    const listEl = document.getElementById('sharedFilesList');
    if (!listEl) return;
    const items = state.courseMessages[courseId] || [];
    if (items.length === 0) {
        listEl.innerHTML = '<p class="text-muted small">No se han compartido archivos aún.</p>';
        return;
    }
    listEl.innerHTML = items.slice().reverse().map(it => {
        const ts = new Date(it.timestamp).toLocaleString();
        const targetLabel = it.target === 'all' ? 'Todos' : (state.students.find(s=>s.id===it.target)?.name || '—');
        // If item is audio (either marked isAudio or filename audio extension), render <audio>
        if (it.isAudio) {
            // If blobRef exists, create object URL; else no blob (uploaded file not stored) -> show filename only
            const audioUrl = it.blobRef ? URL.createObjectURL(it.blobRef) : null;
            const player = audioUrl ? `<audio controls src="${audioUrl}"></audio>` : `<div class="small text-muted">${it.fileName}</div>`;
            return `<div class="border rounded p-2 mb-2">
                <div class="d-flex justify-content-between">
                    <div style="max-width:70%;">
                        <strong>${it.fileName}</strong>
                        <div class="small text-muted">Para: ${targetLabel}</div>
                        <div class="mt-2">${player}</div>
                    </div>
                    <div class="small text-muted">${ts}</div>
                </div>
            </div>`;
        }
        // default file rendering (non-audio)
        return `<div class="border rounded p-2 mb-2">
            <div class="d-flex justify-content-between">
                <div>
                    <strong>${it.fileName}</strong><div class="small text-muted">Para: ${targetLabel}</div>
                </div>
                <div class="small text-muted">${ts}</div>
            </div>
        </div>`;
    }).join('');
}

function renderGrades(courseId) {
    const listEl = document.getElementById('gradesList');
    if (!listEl) return;
    const items = state.courseGrades[courseId] || [];
    if (items.length === 0) {
        listEl.innerHTML = '<p class="text-muted small">No hay calificaciones enviadas.</p>';
        return;
    }
    listEl.innerHTML = items.slice().reverse().map(g => {
        const ts = new Date(g.timestamp).toLocaleString();
        const targetLabel = g.studentId === 'all' ? 'Todos' : (state.students.find(s=>s.id===g.studentId)?.name || '—');
        return `<div class="border rounded p-2 mb-2">
            <div class="d-flex justify-content-between">
                <div>
                    <strong>${g.grade}</strong> <span class="small text-muted">— ${g.comment || ''}</span>
                    <div class="small text-muted">Para: ${targetLabel}</div>
                </div>
                <div class="small text-muted">${ts}</div>
            </div>
        </div>`;
    }).join('');
}

// handlers for share and grade actions
function handleShareSend() {
    const ctx = currentCourseContext.courseId;
    const teacherId = currentCourseContext.teacherId;
    if (!ctx) return;
    const fileInput = document.getElementById('shareFile');
    const target = document.getElementById('shareTarget').value;
    // Prefer recordedBlob if present
    const recorded = window._lastRecordedAudioBlob || null;
    if (!fileInput && !recorded) return alert('Seleccione un archivo o grabe audio.');
    if ((!fileInput || !fileInput.files || fileInput.files.length === 0) && !recorded) return alert('Seleccione un archivo o grabe audio.');
    let fileName = '';
    if (recorded) {
        fileName = 'voz-' + Date.now() + '.webm';
    } else {
        const file = fileInput.files[0];
        fileName = file.name;
    }
    const rec = { id: 'm-'+Date.now(), fileName, target, timestamp: new Date().toISOString(), fromTeacherId: teacherId, isAudio: !!recorded || (fileInput.files[0] && fileInput.files[0].type.startsWith('audio/')), blobRef: recorded ? recorded : null };
    state.courseMessages[ctx] = state.courseMessages[ctx] || [];
    state.courseMessages[ctx].push(rec);
    // Clear recorded blob and file input after sending
    if (recorded) {
        window._lastRecordedAudioBlob = null;
        const audioPreviewWrapper = document.getElementById('audioPreviewWrapper');
        if (audioPreviewWrapper) audioPreviewWrapper.classList.add('d-none');
        const audioPreview = document.getElementById('audioPreview');
        if (audioPreview) audioPreview.src = '';
        const recordStatus = document.getElementById('recordStatus');
        if (recordStatus) recordStatus.textContent = 'No grabando';
    }
    if (fileInput) fileInput.value = '';
    renderSharedFiles(ctx);
    // persist messages
    persistAppState();
}

function handleGradeSend() {
    const ctx = currentCourseContext.courseId;
    const teacherId = currentCourseContext.teacherId;
    if (!ctx) return;
    const target = document.getElementById('gradeTarget').value;
    const comment = document.getElementById('gradeComment').value.trim();
    const gradeValue = Number(document.getElementById('gradeValue').value);
    if (isNaN(gradeValue)) return alert('Introduce una nota válida.');
    const rec = { id: 'g-'+Date.now(), studentId: target === 'all' ? 'all' : target, grade: gradeValue, comment, timestamp: new Date().toISOString(), fromTeacherId: teacherId };
    state.courseGrades[ctx] = state.courseGrades[ctx] || [];
    state.courseGrades[ctx].push(rec);
    // if for single student, optionally store on student record
    if (rec.studentId !== 'all') {
        const s = state.students.find(st => st.id === rec.studentId);
        if (s) {
            s.grades = s.grades || [];
            s.grades.push({ courseId: ctx, grade: gradeValue, comment, timestamp: rec.timestamp, from: teacherId });
        }
    } else {
        // for "all" - append to each student
        state.students.filter(st => st.course === ctx).forEach(s => {
            s.grades = s.grades || [];
            s.grades.push({ courseId: ctx, grade: gradeValue, comment, timestamp: rec.timestamp, from: teacherId });
        });
    }
    renderGrades(ctx);
    document.getElementById('gradeForm').reset();
    // persist grades
    persistAppState();
}

// simple context holder
const currentCourseContext = { courseId: null, teacherId: null };

// back button from course detail to teachers module
const backFromCourseDetailBtn = document.getElementById('backFromCourseDetail');
if (backFromCourseDetailBtn) {
    backFromCourseDetailBtn.addEventListener('click', () => {
        // clear realtime refresh interval when leaving course detail
        if (currentCourseContext._intervalId) {
            clearInterval(currentCourseContext._intervalId);
            currentCourseContext._intervalId = null;
        }
        showSectionById('teachersSection');
    });
}

// ensure binds after DOMContentLoaded code above will run first; now add handlers for new UI
document.addEventListener('DOMContentLoaded', () => {
    // bind share and grade buttons
    const shareBtn = document.getElementById('shareSendBtn');
    if (shareBtn) shareBtn.addEventListener('click', handleShareSend);
    const gradeBtn = document.getElementById('gradeSendBtn');
    if (gradeBtn) gradeBtn.addEventListener('click', handleGradeSend);

    // when teachers section shown, render panel
    // ensure a mutation observer isn't necessary: re-render after any change to teachers/courses
    // hook into existing render calls by wrapping original renderTeachersTable to also refresh teacher panel
    const originalRenderTeachersTable = renderTeachersTable;
    renderTeachersTable = function() {
        originalRenderTeachersTable();
        renderTeacherPanel();
    };
    // call once to initialize panel
    renderTeacherPanel();
});

// Also update places where teachers or courses change to refresh panel:
// patch deleteTeacher, saveTeacher, saveCourse, deleteCourse, saveStudent, deleteStudent etc. to call renderTeacherPanel()

const _deleteCourse = deleteCourse;
window.deleteCourse = function(e) {
    _deleteCourse(e);
    refreshAllViews();
};

const _deleteStudent = deleteStudent;
window.deleteStudent = function(e) {
    _deleteStudent(e);
    refreshAllViews();
};

const _saveCourse = saveCourse;
window.saveCourse = function() {
    _saveCourse();
    refreshAllViews();
};

const _saveStudent = saveStudent;
window.saveStudent = function() {
    _saveStudent();
    refreshAllViews();
};

const _saveTeacher = saveTeacher;
window.saveTeacher = function() {
    _saveTeacher();
    refreshAllViews();
};

const _deleteTeacher = deleteTeacher;
window.deleteTeacher = function(e) {
    _deleteTeacher(e);
    refreshAllViews();
};

// Recording helpers for audio (uses MediaRecorder if available)
(function initAudioRecordingControls(){
    let mediaRecorder = null;
    let chunks = [];
    const recordBtnInit = () => {
        const recordBtn = document.getElementById('recordBtn');
        const stopBtn = document.getElementById('stopRecordBtn');
        const recordStatus = document.getElementById('recordStatus');
        const audioPreviewWrapper = document.getElementById('audioPreviewWrapper');
        const audioPreview = document.getElementById('audioPreview');
        const shareFileInput = document.getElementById('shareFile');

        if (!recordBtn || !stopBtn || !recordStatus) return;

        recordBtn.addEventListener('click', async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return alert('Grabación no soportada en este navegador.');
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                chunks = [];
                mediaRecorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
                mediaRecorder.onstart = () => {
                    recordBtn.classList.add('d-none');
                    stopBtn.classList.remove('d-none');
                    recordStatus.textContent = 'Grabando...';
                };
                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    // store temp blob globally to be picked when sending
                    window._lastRecordedAudioBlob = blob;
                    const url = URL.createObjectURL(blob);
                    if (audioPreview) {
                        audioPreview.src = url;
                        audioPreviewWrapper.classList.remove('d-none');
                    }
                    recordBtn.classList.remove('d-none');
                    stopBtn.classList.add('d-none');
                    recordStatus.textContent = 'Grabación lista para enviar';
                    // stop tracks
                    stream.getTracks().forEach(t => t.stop());
                };
                mediaRecorder.start();
            } catch (err) {
                console.error('Error accediendo al micrófono', err);
                alert('No se pudo acceder al micrófono.');
            }
        });

        stopBtn.addEventListener('click', () => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        });

        // when selecting file manually, clear any recorded blob preview
        if (shareFileInput) {
            shareFileInput.addEventListener('change', () => {
                if (window._lastRecordedAudioBlob) {
                    window._lastRecordedAudioBlob = null;
                    if (audioPreview) {
                        audioPreview.src = '';
                        audioPreviewWrapper.classList.add('d-none');
                    }
                    if (recordStatus) recordStatus.textContent = 'No grabando';
                }
            });
        }
    };

    // wait for DOM ready to attach controls
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', recordBtnInit);
    } else {
        recordBtnInit();
    }
})();

// --- Add chart initialization and update functions for Analytics module ---
function initCharts() {
    const pCtx = document.getElementById('progressChart')?.getContext?.('2d');
    const perfCtx = document.getElementById('performanceChart')?.getContext?.('2d');
    if (pCtx && !charts.progressChart) {
        charts.progressChart = new Chart(pCtx, {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Progreso (%) por estudiante', data: [], backgroundColor: '#0d6efd' }] },
            options: { responsive:true, maintainAspectRatio:false, scales:{ y: { beginAtZero:true, max:100 } } }
        });
    }
    if (perfCtx && !charts.performanceChart) {
        charts.performanceChart = new Chart(perfCtx, {
            type: 'pie',
            data: { labels: [], datasets: [{ label: 'Rendimiento por curso', data: [], backgroundColor: [] }] },
            options: { responsive:true, maintainAspectRatio:false }
        });
    }
}

function updateCharts() {
    // Progress chart: list students in selected view (overall: top 10 recent students)
    if (charts.progressChart) {
        const students = state.students.slice().slice(-20);
        charts.progressChart.data.labels = students.map(s => s.name || s.email || s.id);
        charts.progressChart.data.datasets[0].data = students.map(s => Number(s.progress || 0));
        charts.progressChart.update();
    }
    // Performance chart: average progress per course
    if (charts.performanceChart) {
        const labels = state.courses.map(c => c.name || c.id);
        const data = state.courses.map(c => Number(c.progress || 0));
        // generate simple palette
        const palette = labels.map((_,i) => `hsl(${(i*47)%360} 70% 50%)`);
        charts.performanceChart.data.labels = labels;
        charts.performanceChart.data.datasets[0].data = data;
        charts.performanceChart.data.datasets[0].backgroundColor = palette;
        charts.performanceChart.update();
    }
}

function updateStats() {
    const courses = state.courses.length;
    const totalStudents = state.students.length;
    const totalTeachers = state.teachers.length;
    const avgProgress = (state.courses.length > 0) ?
        Math.round(state.courses.reduce((sum, course) => sum + (course.progress || 0), 0) / state.courses.length) : 0;

    const activeEl = document.getElementById('activeCourses');
    if (activeEl) activeEl.textContent = courses;
    const progEl = document.getElementById('generalProgress');
    if (progEl) progEl.textContent = avgProgress + '%';
    const studentsEl = document.getElementById('totalStudents');
    if (studentsEl) studentsEl.textContent = totalStudents;
    const teachersEl = document.getElementById('totalTeachers');
    if (teachersEl) teachersEl.textContent = totalTeachers;

    // Refresh charts after stats update
    updateCharts();
    
    // Re-apply permissions in case role-dependent controls should hide/show after data changes
    applyPermissions();

    // Refresh AI recommendations after stats change
    renderAIRecommendations();
}