// ============================================================
// QuieroMiParcela — Google Apps Script Backend
// Deploy: Extensions > Apps Script > Deploy > Web App
//   Execute as: Me | Who has access: Anyone
// ============================================================

const SPREADSHEET_ID = '10e1poh1J3NAUnadaiccTwcNKo5htSW4Vz0m6RU_FTx0';

// Sheet names
const SHEET_CONFIG   = 'Config';
const SHEET_EBOOKS   = 'Ebooks';
const SHEET_PARCELAS = 'Parcelas';
const SHEET_PEDIDOS  = 'Pedidos';

// Flow.cl credentials — store in Project Settings > Script Properties
function getFlowApiKey()    { return PropertiesService.getScriptProperties().getProperty('FLOW_API_KEY'); }
function getFlowSecretKey() { return PropertiesService.getScriptProperties().getProperty('FLOW_SECRET_KEY'); }
function getFlowApiUrl()    { return PropertiesService.getScriptProperties().getProperty('FLOW_API_URL') || 'https://sandbox.flow.cl/api'; }

// ============================================================
// HTTP Router
// ============================================================

function doGet(e) {
  const action = e.parameter.action;
  try {
    switch (action) {
      case 'getConfig':   return jsonResponse(getConfig());
      case 'getEbooks':   return jsonResponse(getEbooks());
      case 'getParcelas': return jsonResponse(getParcelas());
      default:            return jsonResponse({ error: 'Unknown action' }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

function doPost(e) {
  const action = e.parameter.action;
  let body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (_) {}

  try {
    switch (action) {
      case 'createOrder':  return jsonResponse(createOrder(body));
      case 'flowWebhook':  return jsonResponse(handleFlowWebhook(e.parameter));
      default:             return jsonResponse({ error: 'Unknown action' }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// ============================================================
// Helpers
// ============================================================

function jsonResponse(data, code) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim());
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

// ============================================================
// GET: Config
// ============================================================

function getConfig() {
  const sheet = getSheet(SHEET_CONFIG);
  const data  = sheet.getDataRange().getValues();
  const config = {};
  data.forEach(row => {
    if (row[0]) config[String(row[0]).trim()] = row[1];
  });
  return config;
}

// ============================================================
// GET: Ebooks
// ============================================================

function getEbooks() {
  const rows = sheetToObjects(getSheet(SHEET_EBOOKS));
  return rows
    .filter(r => String(r.activo).toUpperCase() === 'TRUE')
    .map(r => ({
      id:              String(r.id),
      titulo:          r.titulo,
      descripcion:     r.descripcion,
      precio:          Number(r.precio),
      participaciones: Number(r.participaciones),
      imagen_url:      r.imagen_url,
      best_seller:     String(r.best_seller).toUpperCase() === 'TRUE',
    }));
}

// ============================================================
// GET: Parcelas
// ============================================================

function getParcelas() {
  const rows = sheetToObjects(getSheet(SHEET_PARCELAS));
  return rows.map(r => ({
    id:          String(r.id),
    nombre:      r.nombre,
    proyecto:    r.proyecto,
    ubicacion:   r.ubicacion,
    metraje:     r.metraje,
    precio:      r.precio,
    estado:      String(r.estado).toLowerCase(), // 'disponible' | 'bloqueada'
    imagen_url:  r.imagen_url,
    ver_mas_url: r.ver_mas_url,
  }));
}

// ============================================================
// POST: Create Order → Flow.cl
// ============================================================

function createOrder(body) {
  const { nombre, email, telefono, items } = body;

  if (!nombre || !email || !items || !items.length) {
    throw new Error('Datos incompletos');
  }

  // Calculate totals
  let total   = 0;
  let tickets = 0;
  items.forEach(item => {
    total   += item.precio * item.qty;
    tickets += item.participaciones * item.qty;
  });

  const orderId  = 'ORD-' + Date.now();
  const timestamp = new Date().toISOString();

  // Save to Pedidos sheet (status: pending)
  const sheet = getSheet(SHEET_PEDIDOS);
  sheet.appendRow([
    timestamp,
    nombre,
    email,
    telefono || '',
    JSON.stringify(items),
    total,
    tickets,
    'pending',
    orderId,
  ]);

  // Create Flow.cl payment
  const flowUrl = createFlowPayment(orderId, total, email, nombre);

  return { success: true, flowUrl, orderId, total, tickets };
}

// ============================================================
// Flow.cl — Create Payment
// ============================================================

function createFlowPayment(orderId, amount, email, name) {
  const apiKey    = getFlowApiKey();
  const secretKey = getFlowSecretKey();
  const apiUrl    = getFlowApiUrl();

  // Build the Web App URL for callbacks (replace with your deployed GAS URL)
  const gasUrl = ScriptApp.getService().getUrl();

  const params = {
    apiKey:          apiKey,
    commerceOrder:   orderId,
    subject:         'Compra e-book QuieroMiParcela',
    currency:        'CLP',
    amount:          String(amount),
    email:           email,
    urlConfirmation: gasUrl + '?action=flowWebhook',
    urlReturn:       PropertiesService.getScriptProperties().getProperty('SITE_URL') + '/checkout-success.html',
    paymentMethod:   9, // All methods
  };

  // Sign params alphabetically
  const sign = signParams(params, secretKey);
  params.s   = sign;

  // POST to Flow
  const formData = Object.keys(params)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
    .join('&');

  const response = UrlFetchApp.fetch(apiUrl + '/payment/create', {
    method:  'post',
    payload: formData,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    muteHttpExceptions: true,
  });

  const result = JSON.parse(response.getContentText());

  if (!result.url || !result.token) {
    throw new Error('Flow error: ' + JSON.stringify(result));
  }

  return result.url + '?token=' + result.token;
}

// ============================================================
// Flow.cl — Webhook Confirmation
// ============================================================

function handleFlowWebhook(params) {
  const token     = params.token;
  const apiKey    = getFlowApiKey();
  const secretKey = getFlowSecretKey();
  const apiUrl    = getFlowApiUrl();

  // Verify payment status with Flow
  const queryParams = { apiKey, token };
  const sign        = signParams(queryParams, secretKey);
  queryParams.s     = sign;

  const qs = Object.keys(queryParams)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(queryParams[k]))
    .join('&');

  const response = UrlFetchApp.fetch(apiUrl + '/payment/getStatus?' + qs, {
    muteHttpExceptions: true,
  });

  const result = JSON.parse(response.getContentText());

  // status 2 = paid in Flow
  if (result.status === 2) {
    const orderId = result.commerceOrder;
    updateOrderStatus(orderId, 'paid');
    incrementProgress();
  }

  return { received: true };
}

// ============================================================
// HMAC-SHA256 Signature for Flow
// ============================================================

function signParams(params, secretKey) {
  const keys   = Object.keys(params).sort();
  const concat = keys.map(k => k + params[k]).join('');
  const mac    = Utilities.computeHmacSha256Signature(concat, secretKey);
  return mac.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

// ============================================================
// Update Order Status
// ============================================================

function updateOrderStatus(orderId, status) {
  const sheet = getSheet(SHEET_PEDIDOS);
  const data  = sheet.getDataRange().getValues();
  // orderId is in column 9 (index 8)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][8]) === orderId) {
      sheet.getRange(i + 1, 8).setValue(status); // column 8 = payment_status
      break;
    }
  }
}

// ============================================================
// Increment progress_current in Config sheet
// ============================================================

function incrementProgress() {
  const sheet = getSheet(SHEET_CONFIG);
  const data  = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === 'progress_current') {
      const current = Number(data[i][1]) || 0;
      sheet.getRange(i + 1, 2).setValue(current + 1);
      break;
    }
  }
}
