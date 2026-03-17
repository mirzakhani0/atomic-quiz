function doGet(e) {
  var action = e.parameter.action;
  
  if (action === 'login') {
    return handleLogin(e);
  }
  if (action === 'getAlumnos') {
    return handleGetAlumnos();
  }
  if (action === 'getUsuarios') {
    return handleGetUsuarios();
  }
  if (action === 'registrarAlumnoConUsuario') {
    return handleRegistrarAlumno(e);
  }
  if (action === 'createUser') {
    return handleCreateUser(e);
  }
  if (action === 'deleteUsuario') {
    return handleDeleteUsuario(e);
  }
  if (action === 'toggleUser') {
    return handleToggleUser(e);
  }
  
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Atomic Quiz API')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  var action = e.parameter.action;
  
  if (action === 'registrarAlumnoConUsuario') {
    var data = {
      nombre: e.parameter.nombre,
      apellido: e.parameter.apellido,
      carrera: e.parameter.carrera,
      area: e.parameter.area,
      celular: e.parameter.celular,
      dni: e.parameter.dni,
      email: e.parameter.email,
      username: e.parameter.username,
      password: e.parameter.password
    };
    var result = registrarAlumnoConUsuario(data);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'createUser') {
    var data = {
      username: e.parameter.username,
      password: e.parameter.password,
      role: e.parameter.role,
      nombre: e.parameter.nombre
    };
    var result = createUser(data);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Acción no reconocida' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleLogin(e) {
  var username = e.parameter.username;
  var password = e.parameter.password;
  var result = login(username, password);
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleGetAlumnos() {
  var result = getAlumnos();
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleGetUsuarios() {
  var result = getUsuarios();
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleRegistrarAlumno(e) {
  var data = {
    nombre: e.parameter.nombre,
    apellido: e.parameter.apellido,
    carrera: e.parameter.carrera,
    area: e.parameter.area,
    celular: e.parameter.celular,
    dni: e.parameter.dni,
    email: e.parameter.email,
    username: e.parameter.username,
    password: e.parameter.password
  };
  var result = registrarAlumnoConUsuario(data);
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleCreateUser(e) {
  var data = {
    username: e.parameter.username,
    password: e.parameter.password,
    role: e.parameter.role,
    nombre: e.parameter.nombre
  };
  var result = createUser(data);
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleDeleteUsuario(e) {
  var username = e.parameter.username;
  var result = deleteUsuario(username);
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleToggleUser(e) {
  var username = e.parameter.username;
  var active = e.parameter.active === 'true';
  var result = toggleUserActive(username, active);
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
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

function saveAlumno(data) {
  try {
    var sheet = getSheet('Alumnos');
    var headers = ensureHeaders(sheet, 'Alumnos');
    
    var existingData = sheet.getDataRange().getValues();
    var dni = data.dni.toString();
    
    for (var i = 1; i < existingData.length; i++) {
      if (existingData[i][5].toString() === dni) {
        return { success: false, message: 'Este DNI ya está registrado' };
      }
    }
    
    var row = [
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
    ];
    
    sheet.appendRow(row);
    return { success: true, message: 'Alumno registrado exitosamente' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function createUser(data) {
  try {
    var sheet = getSheet('Usuarios');
    var headers = ensureHeaders(sheet, 'Usuarios');
    
    var existingData = sheet.getDataRange().getValues();
    var username = data.username.toLowerCase();
    
    for (var i = 1; i < existingData.length; i++) {
      if (existingData[i][0].toLowerCase() === username) {
        return { success: false, message: 'El username ya existe' };
      }
    }
    
    var row = [
      data.username,
      data.password,
      data.role || 'alumno',
      data.nombre || '',
      new Date()
    ];
    
    sheet.appendRow(row);
    return { success: true, message: 'Usuario creado exitosamente' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function login(username, password) {
  try {
    var sheet = getSheet('Usuarios');
    var dataRange = sheet.getDataRange();
    
    if (dataRange.getLastRow() < 2) {
      return { success: false, message: 'Usuario o contraseña incorrectos' };
    }
    
    var data = dataRange.getValues();
    var userLower = String(username).toLowerCase();
    
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0] || !data[i][1]) continue;
      
      var storedUsername = String(data[i][0]).toLowerCase();
      var storedPassword = String(data[i][1]);
      
      if (storedUsername === userLower && storedPassword === password) {
        var isActive = data[i][5];
        if (isActive !== false && isActive !== 'false' && isActive !== 0 && isActive !== '0') {
          return { 
            success: true, 
            user: {
              username: data[i][0],
              role: data[i][2] || 'alumno',
              nombre: data[i][3] || '',
              active: isActive
            }
          };
        } else {
          return { success: false, message: 'Tu cuenta aún no ha sido activada. Contacta al administrador.' };
        }
      }
    }
    
    return { success: false, message: 'Usuario o contraseña incorrectos' };
  } catch (error) {
    return { success: false, message: error.toString() };
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
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = data[i][j];
      }
      result.push(obj);
    }
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.toString() };
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
      for (var j = 0; j < headers.length; j++) {
        var value = data[i][j];
        obj[headers[j]] = value !== null && value !== undefined ? String(value) : '';
      }
      result.push(obj);
    }
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function deleteUsuario(username) {
  try {
    var sheet = getSheet('Usuarios');
    var data = sheet.getDataRange().getValues();
    var userLower = username.toLowerCase();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toLowerCase() === userLower) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Usuario eliminado' };
      }
    }
    
    return { success: false, message: 'Usuario no encontrado' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function registrarAlumnoConUsuario(data) {
  try {
    var sheetAlumnos = getSheet('Alumnos');
    var sheetUsuarios = getSheet('Usuarios');
    
    ensureHeaders(sheetAlumnos, 'Alumnos');
    ensureHeaders(sheetUsuarios, 'Usuarios');
    
    var existingAlumnos = sheetAlumnos.getDataRange().getValues();
    var dni = data.dni.toString();
    
    for (var i = 1; i < existingAlumnos.length; i++) {
      if (existingAlumnos[i][5].toString() === dni) {
        return { success: false, message: 'Este DNI ya está registrado' };
      }
    }
    
    var existingUsuarios = sheetUsuarios.getDataRange().getValues();
    var username = data.username.toLowerCase();
    
    for (var i = 1; i < existingUsuarios.length; i++) {
      if (existingUsuarios[i][0].toLowerCase() === username) {
        return { success: false, message: 'El username ya existe' };
      }
    }
    
    var rowAlumno = [
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
    ];
    sheetAlumnos.appendRow(rowAlumno);
    
    var rowUsuario = [
      data.username,
      data.password,
      'alumno',
      data.nombre + ' ' + data.apellido,
      new Date(),
      false
    ];
    sheetUsuarios.appendRow(rowUsuario);
    
    return { success: true, message: 'Alumno registrado exitosamente. Espera la activación del administrador.' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function toggleUserActive(username, active) {
  try {
    var sheet = getSheet('Usuarios');
    var data = sheet.getDataRange().getValues();
    var userLower = String(username).toLowerCase();
    
    for (var i = 1; i < data.length; i++) {
      var storedUsername = data[i][0];
      if (storedUsername && String(storedUsername).toLowerCase() === userLower) {
        sheet.getRange(i + 1, 6).setValue(active);
        return { 
          success: true, 
          message: active ? 'Usuario activado' : 'Usuario desactivado' 
        };
      }
    }
    
    return { success: false, message: 'Usuario no encontrado' };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
