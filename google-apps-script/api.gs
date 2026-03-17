/**
 * ATOMIC QUIZ - API REST para Google Apps Script
 */

const SPREADSHEET_ID = '1x3WJAs5rzN4jrIF_PHtxp18JjxynHdLShCF9EbWBD4Q';

const CONFIG_SHEETS = {
  'Ingenierías': 'Configuración_Ingenierías',
  'Sociales': 'Configuración_Sociales',
  'Biomédicas': 'Configuración_Biomédicas'
};

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
        result = loginUser(e.parameter.username, e.parameter.password);
        break;
      case 'registrarAlumnoConUsuario':
        result = registrarAlumnoConUsuario(e.parameter);
        break;
      case 'saveScore':
        result = saveUserScore(e.parameter.dni, e.parameter.score, e.parameter.maxScore, e.parameter.area, e.parameter.correct, e.parameter.total, e.parameter.wrongIds);
        break;
      case 'getHistory':
        result = getUserHistory(e.parameter.dni);
        break;
      case 'getLeaderboard':
        result = getLeaderboard(e.parameter.area);
        break;
      case 'getWrongQuestions':
        result = getWrongQuestions(e.parameter.dni);
        break;
      case 'test':
        result = { status: 'ok', message: 'API ATOMIC QUIZ funcionando' };
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
  return ContentService.createTextOutput(JSON.stringify({ success: true, ...data })).setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(message) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: message })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// LOGIN Y REGISTRO
// ============================================

function loginUser(username, password) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Usuarios');
  if (!sheet) return { success: false, message: 'No hay usuarios' };
  const data = sheet.getDataRange().getValues();
  const userLower = String(username).toLowerCase().trim();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === userLower && String(data[i][1]) === password) {
      return { success: true, user: { username: data[i][0], role: data[i][2], nombre: data[i][3] } };
    }
  }
  return { success: false, message: 'Usuario o contraseña incorrectos' };
}

function registrarAlumnoConUsuario(p) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let shA = ss.getSheetByName('Alumnos') || ss.insertSheet('Alumnos');
  if (shA.getLastRow() === 0) shA.appendRow(['nombre', 'apellido', 'carrera', 'area', 'celular', 'dni', 'email', 'username', 'password', 'fecha']);
  let shU = ss.getSheetByName('Usuarios') || ss.insertSheet('Usuarios');
  if (shU.getLastRow() === 0) shU.appendRow(['username', 'password', 'role', 'nombre', 'createdAt', 'active']);
  
  const userData = shU.getDataRange().getValues();
  for (let i = 1; i < userData.length; i++) {
    if (String(userData[i][0]).toLowerCase().trim() === String(p.username).toLowerCase().trim()) return { success: false, message: 'Usuario ya existe' };
  }
  
  shA.appendRow([p.nombre, p.apellido, p.carrera, p.area, p.celular, p.dni, p.email, p.username, p.password, new Date()]);
  shU.appendRow([p.username, p.password, 'alumno', p.nombre + ' ' + p.apellido, new Date(), true]);
  return { success: true };
}

// ============================================
// HISTORIAL, RANKING Y ERRORES
// ============================================

function saveUserScore(dni, score, maxScore, area, correct, total, wrongIds) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let shH = ss.getSheetByName('historial_puntajes') || ss.insertSheet('historial_puntajes');
  if (shH.getLastRow() === 0) shH.appendRow(['DNI', 'Fecha', 'Área', 'Puntaje', 'Puntaje Máx', 'Correctas', 'Total', 'Nombre']);
  
  // Buscar nombre
  let nombre = '';
  let shU = ss.getSheetByName('Usuarios');
  if (shU) {
    let uData = shU.getDataRange().getValues();
    for (let i = 1; i < uData.length; i++) if (String(uData[i][0]) === dni) { nombre = uData[i][3]; break; }
  }

  shH.appendRow([dni, new Date(), area, score, maxScore, correct, total, nombre]);

  // Guardar errores si existen
  if (wrongIds) {
    let shE = ss.getSheetByName('errores_alumnos') || ss.insertSheet('errores_alumnos');
    if (shE.getLastRow() === 0) shE.appendRow(['DNI', 'QuestionID', 'Fecha']);
    let ids = wrongIds.split(',');
    ids.forEach(id => shE.appendRow([dni, id, new Date()]));
  }
  return { saved: true };
}

function getLeaderboard(area) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('historial_puntajes');
  if (!sheet) return { leaderboard: [] };
  const data = sheet.getDataRange().getValues();
  let results = [];
  for (let i = 1; i < data.length; i++) {
    if (!area || data[i][2] === area) {
      results.push({ nombre: data[i][7] || 'Anónimo', puntaje: parseFloat(data[i][3]), area: data[i][2], fecha: data[i][1] });
    }
  }
  // Ordenar por puntaje y tomar top 10
  results.sort((a, b) => b.puntaje - a.puntaje);
  return { leaderboard: results.slice(0, 10) };
}

function getWrongQuestions(dni) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let shE = ss.getSheetByName('errores_alumnos');
  if (!shE) return { questions: [] };
  const eData = shE.getDataRange().getValues();
  let wrongIds = new Set();
  for (let i = 1; i < eData.length; i++) {
    if (String(eData[i][0]) === dni) wrongIds.add(String(eData[i][1]));
  }
  
  // Aquí la lógica para buscar las preguntas reales por ID sería compleja, 
  // así que por ahora retornaremos los IDs para que el frontend los maneje o 
  // implementaremos una búsqueda simplificada.
  return { wrongIds: Array.from(wrongIds) };
}

function getUserHistory(dni) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('historial_puntajes');
  if (!sheet) return { history: [] };
  const data = sheet.getDataRange().getValues();
  const hist = [];
  for (let i = 1; i < data.length; i++) if (String(data[i][0]) === dni) hist.push({ fecha: data[i][1], area: data[i][2], puntaje: data[i][3], puntajeMax: data[i][4], correctas: data[i][5], total: data[i][6] });
  return { history: hist.reverse() };
}

// ============================================
// FUNCIONES DE PREGUNTAS
// ============================================

function getConfig() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const config = {};
  for (const [areaName, sheetName] of Object.entries(CONFIG_SHEETS)) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;
    const data = sheet.getDataRange().getValues();
    const subjects = [];
    for (let i = 1; i < data.length; i++) if (data[i][1] && data[i][1] !== 'TOTAL') subjects.push({ name: data[i][1], questionCount: data[i][3], maxScore: data[i][5] });
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
  const shuff = all.sort(() => 0.5 - Math.random());
  const sel = shuff.slice(0, count);
  const pts = count > 0 ? maxScore / count : 0;
  return sel.map((q, idx) => ({
    id: `${subName}-${q.r}`, number: startNum + idx, questionText: q.d[0],
    options: [q.d[2], q.d[3], q.d[4], q.d[5], q.d[6]].filter(o => o),
    correctAnswer: (parseInt(q.d[7]) || 1) - 1, subject: subName, points: pts,
    justification: q.d[14] || null, imageLink: q.d[9] || null
  }));
}
