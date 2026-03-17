/**
 * ATOMIC QUIZ - API REST para Google Apps Script
 * 
 * INSTRUCCIONES DE CONFIGURACIÓN:
 * 1. Crear un nuevo proyecto en Google Apps Script (script.google.com)
 * 2. Copiar este código en el archivo Code.gs
 * 3. Actualizar SPREADSHEET_ID con el ID de tu Google Sheets
 * 4. Implementar como aplicación web:
 *    - Extensiones > Apps Script > Implementar > Nueva implementación
 *    - Tipo: Aplicación web
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier persona
 * 5. Copiar la URL generada y usarla en el frontend
 */

// ============================================
// CONFIGURACIÓN - ACTUALIZAR CON TU SPREADSHEET
// ============================================
const SPREADSHEET_ID = '1U6Di8dSy-UZVkt7_L6VEexHPyBurEH0suDrUogcugVk';

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
  // Cursos comunes
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

  // Idiomas - usar hojas del banco histórico (no hay CEPRE específico)
  'Inglés': 'Banco_Inglés',
  'Quechua y aimara': 'Banco_Quechua y aimara',
  'Quechua y Aimara': 'Banco_Quechua y aimara',

  // Cursos específicos por área
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

// Cursos disponibles por área CEPREUNA (incluye Idiomas)
const CEPRE_COURSES_BY_AREA = {
  'ING': [
    'Aritmética', 'Álgebra', 'Geometría', 'Trigonometría',
    'Física', 'Química', 'Biología y Anatomía',
    'Psicología y Filosofía', 'Historia y Geografía', 'Educación Cívica',
    'Economía', 'Comunicación y Literatura',
    'Razonamiento Matemático', 'Razonamiento Verbal',
    'Inglés', 'Quechua y aimara'
  ],
  'BIO': [
    'Aritmética', 'Matemática', 'Física', 'Química',
    'Biología', 'Anatomía', 'Psicología y Filosofía',
    'Historia y Geografía', 'Educación Cívica', 'Economía',
    'Comunicación y Literatura', 'Razonamiento Matemático',
    'Razonamiento Verbal', 'Inglés', 'Quechua y aimara'
  ],
  'SOC': [
    'Matemática', 'Física', 'Química', 'Biología y Anatomía',
    'Psicología y Filosofía', 'Historia', 'Geografía',
    'Educación Cívica', 'Economía', 'Comunicación', 'Literatura',
    'Razonamiento Matemático', 'Razonamiento Verbal',
    'Inglés', 'Quechua y aimara'
  ]
};

// Semanas válidas CEPREUNA
const CEPRE_SEMANAS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16'];

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
        if (!area) {
          return createErrorResponse('Parámetro "area" requerido');
        }
        result = getQuestions(area);
        break;
      case 'register':
        const dni = e.parameter.dni || '';
        const fullName = e.parameter.fullName || '';
        const email = e.parameter.email || '';
        const phone = e.parameter.phone || '';
        const processType = e.parameter.processType || '';
        const areaReg = e.parameter.area || '';
        const career = e.parameter.career || '';
        result = registerUser(dni, fullName, email, phone, processType, areaReg, career);
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
        if (!historyDni) {
          return createErrorResponse('Parámetro "dni" requerido');
        }
        result = getUserHistory(historyDni);
        break;
      case 'checkAccess':
        const accessDni = e.parameter.dni || '';
        const accessEmail = e.parameter.email || '';
        if (!accessDni) {
          return createErrorResponse('Parámetro "dni" requerido');
        }
        result = checkUserAccess(accessDni, accessEmail);
        break;
      case 'checkBanqueoAccess':
        const banqueoDni = e.parameter.dni || '';
        const banqueoEmail = e.parameter.email || '';
        if (!banqueoDni) {
          return createErrorResponse('Parámetro "dni" requerido');
        }
        result = checkBanqueoAccess(banqueoDni, banqueoEmail);
        break;
      case 'getBanqueoQuestions':
        const courseName = e.parameter.course || '';
        const questionCount = parseInt(e.parameter.count) || 10;
        if (!courseName) {
          return createErrorResponse('Parámetro "course" requerido');
        }
        result = getBanqueoQuestions(courseName, questionCount);
        break;
      // ============================================
      // CEPREUNA ENDPOINTS
      // ============================================
      case 'getCepreQuestions':
        const cepreCourse = e.parameter.course || '';
        const cepreArea = e.parameter.area || '';
        const cepreSemana = e.parameter.semana || '';
        const cepreCount = e.parameter.count ? parseInt(e.parameter.count) : null;
        if (!cepreCourse) {
          return createErrorResponse('Parámetro "course" requerido');
        }
        result = getCepreQuestions(cepreCourse, cepreArea, cepreSemana, cepreCount);
        break;
      case 'getCepreSimulacro':
        const simArea = e.parameter.area || '';
        const simSemana = e.parameter.semana || '';
        if (!simArea) {
          return createErrorResponse('Parámetro "area" requerido');
        }
        result = getCepreSimulacro(simArea, simSemana);
        break;
      case 'getCepreCourses':
        const coursesArea = e.parameter.area || '';
        result = getCepreCourses(coursesArea);
        break;
      case 'getCepreSemanas':
        const semanaCourse = e.parameter.course || '';
        const semanaArea = e.parameter.area || '';
        result = getCepreSemanas(semanaCourse, semanaArea);
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
      case 'test':
        result = { status: 'ok', message: 'API ATOMIC QUIZ funcionando correctamente', timestamp: new Date().toISOString() };
        break;
      default:
        return createErrorResponse('Acción no válida. ATOMIC QUIZ API.');
    }

    return createSuccessResponse(result);

  } catch (error) {
    return createErrorResponse(error.toString());
  }
}

