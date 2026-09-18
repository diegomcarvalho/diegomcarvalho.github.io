// app.js — WhatsApp Agendado via TickTick (PWA)
// Toda a lógica roda no navegador. O token da API é salvo apenas no localStorage local.

const TICKTICK_API_BASE = 'https://api.ticktick.com/open/v1';

const el = (id) => document.getElementById(id);

const apiTokenInput = el('apiToken');
const projectSelect = el('projectSelect');
const loadProjectsBtn = el('loadProjectsBtn');
const configStatus = el('configStatus');

const contactName = el('contactName');
const contactPhone = el('contactPhone');
const pickContactBtn = el('pickContactBtn');
const contactApiHelp = el('contactApiHelp');
const message = el('message');
const taskDate = el('taskDate');
const taskTime = el('taskTime');
const reminderOffset = el('reminderOffset');
const urlPreview = el('urlPreview');
const createTaskBtn = el('createTaskBtn');
const openNowBtn = el('openNowBtn');
const taskStatus = el('taskStatus');

function showStatus(node, message, type) {
  node.textContent = message;
  node.className = `status show ${type}`;
}

function loadSavedConfig() {
  const savedToken = localStorage.getItem('ticktick_api_token');
  const savedProject = localStorage.getItem('ticktick_project_id');
  if (savedToken) apiTokenInput.value = savedToken;
  if (savedProject) projectSelect.value = savedProject;
}

apiTokenInput.addEventListener('change', () => {
  localStorage.setItem('ticktick_api_token', apiTokenInput.value.trim());
});

projectSelect.addEventListener('change', () => {
  localStorage.setItem('ticktick_project_id', projectSelect.value);
});

function setDefaultDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);
  taskDate.value = now.toISOString().slice(0, 10);
  taskTime.value = now.toTimeString().slice(0, 5);
}

// --- Contact Picker API (Chrome/Android apenas) ---
function initContactPicker() {
  const supported = ('contacts' in navigator) && ('ContactsManager' in window);
  if (!supported) {
    contactApiHelp.textContent =
      'Seleção automática de contatos não é suportada neste navegador. Digite o número manualmente.';
    pickContactBtn.disabled = true;
    pickContactBtn.style.opacity = '0.5';
    return;
  }
  contactApiHelp.textContent = 'Contact Picker disponível neste navegador.';
}

pickContactBtn.addEventListener('click', async () => {
  try {
    const props = ['name', 'tel'];
    const opts = { multiple: false };
    const contacts = await navigator.contacts.select(props, opts);
    if (!contacts.length) return;
    const c = contacts[0];
    if (c.name && c.name.length) contactName.value = c.name[0];
    if (c.tel && c.tel.length) {
      contactPhone.value = normalizePhone(c.tel[0]);
    }
    updateUrlPreview();
  } catch (err) {
    showStatus(taskStatus, `Erro ao acessar contatos: ${err.message}`, 'error');
  }
});

function normalizePhone(raw) {
  let digits = raw.replace(/[^\d+]/g, '');
  digits = digits.replace(/^\+/, '');
  return digits;
}

contactPhone.addEventListener('input', () => {
  contactPhone.value = normalizePhone(contactPhone.value);
});

