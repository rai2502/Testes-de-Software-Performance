/* ============ Nova Bank — demo funcional ============ */
const money = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const parseValue = s => {
  const n = parseFloat(String(s).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
};
const $ = s => document.querySelector(s);
const now = () => new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const state = {
  balance: 8452.37,
  hidden: false,
  filter: 'all',
  search: '',
  tx: [
    { d: 'Salário — Tech Nova LTDA', c: 'Depósito', v: 6200, t: 'in', dt: '01 ago, 08:12' },
    { d: 'PIX recebido — Marcos L.', c: 'PIX', v: 350, t: 'in', dt: '02 ago, 11:45' },
    { d: 'Supermercado Bonjour', c: 'Cartão de débito', v: -287.9, t: 'out', dt: '02 ago, 19:03' },
    { d: 'Netflix', c: 'Assinatura', v: -55.9, t: 'out', dt: '03 ago, 06:00' },
    { d: 'PIX enviado — Juliana R.', c: 'PIX', v: -120, t: 'out', dt: '03 ago, 13:22' },
    { d: 'Uber', c: 'Cartão de crédito', v: -34.5, t: 'out', dt: '03 ago, 22:41' },
    { d: 'Rendimento da conta', c: 'CDI 100%', v: 41.28, t: 'in', dt: '04 ago, 00:05' },
    { d: 'Farmácia São Lucas', c: 'Cartão de débito', v: -78.4, t: 'out', dt: '04 ago, 10:18' },
  ],
  contacts: [
    { n: 'Marcos L.', k: 'marcos@email.com' },
    { n: 'Juliana R.', k: '+55 11 98888-2211' },
    { n: 'Pedro A.', k: '987.654.321-00' },
    { n: 'Bia F.', k: 'bia.f@email.com' },
  ],
};

/* ---------- feedback helpers ---------- */
function toast(msg, kind = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3200);
}
function loading(text, ms) {
  $('#loaderText').textContent = text;
  $('#loader').hidden = false;
  return new Promise(r => setTimeout(() => { $('#loader').hidden = true; r(); }, ms));
}
function success(title, text) {
  $('#modalTitle').textContent = title;
  $('#modalText').textContent = text;
  $('#modal').hidden = false;
}
$('#modalClose').addEventListener('click', () => ($('#modal').hidden = true));
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') $('#modal').hidden = true; });

/* ---------- login ---------- */
$('#togglePass').addEventListener('click', () => {
  const i = $('#senha');
  i.type = i.type === 'password' ? 'text' : 'password';
  $('#togglePass').textContent = i.type === 'password' ? 'ver' : 'ocultar';
});
$('#esqueci').addEventListener('click', () => toast('Enviamos um link de recuperação para seu e-mail.'));

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const cpf = $('#cpf').value.replace(/\D/g, '');
  const senha = $('#senha').value.trim();
  const err = $('#loginError');
  err.textContent = '';
  if (cpf.length !== 11) return (err.textContent = 'Informe um CPF válido (11 dígitos).');
  if (!senha) return (err.textContent = 'Informe sua senha.');
  await loading('Validando suas credenciais…', 1400);
  if (cpf !== '12345678900' || senha !== '1234') {
    err.textContent = 'CPF ou senha incorretos. Use os dados de demonstração.';
    return toast('Falha na autenticação.', 'err');
  }
  $('#loginScreen').hidden = true;
  $('#app').hidden = false;
  const h = new Date().getHours();
  $('#greeting').textContent = h < 12 ? 'Bom dia,' : h < 18 ? 'Boa tarde,' : 'Boa noite,';
  await loading('Sincronizando sua conta…', 900);
  render();
  toast('Bem-vinda de volta, Ana!');
});

$('#logout').addEventListener('click', async () => {
  await loading('Encerrando sessão com segurança…', 800);
  $('#app').hidden = true;
  $('#loginScreen').hidden = false;
  $('#loginError').textContent = '';
  toast('Sessão encerrada.');
});

/* ---------- navegação ---------- */
function go(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === `view-${view}`));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-view]');
  if (t) go(t.dataset.view);
});

/* ---------- render ---------- */
function txRow(t) {
  const li = document.createElement('li');
  li.className = 'tx';
  li.innerHTML = `
    <div class="tx-ic ${t.t}">${t.t === 'in' ? '↓' : '↑'}</div>
    <div class="tx-info"><b>${t.d}</b><span>${t.c} · ${t.dt}</span></div>
    <div class="tx-val ${t.t}">${t.t === 'in' ? '+' : '-'} ${money(Math.abs(t.v))}</div>`;
  return li;
}
function render() {
  $('#balanceValue').textContent = state.hidden ? '•••••••' : money(state.balance);

  const list = [...state.tx].reverse();
  const home = $('#homeTx');
  home.innerHTML = '';
  list.slice(0, 5).forEach(t => home.appendChild(txRow(t)));

  const filtered = list.filter(t =>
    (state.filter === 'all' || t.t === state.filter) &&
    t.d.toLowerCase().includes(state.search.toLowerCase()));
  const ex = $('#extratoTx');
  ex.innerHTML = '';
  filtered.forEach(t => ex.appendChild(txRow(t)));
  $('#extratoEmpty').hidden = filtered.length > 0;

  const inSum = state.tx.filter(t => t.t === 'in').reduce((a, b) => a + b.v, 0);
  const outSum = state.tx.filter(t => t.t === 'out').reduce((a, b) => a + Math.abs(b.v), 0);
  $('#sumIn').textContent = money(inSum);
  $('#sumOut').textContent = money(outSum);

  const bars = $('#bars');
  bars.innerHTML = '';
  [38, 62, 45, 80, 55, 92, 48, 70, 60, 88, 52, 75].forEach(h => {
    const s = document.createElement('span');
    s.style.height = h + '%';
    bars.appendChild(s);
  });

  const c = $('#contacts');
  c.innerHTML = '';
  state.contacts.forEach(p => {
    const b = document.createElement('button');
    b.className = 'contact';
    b.innerHTML = `<div class="avatar">${p.n.split(' ').map(x => x[0]).join('').slice(0, 2)}</div>${p.n}`;
    b.addEventListener('click', () => { $('#pixKey').value = p.k; $('#pixKey').focus(); toast(`Chave de ${p.n} preenchida.`); });
    c.appendChild(b);
  });
}
$('#hideBalance').addEventListener('click', () => { state.hidden = !state.hidden; render(); });