// ============================================
// FUNCIONES DE RESPUESTA
// ============================================
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

/**
 * Inicia sesión de un usuario
 */
function loginUser(username, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Usuarios');
    
    if (!sheet) {
      return { success: false, message: 'Sistema de usuarios no configurado' };
    }
    
    const data = sheet.getDataRange().getValues();
    const userLower = String(username).toLowerCase().trim();
    
    for (let i = 1; i < data.length; i++) {
      const u = String(data[i][0]).toLowerCase().trim();
      const p = String(data[i][1]);
      
      if (u === userLower && p === password) {
        return {
          success: true,
          user: {
            username: data[i][0],
            role: data[i][2] || 'alumno',
            nombre: data[i][3] || ''
          }
        };
      }
    }
    
    return { success: false, message: 'Usuario o contraseña incorrectos' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

/**
 * Registra un alumno y su usuario correspondiente
 */
function registrarAlumnoConUsuario(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 1. Obtener o crear hojas
    let sheetAlumnos = ss.getSheetByName('Alumnos');
    if (!sheetAlumnos) {
      sheetAlumnos = ss.insertSheet('Alumnos');
      sheetAlumnos.appendRow(['nombre', 'apellido', 'carrera', 'area', 'celular', 'dni', 'email', 'username', 'password', 'fecha']);
      sheetAlumnos.getRange(1, 1, 1, 10).setFontWeight('bold');
    }
    
    let sheetUsuarios = ss.getSheetByName('Usuarios');
    if (!sheetUsuarios) {
      sheetUsuarios = ss.insertSheet('Usuarios');
      sheetUsuarios.appendRow(['username', 'password', 'role', 'nombre', 'createdAt', 'active']);
      sheetUsuarios.getRange(1, 1, 1, 6).setFontWeight('bold');
    }
    
    // 2. Verificar si el usuario ya existe
    const userData = sheetUsuarios.getDataRange().getValues();
    const userLower = String(data.username).toLowerCase().trim();
    for (let i = 1; i < userData.length; i++) {
      if (String(userData[i][0]).toLowerCase().trim() === userLower) {
        return { success: false, message: 'El nombre de usuario ya existe' };
      }
    }
    
    // 3. Registrar en Alumnos
    sheetAlumnos.appendRow([
      data.nombre, 
      data.apellido, 
      data.carrera, 
      data.area, 
      data.celular, 
      data.dni, 
      data.email, 
      data.username, 
      data.password, 
      new Date()
    ]);
    
    // 4. Registrar en Usuarios para el login
    sheetUsuarios.appendRow([
      data.username, 
      data.password, 
      'alumno', 
      data.nombre + ' ' + data.apellido, 
      new Date(), 
      true
    ]);
    
    return { success: true, message: 'Registro completado con éxito en ATOMIC QUIZ' };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

// ============================================
// OBTENER CONFIGURACIÓN DE TODAS LAS ÁREAS
// ============================================
function getConfig() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const config = {};

  for (const [areaName, sheetName] of Object.entries(CONFIG_SHEETS)) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Hoja "${sheetName}" no encontrada`);
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const subjects = [];
    let totalQuestions = 0;
    let totalMaxScore = 0;

    // Encontrar índices de columnas
    const colIndices = {
      cod: headers.indexOf('COD.'),
      asignatura: headers.indexOf('ASIGNATURA'),
      puntajePregunta: headers.indexOf('PREGUNTA BIEN CONTESTADA'),
      cantidad: headers.indexOf('CANTIDAD DE PREGUNTAS'),
      ponderacion: headers.indexOf('PONDERACIÓN'),
      puntaje: headers.indexOf('PUNTAJE')
    };

    // Procesar filas de datos (saltar encabezado)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const asignatura = row[colIndices.asignatura];

      // Saltar filas vacías o la fila TOTAL
      if (!asignatura || asignatura === 'TOTAL' || asignatura === '') continue;

      const cantidad = parseInt(row[colIndices.cantidad]) || 0;
      const puntaje = parseFloat(row[colIndices.puntaje]) || 0;

      subjects.push({
        code: row[colIndices.cod],
        name: asignatura,
        pointsPerQuestion: parseFloat(row[colIndices.puntajePregunta]) || 0,
        questionCount: cantidad,
        weight: parseFloat(row[colIndices.ponderacion]) || 0,
        maxScore: puntaje
      });

      totalQuestions += cantidad;
      totalMaxScore += puntaje;
    }

    config[areaName] = {
      name: areaName,
      subjects: subjects,
      totalQuestions: totalQuestions,
      totalMaxScore: totalMaxScore
    };
  }

  return config;
}

// ============================================
// OBTENER PREGUNTAS POR ÁREA (ORDENADAS POR ASIGNATURA)
// ============================================
function getQuestions(areaName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Validar área
  if (!CONFIG_SHEETS[areaName]) {
    throw new Error(`Área "${areaName}" no válida. Use: Ingenierías, Sociales, o Biomédicas`);
  }

  // Obtener configuración del área
  const configSheet = ss.getSheetByName(CONFIG_SHEETS[areaName]);
  if (!configSheet) {
    throw new Error(`Hoja de configuración para "${areaName}" no encontrada`);
  }

  const configData = configSheet.getDataRange().getValues();
  const headers = configData[0];

  const colIndices = {
    asignatura: headers.indexOf('ASIGNATURA'),
    cantidad: headers.indexOf('CANTIDAD DE PREGUNTAS'),
    puntaje: headers.indexOf('PUNTAJE')
  };

  const questions = [];
  let questionNumber = 1; // Numeración global de preguntas

  // Por cada asignatura en la configuración (en orden)
  for (let i = 1; i < configData.length; i++) {
    const row = configData[i];
    const subjectName = row[colIndices.asignatura];
    const questionCount = parseInt(row[colIndices.cantidad]) || 0;
    const maxScore = parseFloat(row[colIndices.puntaje]) || 0;

    // Saltar filas vacías o TOTAL
    if (!subjectName || subjectName === 'TOTAL' || subjectName === '' || questionCount === 0) continue;

    // Obtener preguntas aleatorias de esta asignatura
    const subjectQuestions = getRandomQuestionsFromSubject(ss, subjectName, questionCount, maxScore, questionNumber);
    questions.push(...subjectQuestions);
    questionNumber += subjectQuestions.length;
  }

  return questions;
}

// ============================================
// OBTENER PREGUNTAS ALEATORIAS DE UNA ASIGNATURA
// ============================================
function getRandomQuestionsFromSubject(ss, subjectName, count, maxScore, startingNumber) {
  const sheetName = SUBJECT_SHEETS[subjectName];
  if (!sheetName) return [];

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const colIndices = {
    questionText: headers.indexOf('Question Text'),
    questionType: headers.indexOf('Question Type'),
    option1: headers.indexOf('Option 1'),
    option2: headers.indexOf('Option 2'),
    option3: headers.indexOf('Option 3'),
    option4: headers.indexOf('Option 4'),
    option5: headers.indexOf('Option 5'),
    correctAnswer: headers.indexOf('Correct Answer'),
    imageLink: headers.indexOf('Image Link'),
    justification: headers.indexOf('JUSTIFICACION')
  };

  const allQuestions = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[colIndices.questionText]) {
      allQuestions.push({ rowIndex: i, data: row });
    }
  }

  const selectedQuestions = selectRandomItems(allQuestions, count);
  const pointsPerQuestion = count > 0 ? maxScore / count : 0;

  return selectedQuestions.map((q, index) => {
    const row = q.data;
    const options = [
      row[colIndices.option1], row[colIndices.option2], row[colIndices.option3],
      row[colIndices.option4], row[colIndices.option5]
    ].filter(opt => opt && opt !== '');

    const correctAnswerIndex = (parseInt(row[colIndices.correctAnswer]) || 1) - 1;

    return {
      id: `${subjectName}-${q.rowIndex}`,
      number: startingNumber + index,
      questionText: row[colIndices.questionText],
      options: options,
      correctAnswer: correctAnswerIndex,
      subject: subjectName,
      points: pointsPerQuestion,
      justification: row[colIndices.justification] || null,
      imageLink: row[colIndices.imageLink] || null
    };
  });
}

// ============================================
// REGISTRO DE USUARIOS SIMPLE (MÉTODO register)
// ============================================
function registerUser(dni, fullName, email, phone, processType, area, career) {
  if (!dni) return { registered: false, message: 'DNI requerido' };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('usuarios');

  if (!sheet) {
    sheet = ss.insertSheet('usuarios');
    sheet.appendRow(['Fecha', 'DNI', 'Nombre', 'Email', 'Celular', 'Proceso', 'Área', 'Carrera']);
  }

  sheet.appendRow([new Date(), dni, fullName, email, phone, processType, area, career]);
  return { registered: true, message: 'Usuario registrado correctamente en ATOMIC QUIZ' };
}

// ============================================
// HISTORIAL Y ACCESO
// ============================================
function saveUserScore(dni, score, maxScore, area, correct, total) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('historial_puntajes');
  if (!sheet) {
    sheet = ss.insertSheet('historial_puntajes');
    sheet.appendRow(['DNI', 'Fecha', 'Área', 'Puntaje', 'Puntaje Máx', 'Correctas', 'Total']);
  }
  sheet.appendRow([dni, new Date(), area, score, maxScore, correct, total]);
  return { saved: true };
}

function checkUserAccess(dni, email) {
  return { canAccess: true, isFirstAttempt: true };
}

function checkBanqueoAccess(dni, email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('confirmado');
  if (!sheet) return { canAccess: false, reason: 'No hay usuarios confirmados' };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === dni) return { canAccess: true };
  }
  return { canAccess: false, reason: 'No tienes acceso al Banqueo Histórico de ATOMIC QUIZ' };
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function selectRandomItems(array, count) {
  if (count >= array.length) return shuffleArray(array);
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

// ============================================
// CEPREUNA - FUNCIONES DE BANQUEO Y SIMULACRO
// ============================================
function getCepreQuestions(course, area, semana, count) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheetName = CEPRE_SUBJECT_SHEETS[course];
  if (!sheetName) return { error: 'Curso no válido', questions: [] };
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: `Hoja ${sheetName} no encontrada`, questions: [] };
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIndices = getCepreColumnIndices(headers);
  const filtered = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[colIndices.questionText]) filtered.push({ rowIndex: i, data: row });
  }
  let selected = count ? selectRandomItems(filtered, count) : filtered;
  return {
    questions: selected.map((q, idx) => formatCepreQuestion(q.data, colIndices, course, idx + 1, q.rowIndex))
  };
}

function getCepreSimulacro(area, semana) {
  return { area: area, questions: [] }; // Simplificado para ATOMIC QUIZ
}

function getCepreColumnIndices(headers) {
  return {
    questionText: headers.indexOf('Question Text'),
    option1: headers.indexOf('Option 1'),
    option2: headers.indexOf('Option 2'),
    option3: headers.indexOf('Option 3'),
    option4: headers.indexOf('Option 4'),
    option5: headers.indexOf('Option 5'),
    correctAnswer: headers.indexOf('Correct Answer'),
    imageLink: headers.indexOf('Image Link'),
    justification: headers.indexOf('JUSTIFICACION')
  };
}

function formatCepreQuestion(row, colIndices, course, number, rowIndex) {
  const options = [row[colIndices.option1], row[colIndices.option2], row[colIndices.option3], row[colIndices.option4], row[colIndices.option5]].filter(o => o);
  return {
    id: `cepre-${course}-${rowIndex}`,
    number: number,
    questionText: row[colIndices.questionText],
    options: options,
    correctAnswer: (parseInt(row[colIndices.correctAnswer]) || 1) - 1,
    subject: course,
    justification: row[colIndices.justification] || null
  };
}
