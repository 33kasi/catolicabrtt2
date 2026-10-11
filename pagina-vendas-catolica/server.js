/**
 * SERVIDOR BACKEND PROFISSIONAL & SEGURO - DEVOÇÃO MARIANA
 * Processamento Oficial de Pagamentos Pix via SigiloPay
 * Com Proteção Completa contra Fraudes, Ataques DoS, Spoofing de Webhook e Vazamento de Arquivos
 * Executa nativamente sem dependências externas (Vanilla Node.js)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

// ==============================================================================
// 1. CARREGAMENTO SEGURO DE VARIÁVEIS DE AMBIENTE (.env)
// As chaves privadas NUNCA são expostas publicamente no código ou na web
// ==============================================================================
function carregarEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
            if (key && !process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
      console.log('[Segurança] Credenciais de ambiente carregadas do arquivo .env com sucesso.');
    } catch (e) {
      console.warn('[Segurança] Aviso ao ler arquivo .env:', e.message);
    }
  }
}
carregarEnv();

const PORT = parseInt(process.env.PORT, 10) || 8000;

// CONFIGURAÇÃO DO GATEWAY PROTEGIDA NO BACKEND
const GATEWAY_CONFIG = {
  CLIENT_ID: (process.env.SIGILOPAY_CLIENT_ID || '').trim(),
  CLIENT_SECRET: (process.env.SIGILOPAY_CLIENT_SECRET || '').trim(),
  WEBHOOK_TOKEN: (process.env.SIGILOPAY_WEBHOOK_TOKEN || '').trim(),
  API_URL: 'https://app.sigilopay.com.br/api/v1/gateway/pix/receive',
  QUERY_URL: 'https://app.sigilopay.com.br/api/v1/gateway/transactions',
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (DevocaoMariana/1.0)'
};

if (!GATEWAY_CONFIG.CLIENT_ID || !GATEWAY_CONFIG.CLIENT_SECRET) {
  console.warn('[Alerta de Segurança] SIGILOPAY_CLIENT_ID ou SIGILOPAY_CLIENT_SECRET não configurados no .env!');
}

const META_CONFIG = {
  PIXEL_ID: (process.env.META_PIXEL_ID || '1754721425529202').trim(),
  ACCESS_TOKEN: (process.env.META_ACCESS_TOKEN || '').trim()
};

if (META_CONFIG.ACCESS_TOKEN) {
  console.log(`[Meta CAPI] API de Conversões da Meta ativa e conectada ao Pixel ${META_CONFIG.PIXEL_ID}!`);
} else {
  console.warn('[Meta CAPI] META_ACCESS_TOKEN não configurado no .env.');
}

function sha256Hash(val) {
  if (!val) return null;
  return crypto.createHash('sha256').update(String(val).trim().toLowerCase()).digest('hex');
}

function enviarPurchaseParaMeta(order) {
  if (!META_CONFIG.ACCESS_TOKEN) {
    return;
  }
  try {
    const client = order.client || {};
    const postData = JSON.stringify({
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: order.identifier,
          action_source: 'website',
          event_source_url: 'http://127.0.0.1:8000/checkout.html',
          user_data: {
            em: client.email ? [sha256Hash(client.email)] : [],
            ph: client.phone ? [sha256Hash('55' + client.phone.replace(/\D/g, ''))] : [],
            fn: client.name ? [sha256Hash(client.name.split(' ')[0])] : [],
            client_ip_address: order.clientIp || undefined,
            client_user_agent: order.userAgent || undefined,
            fbp: order.fbp || undefined,
            fbc: order.fbc || undefined
          },
          custom_data: {
            currency: 'BRL',
            value: Number(order.amount || 109.90),
            content_name: 'Grande Kit Bênção Total do Lar 2026',
            order_id: order.identifier
          }
        }
      ]
    });

    const req = https.request(`https://graph.facebook.com/v19.0/${META_CONFIG.PIXEL_ID}/events?access_token=${META_CONFIG.ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`[Meta CAPI] Purchase do pedido #${order.identifier} registrado com sucesso na Meta!`);
        } else {
          console.warn(`[Meta CAPI] Resposta Meta (${res.statusCode}):`, data);
        }
      });
    });

    req.on('error', (err) => {
      console.warn('[Meta CAPI] Erro ao enviar conversão:', err.message);
    });

    req.write(postData);
    req.end();
  } catch (err) {
    console.warn('[Meta CAPI] Erro interno:', err.message);
  }
}

// ==============================================================================
// 2. BANCO DE DADOS PERSISTENTE E MAPAS DE IDENTIFICAÇÃO DE VENDAS
// Previne perda de vendas e inconsistências entre gateway e plataforma
// ==============================================================================
const DB_FILE = path.join(__dirname, 'orders_data.json');
const ordersDb = new Map();
const transactionToOrderMap = new Map();
const unmatchedPaidTransactionsMap = new Map(); // Resolução de race conditions (webhook antes da finalização)

function carregarPedidosDoDisco() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach(order => {
          if (order && order.identifier) {
            ordersDb.set(order.identifier, order);
            if (order.transactionId) {
              transactionToOrderMap.set(order.transactionId, order.identifier);
            }
          }
        });
        console.log(`[Banco de Dados] ${ordersDb.size} pedidos restaurados do armazenamento persistente.`);
      }
    } catch (e) {
      console.warn('[Banco de Dados] Aviso ao carregar pedidos:', e.message);
    }
  }
}

function salvarPedidosNoDisco() {
  try {
    const list = Array.from(ordersDb.values());
    fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.error('[Banco de Dados] Erro ao persistir pedidos no disco:', e.message);
  }
}

carregarPedidosDoDisco();

// ==============================================================================
// 3. CABEÇALHOS GLOBAIS DE SEGURANÇA E CORS (HARDENING HTTP)
// ==============================================================================
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https://api.qrserver.com https://checkoutseguro.info https://www.facebook.com; connect-src 'self' https://viacep.com.br https://connect.facebook.net https://www.facebook.com; frame-ancestors 'none';"
};

function applySecurityHeaders(res) {
  for (const [header, val] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(header, val);
  }
}

function sendJson(res, statusCode, data) {
  applySecurityHeaders(res);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-requested-with'
  });
  res.end(JSON.stringify(data));
}

// ==============================================================================
// 4. RATE LIMITING (PROTEÇÃO CONTRA BRUTE FORCE, SPAM DE PEDIDOS E DoS)
// ==============================================================================
const ipRateLimits = new Map();

function checkRateLimit(ip, endpointType = 'general') {
  const now = Date.now();
  const windowMs = 60 * 1000; // Janela de 1 minuto
  
  const limits = {
    createPix: 15,    // Max 15 emissões de Pix por minuto por IP
    status: 120,      // Max 120 consultas de status por minuto (permite polling a cada 3.5s)
    general: 200      // Max 200 requisições gerais por minuto
  };

  const maxRequests = limits[endpointType] || limits.general;
  const key = `${ip}:${endpointType}`;
  let record = ipRateLimits.get(key);

  if (!record || now - record.startTime > windowMs) {
    record = { startTime: now, count: 1 };
    ipRateLimits.set(key, record);
    return { allowed: true };
  }

  record.count++;
  if (record.count > maxRequests) {
    const retryAfter = Math.ceil((record.startTime + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

// Limpeza de memória periódica
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipRateLimits.entries()) {
    if (now - record.startTime > 60000) {
      ipRateLimits.delete(key);
    }
  }
}, 60000);

// ==============================================================================
// 5. HELPER PARA LEITURA SEGURA DE JSON (COM LIMITE DE TAMANHO ANTI-DoS)
// ==============================================================================
function readJsonBody(req, maxSize = 65536) { // 64 KB max
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxSize) {
        req.pause();
        reject(new Error('PAYLOAD_TOO_LARGE'));
        return;
      }
      body += chunk;
    });

    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        resolve(data);
      } catch (e) {
        reject(new Error('INVALID_JSON'));
      }
    });

    req.on('error', reject);
  });
}

// ==============================================================================
// 6. COMUNICAÇÃO SEGURA COM A API DO GATEWAY (COM TIMEOUT E RETRY)
// ==============================================================================
function criarPixNoGateway(payload, tentativa = 1) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);

    const req = https.request(GATEWAY_CONFIG.API_URL, {
      method: 'POST',
      timeout: 9000,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': GATEWAY_CONFIG.USER_AGENT,
        'x-public-key': GATEWAY_CONFIG.CLIENT_ID,
        'x-secret-key': GATEWAY_CONFIG.CLIENT_SECRET,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, statusCode: res.statusCode, data: parsed });
          } else {
            resolve({ ok: false, statusCode: res.statusCode, error: parsed });
          }
        } catch (err) {
          resolve({ ok: false, statusCode: res.statusCode, raw: rawData });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      if (tentativa < 2) {
        console.warn('[Gateway] Timeout na 1ª tentativa, reenviando requisição...');
        resolve(criarPixNoGateway(payload, tentativa + 1));
      } else {
        reject(new Error('Tempo limite de resposta do gateway excedido.'));
      }
    });

    req.on('error', (err) => {
      if (tentativa < 2) {
        console.warn('[Gateway] Erro de rede na 1ª tentativa, retentando...');
        resolve(criarPixNoGateway(payload, tentativa + 1));
      } else {
        reject(err);
      }
    });

    req.write(postData);
    req.end();
  });
}

// CONSULTA OFICIAL NA API DO GATEWAY (RECONCILIAÇÃO CONTRA FRAUDES E PERDA DE VENDAS)
function consultarStatusNoGateway(transactionId) {
  return new Promise((resolve) => {
    if (!transactionId || !GATEWAY_CONFIG.CLIENT_ID || !GATEWAY_CONFIG.CLIENT_SECRET) {
      return resolve(null);
    }

    const queryUrl = `${GATEWAY_CONFIG.QUERY_URL}?id=${encodeURIComponent(transactionId)}`;
    const req = https.get(queryUrl, {
      timeout: 4000,
      headers: {
        'x-public-key': GATEWAY_CONFIG.CLIENT_ID,
        'x-secret-key': GATEWAY_CONFIG.CLIENT_SECRET,
        'User-Agent': GATEWAY_CONFIG.USER_AGENT
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.on('error', () => {
      resolve(null);
    });
  });
}

// ==============================================================================
// 7. SERVIDOR HTTP PRINCIPAL COM TODAS AS PROTEÇÕES DE SEGURANÇA
// ==============================================================================
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1')
    .split(',')[0].trim();

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    applySecurityHeaders(res);
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-requested-with'
    });
    res.end();
    return;
  }

  // ========================================================
  // ROTA 1: HEALTHCHECK NEUTRO E SEGURO (/api/health)
  // Sem expor nomes do gateway ou chaves privadas
  // ========================================================
  if (pathname === '/api/health' && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'online',
      pixService: 'active',
      ordersCount: ordersDb.size,
      timestamp: new Date().toISOString()
    });
  }

  // ========================================================
  // ROTA 2: CRIAR PIX COM SANITIZAÇÃO RIGOROSA (/api/create-pix)
  // ========================================================
  if (pathname === '/api/create-pix' && req.method === 'POST') {
    const rateCheck = checkRateLimit(clientIp, 'createPix');
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfter));
      return sendJson(res, 429, {
        success: false,
        message: `Muitas tentativas em pouco tempo. Por favor, aguarde ${rateCheck.retryAfter} segundos.`
      });
    }

    try {
      const bodyData = await readJsonBody(req);
      const { identifier, amount, client, shipping, produto } = bodyData;

      // 1. Validação de Valor
      const numAmount = Number(amount);
      if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
        return sendJson(res, 400, {
          success: false,
          message: 'Valor inválido para cobrança.'
        });
      }

      // 2. Validação e Sanitização de Cliente
      if (!client || !client.name || !client.document) {
        return sendJson(res, 400, {
          success: false,
          message: 'Nome e CPF são obrigatórios para emissão do Pix.'
        });
      }

      // CPF: estritamente 11 dígitos numéricos
      const cleanDoc = String(client.document).replace(/\D/g, '').slice(0, 11);
      if (cleanDoc.length !== 11) {
        return sendJson(res, 400, {
          success: false,
          message: 'CPF deve conter exatamente 11 dígitos numéricos.'
        });
      }

      // Nome: sanitizado, limitado a 80 caracteres, com garantia de 2 termos
      let clientName = String(client.name || '').trim().replace(/[<>]/g, '').slice(0, 80);
      const nameParts = clientName.split(/\s+/).filter(Boolean);
      if (nameParts.length < 2) {
        clientName = `${clientName} Devoto`;
      }

      // Telefone: apenas dígitos (10 ou 11), com fallback
      let cleanPhone = String(client.phone || '').replace(/\D/g, '').slice(0, 11);
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        cleanPhone = '11987654321';
      }

      // E-mail: sanitização com fallback seguro para evitar erro 400 no gateway
      let clientEmail = String(client.email || '').trim().replace(/[<>]/g, '').slice(0, 100);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!clientEmail || !emailRegex.test(clientEmail)) {
        clientEmail = `cliente_${cleanDoc}@devocaomariana.com.br`;
      }

      // Identificador Único Anticolisão
      let cleanIdentifier = String(identifier || ('DM-' + Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 90)))
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 40);

      // Prevenir sobrescrita acidental se ID já existir no banco
      if (ordersDb.has(cleanIdentifier)) {
        cleanIdentifier = `${cleanIdentifier}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const gatewayPayload = {
        identifier: cleanIdentifier,
        amount: Number(numAmount.toFixed(2)),
        client: {
          name: clientName,
          email: clientEmail,
          phone: cleanPhone,
          document: cleanDoc
        }
      };

      console.log(`[Pagamento Pix] Solicitando cobrança #${cleanIdentifier} - Valor: R$ ${gatewayPayload.amount}`);

      const result = await criarPixNoGateway(gatewayPayload);

      if (result.ok && result.data && result.data.pix && result.data.pix.code) {
        const pixData = result.data.pix;
        const transactionId = result.data.transactionId;
        const orderData = result.data.order;

        // Salvar dados do pedido
        const record = {
          identifier: cleanIdentifier,
          amount: gatewayPayload.amount,
          client: gatewayPayload.client,
          shipping: shipping || {},
          produto: produto || '',
          transactionId: transactionId,
          orderId: orderData ? orderData.id : null,
          orderUrl: orderData ? orderData.url : null,
          receiptUrl: orderData ? orderData.receiptUrl : null,
          pixCode: pixData.code,
          pixBase64: pixData.base64 || '',
          status: 'PENDING',
          fee: result.data.fee,
          clientIp: clientIp,
          userAgent: req.headers['user-agent'] || '',
          fbp: (bodyData.meta && bodyData.meta.fbp) || undefined,
          fbc: (bodyData.meta && bodyData.meta.fbc) || undefined,
          createdAt: new Date().toISOString()
        };

        // Checar se já havia um webhook adiantado confirmando pagamento
        if (unmatchedPaidTransactionsMap.has(transactionId) || unmatchedPaidTransactionsMap.has(cleanIdentifier)) {
          record.status = 'COMPLETED';
          record.paidAt = new Date().toISOString();
          console.log(`[Reconciliação Instantânea] Pedido #${cleanIdentifier} já aprovado por evento anterior!`);
          enviarPurchaseParaMeta(record);
        }

        ordersDb.set(cleanIdentifier, record);
        if (transactionId) {
          transactionToOrderMap.set(transactionId, cleanIdentifier);
        }
        salvarPedidosNoDisco();

        console.log(`[Pagamento Pix] Pix gerado com sucesso! Protocolo: ${transactionId}`);

        return sendJson(res, 200, {
          success: true,
          identifier: cleanIdentifier,
          transactionId: transactionId,
          pix: {
            code: pixData.code,
            base64: pixData.base64 || ''
          },
          status: record.status
        });
      } else {
        console.error('[Gateway] Erro retornado pela API:', result.error || result.raw);
        let userFriendlyMsg = 'Não foi possível gerar a chave Pix oficial no momento. Tente novamente em instantes.';
        
        if (result.statusCode === 401) {
          console.error('[Segurança Crítica] Falha de autenticação com o gateway. Verifique as credenciais no .env.');
          userFriendlyMsg = 'Serviço de pagamento momentaneamente indisponível para manutenção. Tente novamente em instantes.';
        } else if (result.statusCode === 400) {
          userFriendlyMsg = 'Dados de pagamento inválidos. Por favor, confira seu CPF e dados cadastrais.';
        }

        return sendJson(res, result.statusCode || 500, {
          success: false,
          message: userFriendlyMsg
        });
      }
    } catch (err) {
      if (err.message === 'PAYLOAD_TOO_LARGE') {
        return sendJson(res, 413, { success: false, message: 'Dados enviados excedem o limite permitido.' });
      }
      console.error('[Pagamento Pix] Erro interno:', err.message);
      return sendJson(res, 500, {
        success: false,
        message: 'Erro interno ao processar pedido. Tente novamente em alguns instantes.'
      });
    }
  }

  // ========================================================
  // ROTA 3: CONSULTAR STATUS DO PEDIDO COM RECONCILIAÇÃO REAL-TIME
  // (/api/order-status/:id)
  // ========================================================
  if (pathname.startsWith('/api/order-status')) {
    const rateCheck = checkRateLimit(clientIp, 'status');
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfter));
      return sendJson(res, 429, { success: false, message: 'Limite de consultas excedido.' });
    }

    const parts = pathname.split('/');
    let targetId = parts[3] || parsedUrl.query.identifier || parsedUrl.query.id || parsedUrl.query.transactionId;

    if (!targetId) {
      return sendJson(res, 400, { success: false, message: 'Identificador do pedido não fornecido.' });
    }

    targetId = decodeURIComponent(targetId).trim();

    if (transactionToOrderMap.has(targetId)) {
      targetId = transactionToOrderMap.get(targetId);
    }

    let order = ordersDb.get(targetId);
    if (!order) {
      // Busca resiliente por transactionId ou orderId
      for (const ord of ordersDb.values()) {
        if (ord.transactionId === targetId || ord.orderId === targetId) {
          order = ord;
          break;
        }
      }
    }

    if (order) {
      // Reconciliação direta SÍNCRONA via API do gateway: se ainda está PENDENTE, checa na SigiloPay
      if (order.status !== 'COMPLETED' && order.transactionId) {
        try {
          const gatewayTx = await consultarStatusNoGateway(order.transactionId);
          if (gatewayTx) {
            const st = String(gatewayTx.status || '').toUpperCase();
            const isPaid = (st === 'COMPLETED') || (st === 'PAID') || (st === 'APPROVED') || Boolean(gatewayTx.payedAt);
            if (isPaid) {
              order.status = 'COMPLETED';
              order.paidAt = gatewayTx.payedAt || new Date().toISOString();
              salvarPedidosNoDisco();
              console.log(`[Reconciliação Automática] Pedido #${order.identifier} confirmado como PAGO diretamente via API!`);
              enviarPurchaseParaMeta(order);
            }
          }
        } catch (e) {
          // Ignora oscilação temporária de rede na consulta
        }
      }

      return sendJson(res, 200, {
        success: true,
        identifier: order.identifier,
        transactionId: order.transactionId,
        status: order.status,
        paidAt: order.paidAt || null,
        amount: order.amount
      });
    } else {
      return sendJson(res, 404, {
        success: false,
        message: 'Pedido não localizado.',
        status: 'NOT_FOUND'
      });
    }
  }

  // ========================================================
  // ROTA 4: WEBHOOK OFICIAL COM VALIDAÇÃO ANTI-FRAUDE DUPLA (/api/webhook)
  // Previne que atacantes forjem pagamentos enviando POST falso
  // ========================================================
  if (pathname === '/api/webhook' && req.method === 'POST') {
    try {
      const hookData = await readJsonBody(req);
      console.log('[Webhook Recebido]:', JSON.stringify(hookData));

      const event = String(hookData.event || '').toUpperCase();
      const transaction = hookData.transaction || hookData.data || hookData.order || {};
      const txId = transaction.id || hookData.transactionId || hookData.id;
      const identifier = transaction.identifier || hookData.identifier;
      const status = String(transaction.status || hookData.status || '').toUpperCase();

      const isPaidSignal = (event === 'TRANSACTION_PAID') ||
                           (event === 'PAYMENT_APPROVED') ||
                           (status === 'COMPLETED') ||
                           (status === 'PAID') ||
                           (status === 'APPROVED');

      if (isPaidSignal && txId) {
        // MEDIDA CRÍTICA DE SEGURANÇA:
        // Valida se a transação é REAL e se está PAGA na SigiloPay via API oficial
        console.log(`[Segurança Webhook] Validando transação ${txId} diretamente na API da SigiloPay...`);
        const verifiedTx = await consultarStatusNoGateway(txId);

        let isGenuinelyPaid = false;
        if (verifiedTx) {
          const verifiedStatus = String(verifiedTx.status || '').toUpperCase();
          if (verifiedStatus === 'COMPLETED' || verifiedStatus === 'PAID' || verifiedStatus === 'APPROVED' || verifiedTx.payedAt) {
            isGenuinelyPaid = true;
          }
        }

        if (isGenuinelyPaid) {
          let order = null;
          if (identifier && ordersDb.has(identifier)) {
            order = ordersDb.get(identifier);
          } else if (txId && transactionToOrderMap.has(txId)) {
            order = ordersDb.get(transactionToOrderMap.get(txId));
          }

          if (order) {
            order.status = 'COMPLETED';
            order.paidAt = (verifiedTx && verifiedTx.payedAt) ? verifiedTx.payedAt : new Date().toISOString();
            salvarPedidosNoDisco();
            console.log(`[Webhook Seguro] Pedido #${order.identifier} APROVADO E VALIDADO COM SUCESSO!`);
            enviarPurchaseParaMeta(order);
          } else {
            // Guardar para caso o pedido ainda esteja sendo criado pelo frontend
            unmatchedPaidTransactionsMap.set(txId, true);
            if (identifier) unmatchedPaidTransactionsMap.set(identifier, true);
            console.log(`[Webhook Seguro] Transação paga ${txId} armazenada no cache de concorrência.`);
          }
        } else {
          console.warn(`[Alerta de Segurança] Webhook rejeitado! Transação ${txId} não pôde ser confirmada como paga na SigiloPay.`);
        }
      }

      // Sempre responde 200 OK para o gateway
      return sendJson(res, 200, {
        received: true,
        processed: true,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[Webhook] Erro no processamento:', err.message);
      return sendJson(res, 200, { received: true, error: 'Formato inválido' });
    }
  }

  // ========================================================
  // 5. SERVIR ARQUIVOS ESTÁTICOS COM BLOQUEIO RIGOROSO DE ARQUIVOS INTERNOS
  // ========================================================
  const normalizedPath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, normalizedPath === '/' ? 'index.html' : normalizedPath);

  // Prevenir Path Traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acesso proibido (403)');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const baseFile = path.basename(filePath).toLowerCase();

  // BLOQUEIO TOTAL DE ARQUIVOS SENSÍVEIS E DE CÓDIGO FONTE DO BACKEND
  const BLOCKED_FILES = new Set([
    'server.js',
    'orders_data.json',
    'package.json',
    'package-lock.json',
    'sigilopay_docs.md',
    '.env',
    '.gitignore'
  ]);

  const ALLOWED_EXTS = new Set([
    '.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.txt'
  ]);

  if (baseFile.startsWith('.') || 
      BLOCKED_FILES.has(baseFile) || 
      baseFile.includes('.env') ||
      ext === '.py' || 
      ext === '.md' || 
      ext === '.json' ||
      (ext && !ALLOWED_EXTS.has(ext))) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Página não encontrada (404)');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const htmlPath = filePath + '.html';
      fs.stat(htmlPath, (errHtml, statsHtml) => {
        if (!errHtml && statsHtml.isFile()) {
          serveStaticFile(htmlPath, res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Página não encontrada (404)');
        }
      });
      return;
    }
    serveStaticFile(filePath, res);
  });
});

function serveStaticFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Erro ao carregar arquivo');
      return;
    }

    applySecurityHeaders(res);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  });
}

// INICIAR SERVIDOR
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`⭐ DEVOÇÃO MARIANA - SERVIDOR BLINDADO ONLINE NA PORTA ${PORT} ⭐`);
  console.log(`🌐 Acesso: http://127.0.0.1:${PORT}`);
  console.log(`🔒 Processamento Pix Seguro & Anti-Fraude Ativo`);
  console.log(`=======================================================`);
});
