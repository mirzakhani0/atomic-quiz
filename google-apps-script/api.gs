/**
 * ATOMIC QUIZ - API REST para Google Apps Script
 */

// ============================================
// CONFIGURACIÓN - TU ID DE HOJA DE CÁLCULO
// ============================================
const SPREADSHEET_ID = '1x3WJAs5rzN4jrIF_PHtxp18JjxynHdLShCF9EbWBD4Q';

// Nombres de las hojas de configuración
const CONFIG_SHEETS = {
  'Ingenierías': 'Configuración_Ingenierías',
  'Sociales': 'Configuración_Sociales',
  'Biomédicas': 'Configuración_Biomédicas'
};

// Mapeo de asignaturas a hojas de banco de preguntas (Bancos Históricos)
const SUBJECT_SHEETS = {
  'Aritmética': 'Banco_Aritmética',
  'Álgebra': 'Banco_Álgebra',
  'Geometría': 'Banco_Geometría',
  'Trigonometría': 'Banco_Trigonometría',
  'Física': 'Banco_Física',
  'Química': 'Banco_Química',
  'Biología y Anatomía': 'Banco_Biología y Anatomía',
  'Psicología y Filosofía': 'Banco_Psicología y Filosofía',
  'Geografía': 'Banco_Geografía',
  'Historia': 'Banco_Historia',
  'Educación Cívica': 'Banco_Educación Cívica',
  'Economía': 'Banco_Economía',
  'Comunicación': 'Banco_Comunicación',
  'Literatura': 'Banco_Literatura',
  'Razonamiento Matemático': 'Banco_Razonamiento Matemático',
  'Razonamiento Verbal': 'Banco_Razonamiento Verbal',
  'Inglés': 'Banco_Inglés',
  'Quechua y aimara': 'Banco_Quechua y aimara'
};

// ============================================
// CEPREUNA - Mapeo de hojas por curso
// ============================================
const CEPRE_SUBJECT_SHEETS = {
  'Aritmética': 'CEPRE_Aritmética',
  'Álgebra': 'CEPRE_Álgebra',
  'Geometría': 'CEPRE_Geometría',
  'Trigonometría': 'CEPRE_Trigonometría',
  'Física': 'CEPRE_Física',
  'Química': 'CEPRE_Química',
  'Psicología y Filosofía': 'CEPRE_PsicologíaFilosofía',
  'Historia': 'CEPRE_Historia',
  'Educación Cívica': 'CEPRE_EducaciónCívica',
  'Economía': 'CEPRE_Economía',
  'Razonamiento Matemático': 'CEPRE_RazonamientoMatemático',
  'RM': 'CEPRE_RazonamientoMatemático',
  'Razonamiento Verbal': 'CEPRE_RazonamientoVerbal',
  'Inglés': 'Banco_Inglés',
  'Quechua y aimara': 'Banco_Quechua y aimara',
  'Quechua y Aimara': 'Banco_Quechua y aimara',
  'Biología': 'CEPRE_Biología',
  'Anatomía': 'CEPRE_Anatomía',
  'Biología y Anatomía': 'CEPRE_BiologíaAnatomía',
  'Matemática': 'CEPRE_Matemática',
  'Comunicación': 'CEPRE_Comunicación',
  'Comunicación y Literatura': 'CEPRE_ComunicaciónLiteratura',
  'Literatura': 'CEPRE_Literatura',
  'Geografía': 'CEPRE_Geografía',
  'Historia y Geografía': 'CEPRE_HistoriaGeografia'
};

// ============================================
// FUNCIÓN PRINCIPAL - ENDPOINT REST
// ============================================
function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;

    switch (action) {
      case 'config':
        result = getConfig();
        break;
      case 'questions':
        const area = e.parameter.area;
        if (!area) return createErrorResponse('Parámetro "area" requerido');
        result = getQuestions(area);
        break;
      case 'login':
        const loginUsername = e.parameter.username || '';
        const loginPassword = e.parameter.password || '';
        result = loginUser(loginUsername, loginPassword);
        break;
      case 'registrarAlumnoConUsuario':
        const regData = {
          nombre: e.parameter.nombre || '',
          apellido: e.parameter.apellido || '',
          carrera: e.parameter.carrera || '',
          area: e.parameter.area || '',
          celular: e.parameter.celular || '',
          dni: e.parameter.dni || '',
          email: e.parameter.email || '',
          username: e.parameter.username || '',
          password: e.parameter.password || ''
        };
        result = registrarAlumnoConUsuario(regData);
        break;
      case 'saveScore':
        const scoreDni = e.parameter.dni || '';
        const score = parseFloat(e.parameter.score) || 0;
        const maxScore = parseFloat(e.parameter.maxScore) || 0;
        const scoreArea = e.parameter.area || '';
        const correctCount = parseInt(e.parameter.correct) || 0;
        const totalCount = parseInt(e.parameter.total) || 0;
        result = saveUserScore(scoreDni, score, maxScore, scoreArea, correctCount, totalCount);
        break;
      case 'getHistory':
        const historyDni = e.parameter.dni || '';
        result = getUserHistory(historyDni);
        break;
      case 'test':
        result = { status: 'ok', message: 'API ATOMIC QUIZ funcionando correctamente', timestamp: new Date().toISOString() };
        break;
      default:
        return createErrorResponse('Acción no válida.');
    }

    return createSuccessResponse(result);

  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

function createSuccessResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// LOGIN Y REGISTRO AVANZADO
// ============================================

function loginUser(username, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Usuarios');
    if (!sheet) return { success: false, message: 'Sistema de usuarios no configurado' };
    const data = sheet.getDataRange().getValues();
    const userLower = String(username).toLowerCase().trim();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase().trim() === userLower && String(data[i][1]) === password) {
        return { success: true, user: { username: data[i][0], role: data[i][2] || 'alumno', nombre: data[i][3] || '' } };
      }
    }
    return { success: false, message: 'Usuario o contraseña incorrectos' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

function registrarAlumnoConUsuario(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheetAlumnos = ss.getSheetByName('Alumnos') || ss.insertSheet('Alumnos');
    if (sheetAlumnos.getLastRow() === 0) sheetAlumnos.appendRow(['nombre', 'apellido', 'carrera', 'area', 'celular', 'dni', 'email', 'username', 'password', 'fecha']);
    
    let sheetUsuarios = ss.getSheetByName('Usuarios') || ss.insertSheet('Usuarios');
    if (sheetUsuarios.getLastRow() === 0) sheetUsuarios.appendRow(['username', 'password', 'role', 'nombre', 'createdAt', 'active']);
    
    const userData = sheetUsuarios.getDataRange().getValues();
    const userLower = String(data.username).toLowerCase().trim();
    for (let i = 1; i < userData.length; i++) {
      if (String(userData[i][0]).toLowerCase().trim() === userLower) return { success: false, message: 'El nombre de usuario ya existe' };
    }
    
    sheetAlumnos.appendRow([data.nombre, data.apellido, data.carrera, data.area, data.celular, data.dni, data.email, data.username, data.password, new Date()]);
    sheetUsuarios.appendRow([data.username, data.password, 'alumno', data.nombre + ' ' + data.apellido, new Date(), true]);
    
    return { success: true, message: 'Registro completado con éxito en ATOMIC QUIZ' };
  } catch (e) { return { success: false, message: e.toString() }; }
}

// ============================================
// FUNCIONES DE PREGUNTAS (Configuración y Carga)
// ============================================
function getConfig() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const config = {};
  for (const [areaName, sheetName] of Object.entries(CONFIG_SHEETS)) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;
    const data = sheet.getDataRange().getValues();
    const subjects = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][1] !== 'TOTAL') subjects.push({ name: data[i][1], questionCount: data[i][3], maxScore: data[i][5] });
    }
    config[areaName] = { name: areaName, subjects: subjects };
  }
  return config;
}

function getQuestions(areaName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const config = getConfig()[areaName];
  if (!config) return [];
  const questions = [];
  let qNum = 1;
  for (const sub of config.subjects) {
    const subQs = getRandomQuestionsFromSubject(ss, sub.name, sub.questionCount, sub.maxScore, qNum);
    questions.push(...subQs);
    qNum += subQs.length;
  }
  return questions;
}

function getRandomQuestionsFromSubject(ss, subName, count, maxScore, startNum) {
  const sheet = ss.getSheetByName(SUBJECT_SHEETS[subName]);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const all = [];
  for (let i = 1; i < data.length; i++) if (data[i][0]) all.push({ r: i, d: data[i] });
  const sel = selectRandomItems(all, count);
  const pts = count > 0 ? maxScore / count : 0;
  return sel.map((q, idx) => ({
    id: `${subName}-${q.r}`, number: startNum + idx, questionText: q.d[0],
    options: [q.d[2], q.d[3], q.d[4], q.d[5], q.d[6]].filter(o => o),
    correctAnswer: (parseInt(q.d[7]) || 1) - 1, subject: subName, points: pts,
    justification: q.d[14] || null, imageLink: q.d[9] || null
  }));
}

function selectRandomItems(arr, count) {
  const shuff = [...arr].sort(() => 0.5 - Math.random());
  return shuff.slice(0, count);
}

function saveUserScore(dni, score, maxScore, area, correct, total) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('historial_puntajes') || ss.insertSheet('historial_puntajes');
  if (sheet.getLastRow() === 0) sheet.appendRow(['DNI', 'Fecha', 'Área', 'Puntaje', 'Puntaje Máx', 'Correctas', 'Total']);
  sheet.appendRow([dni, new Date(), area, score, maxScore, correct, total]);
  return { saved: true };
}

function getUserHistory(dni) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('historial_puntajes');
  if (!sheet) return { history: [] };
  const data = sheet.getDataRange().getValues();
  const hist = [];
  for (let i = 1; i < data.length; i++) if (String(data[i][0]) === dni) hist.push({ fecha: data[i][1], area: data[i][2], puntaje: data[i][3], puntajeMax: data[i][4], correctas: data[i][5], total: data[i][6] });
  return { history: hist.reverse() };
}
