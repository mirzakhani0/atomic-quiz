function doGet(e) {
  var action = e.parameter.action;
  
  if (action === 'login') return handleLogin(e);
  if (action === 'getAlumnos') return handleGetAlumnos();
  if (action === 'getUsuarios') return handleGetUsuarios();
  if (action === 'registrarAlumnoConUsuario') return handleRegistrarAlumno(e);
  if (action === 'createUser') return handleCreateUser(e);
  if (action === 'deleteUsuario') return handleDeleteUsuario(e);
  if (action === 'toggleUser') return handleToggleUser(e);
  
  return HtmlService.createHtmlOutput('OK');
}

function doPost(e) {
  var action = e.parameter.action;
  
  if (action === 'registrarAlumnoConUsuario') {
    var result = registrarAlumnoConUsuario({
      nombre: e.parameter.nombre,
      apellido: e.parameter.apellido,
      carrera: e.parameter.carrera,
      area: e.parameter.area,
      celular: e.parameter.celular,
      dni: e.parameter.dni,
      email: e.parameter.email,
      username: e.parameter.username,
      password: e.parameter.password
    });
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({success:false,message:'Acción no reconocida'})).setMimeType(ContentService.MimeType.JSON);
}

function handleLogin(e) {
  var result = login(e.parameter.username, e.parameter.password);
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function handleGetAlumnos() {
  var result = getAlumnos();
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function handleGetUsuarios() {
  var result = getUsuarios();
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function handleRegistrarAlumno(e) {
  var result = registrarAlumnoConUsuario({
    nombre: e.parameter.nombre,
    apellido: e.parameter.apellido,
    carrera: e.parameter.carrera,
    area: e.parameter.area,
    celular: e.parameter.celular,
    dni: e.parameter.dni,
    email: e.parameter.email,
    username: e.parameter.username,
    password: e.parameter.password
  });
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function handleCreateUser(e) {
  var result = createUser({
    username: e.parameter.username,
    password: e.parameter.password,
    role: e.parameter.role,
    nombre: e.parameter.nombre
  });
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function handleDeleteUsuario(e) {
  var result = deleteUsuario(e.parameter.username);
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function handleToggleUser(e) {
  var result = toggleUserActive(e.parameter.username, e.parameter.active === 'true');
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  return sheet;
}

function getHeaders(sheetName) {
  var headers = {
    'Alumnos': ['nombre', 'apellido', 'carrera', 'area', 'celular', 'dni', 'email', 'username', 'password', 'fecha'],
    'Usuarios': ['username', 'password', 'role', 'nombre', 'createdAt', 'active']
  };
  return headers[sheetName] || [];
}

function ensureHeaders(sheet, sheetName) {
  var headers = getHeaders(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return headers;
}

function toStr(val) {
  return val !== null && val !== undefined ? String(val) : '';
}

function login(username, password) {
  try {
    var sheet = getSheet('Usuarios');
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return {success: false, message: 'Usuario o contraseña incorrectos'};
    
    var userLower = toStr(username).toLowerCase();
    
    for (var i = 1; i < data.length; i++) {
      var u = toStr(data[i][0]).toLowerCase();
      var p = toStr(data[i][1]);
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
    return {success: false, message: 'Usuario o contraseña incorrectos'};
  } catch (e) {
    return {success: false, message: e.toString()};
  }
}

function getAlumnos() {
  try {
    var sheet = getSheet('Alumnos');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) obj[headers[j]] = toStr(data[i][j]);
      result.push(obj);
    }
    return {success: true, data: result};
  } catch (e) {
    return {success: false, message: e.toString()};
  }
}

function getUsuarios() {
  try {
    var sheet = getSheet('Usuarios');
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) obj[headers[j]] = toStr(data[i][j]);
      result.push(obj);
    }
    return {success: true, data: result};
  } catch (e) {
    return {success: false, message: e.toString()};
  }
}

function createUser(data) {
  try {
    var sheet = getSheet('Usuarios');
    ensureHeaders(sheet, 'Usuarios');
    sheet.appendRow([data.username, data.password, data.role || 'alumno', data.nombre || '', new Date(), true]);
    return {success: true, message: 'Usuario creado'};
  } catch (e) {
    return {success: false, message: e.toString()};
  }
}

function deleteUsuario(username) {
  try {
    var sheet = getSheet('Usuarios');
    var data = sheet.getDataRange().getValues();
    var userLower = toStr(username).toLowerCase();
    for (var i = 1; i < data.length; i++) {
      if (toStr(data[i][0]).toLowerCase() === userLower) {
        sheet.deleteRow(i + 1);
        return {success: true, message: 'Usuario eliminado'};
      }
    }
    return {success: false, message: 'Usuario no encontrado'};
  } catch (e) {
    return {success: false, message: e.toString()};
  }
}

function toggleUserActive(username, active) {
  try {
    var sheet = getSheet('Usuarios');
    var data = sheet.getDataRange().getValues();
    var userLower = toStr(username).toLowerCase();
    for (var i = 1; i < data.length; i++) {
      if (toStr(data[i][0]).toLowerCase() === userLower) {
        sheet.getRange(i + 1, 6).setValue(active);
        return {success: true, message: active ? 'Usuario activado' : 'Usuario desactivado'};
      }
    }
    return {success: false, message: 'Usuario no encontrado'};
  } catch (e) {
    return {success: false, message: e.toString()};
  }
}

function registrarAlumnoConUsuario(data) {
  try {
    var sheetAlumnos = getSheet('Alumnos');
    var sheetUsuarios = getSheet('Usuarios');
    
    ensureHeaders(sheetAlumnos, 'Alumnos');
    ensureHeaders(sheetUsuarios, 'Usuarios');
    
    sheetAlumnos.appendRow([data.nombre, data.apellido, data.carrera, data.area, data.celular, data.dni, data.email, data.username, data.password, new Date()]);
    sheetUsuarios.appendRow([data.username, data.password, 'alumno', data.nombre + ' ' + data.apellido, new Date(), true]);
    
    return {success: true, message: 'Alumno registrado exitosamente'};
  } catch (e) {
    return {success: false, message: e.toString()};
  }
}