$('#filters').addEventListener('click', e => {
  const b = e.target.closest('.chip');
  if (!b) return;
  state.filter = b.dataset.filter;
  document.querySelectorAll('#filters .chip').forEach(x => x.classList.toggle('active', x === b));
  render();
});
$('#search').addEventListener('input', e => { state.search = e.target.value; render(); });

function addTx(d, c, v, t) {
  state.tx.push({ d, c, v, t, dt: now() });
  state.balance += v;
  $('#balanceDelta').textContent = '+ atualizado agora';
  render();
}

/* ---------- depósito ---------- */
$('#depositBtn').addEventListener('click', async () => {
  await loading('Gerando depósito instantâneo…', 1200);
  addTx('Depósito via boleto', 'Depósito', 500, 'in');
  success('Depósito confirmado', 'R$ 500,00 já estão disponíveis na sua conta.');
});

/* ---------- PIX ---------- */
document.querySelectorAll('.fast-values .chip').forEach(b =>
  b.addEventListener('click', () => { $('#pixValue').value = money(Number(b.dataset.val)); }));

$('#pixForm').addEventListener('submit', async e => {
  e.preventDefault();
  const key = $('#pixKey').value.trim();
  const val = parseValue($('#pixValue').value);
  const err = $('#pixError');
  err.textContent = '';
  if (key.length < 5) return (err.textContent = 'Informe uma chave PIX válida.');
  if (val <= 0) return (err.textContent = 'Informe um valor maior que zero.');
  if (val > 5000) return (err.textContent = 'Limite por transação: R$ 5.000,00.');
  if (val > state.balance) { err.textContent = 'Saldo insuficiente.'; return toast('Saldo insuficiente para este PIX.', 'err'); }
  await loading('Enviando PIX…', 900);
  addTx(`PIX enviado — ${key}`, $('#pixMsg').value.trim() || 'PIX', -val, 'out');
  success('PIX enviado!', `${money(val)} enviados para ${key} em menos de 1 segundo.`);
  $('#pixForm').reset();
});

/* ---------- Transferência ---------- */
$('#transferForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#tName').value.trim();
  const ag = $('#tAg').value.trim();
  const acc = $('#tAcc').value.trim();
  const val = parseValue($('#tValue').value);
  const err = $('#tError');
  err.textContent = '';
  if (name.length < 3) return (err.textContent = 'Informe o nome do favorecido.');
  if (!ag || !acc) return (err.textContent = 'Informe agência e conta.');
  if (val <= 0) return (err.textContent = 'Informe um valor maior que zero.');
  if (val > state.balance) { err.textContent = 'Saldo insuficiente.'; return toast('Saldo insuficiente.', 'err'); }
  await loading('Processando transferência (TED)…', 2200);
  addTx(`TED — ${name}`, `${$('#tBank').value} · Ag ${ag} · CC ${acc}`, -val, 'out');
  success('Transferência concluída', `${money(val)} enviados para ${name}.`);
  $('#transferForm').reset();
});

/* ---------- Cartões ---------- */
let revealed = false;
$('#revealCard').addEventListener('click', () => {
  revealed = !revealed;
  $('#ccNum').textContent = revealed ? '4539 8842 1176 4821' : '•••• •••• •••• 4821';
  $('#revealCard').textContent = revealed ? 'Ocultar número' : 'Mostrar número';
});
let blocked = false;
$('#blockCard').addEventListener('click', async () => {
  await loading(blocked ? 'Desbloqueando cartão…' : 'Bloqueando cartão…', 1000);
  blocked = !blocked;
  document.querySelector('.credit-card').classList.toggle('blocked', blocked);
  $('#blockCard').textContent = blocked ? 'Desbloquear cartão' : 'Bloquear cartão';
  toast(blocked ? 'Cartão bloqueado com sucesso.' : 'Cartão desbloqueado.');
});
$('#payInvoice').addEventListener('click', async () => {
  const val = 1284.9;
  if (val > state.balance) return toast('Saldo insuficiente para pagar a fatura.', 'err');
  await loading('Pagando fatura…', 1600);
  addTx('Pagamento de fatura — Cartão Nova Bank', 'Fatura', -val, 'out');
  success('Fatura paga', `${money(val)} debitados da sua conta.`);
});

render();