function buildWhatsAppUrl() {
  const phone = contactPhone.value.trim();
  const text = message.value.trim();
  if (!phone) return '';
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${phone}?text=${encodedText}`;
}

// Escapa colchetes/parênteses do texto visível do link para não quebrar a sintaxe Markdown [texto](url).
function escapeMarkdownLinkText(text) {
  return text.replace(/([\[\]()])/g, '\\$1');
}

// Gera o link em formato Markdown: [texto visível](url). O texto visível é a própria
// mensagem (ou o nome do contato, se preferir); a URL é a do wa.me já codificada.
function buildMarkdownLink(url, linkLabel) {
  if (!url) return '';
  const label = escapeMarkdownLinkText(linkLabel || 'Enviar no WhatsApp');
  return `[${label}](${url})`;
}

function getLinkLabel() {
  const text = message.value.trim();
  // Usa a própria mensagem como texto do link, truncando se for muito longa.
  if (text) {
    return text.length > 60 ? `${text.slice(0, 57)}...` : text;
  }
  return 'Enviar no WhatsApp';
}

function updateUrlPreview() {
  const url = buildWhatsAppUrl();
  if (url) {
    const markdown = buildMarkdownLink(url, getLinkLabel());
    urlPreview.textContent = markdown;
    urlPreview.classList.add('show');
  } else {
    urlPreview.classList.remove('show');
  }
}

[contactPhone, message].forEach((n) => n.addEventListener('input', updateUrlPreview));

openNowBtn.addEventListener('click', () => {
  const url = buildWhatsAppUrl();
  if (!url) {
    showStatus(taskStatus, 'Preencha o número e a mensagem primeiro.', 'error');
    return;
  }
  window.open(url, '_blank');
});

// --- TickTick API ---
async function ticktickFetch(path, options = {}) {
  const token = apiTokenInput.value.trim();
  if (!token) throw new Error('Informe o token da API do TickTick.');
  const resp = await fetch(`${TICKTICK_API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!resp.ok) {
    const bodyText = await resp.text().catch(() => '');
    throw new Error(`HTTP ${resp.status} ${resp.statusText} ${bodyText}`);
  }
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return resp.json();
  }
  return null;
}

loadProjectsBtn.addEventListener('click', async () => {
  showStatus(configStatus, 'Carregando listas...', 'info');
  try {
    const projects = await ticktickFetch('/project');
    projectSelect.innerHTML = '<option value="">Inbox (padrão)</option>';
    (projects || []).forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      projectSelect.appendChild(opt);
    });
    const savedProject = localStorage.getItem('ticktick_project_id');
    if (savedProject) projectSelect.value = savedProject;
    showStatus(configStatus, `${(projects || []).length} listas carregadas.`, 'ok');
  } catch (err) {
    showStatus(configStatus, `Falha ao carregar listas: ${err.message}. Verifique o token e CORS.`, 'error');
  }
});

function toTickTickDate(dateStr, timeStr) {
  const local = new Date(`${dateStr}T${timeStr}:00`);
  return local.toISOString().replace(/\.\d{3}Z$/, '.000+0000');
}

function getTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
}

createTaskBtn.addEventListener('click', async () => {
  const url = buildWhatsAppUrl();
  const name = contactName.value.trim() || 'contato';
  const dateStr = taskDate.value;
  const timeStr = taskTime.value;

  if (!url) {
    showStatus(taskStatus, 'Preencha número e mensagem.', 'error');
    return;
  }
  if (!dateStr || !timeStr) {
    showStatus(taskStatus, 'Escolha data e hora do envio.', 'error');
    return;
  }
  if (!apiTokenInput.value.trim()) {
    showStatus(taskStatus, 'Informe o token da API do TickTick acima.', 'error');
    return;
  }

  const dueDate = toTickTickDate(dateStr, timeStr);
  const projectId = projectSelect.value || undefined;
  const markdownLink = buildMarkdownLink(url, getLinkLabel());

  const task = {
    title: `Enviar WhatsApp para ${name}`,
    content: markdownLink,
    dueDate: dueDate,
    startDate: dueDate,
    timeZone: getTimeZone(),
    reminders: [reminderOffset.value],
    priority: 3,
  };
  if (projectId) task.projectId = projectId;

  showStatus(taskStatus, 'Criando tarefa no TickTick...', 'info');
  try {
    const created = await ticktickFetch('/task', {
      method: 'POST',
      body: JSON.stringify(task),
    });
    showStatus(
      taskStatus,
      `Tarefa criada! Vai notificar em ${dateStr} ${timeStr}. Toque na notificação e depois no link para abrir o WhatsApp.`,
      'ok'
    );
    saveRecentTask({ name, dueDate: `${dateStr} ${timeStr}`, url, markdownLink });
  } catch (err) {
    showStatus(taskStatus, `Erro ao criar tarefa: ${err.message}`, 'error');
  }
});

function saveRecentTask(entry) {
  const key = 'recent_wa_tasks';
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift(entry);
  localStorage.setItem(key, JSON.stringify(list.slice(0, 10)));
}

// --- Service worker registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

// --- init ---
loadSavedConfig();
setDefaultDateTime();
initContactPicker();
