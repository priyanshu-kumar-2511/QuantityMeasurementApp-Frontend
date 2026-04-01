// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

const UNITS = {
  length:      ['Millimeter','Centimeter','Meter','Kilometer','Inch','Feet','Yard','Mile'],
  weight:      ['Milligram','Gram','Kilogram','Tonne','Ounce','Pound'],
  temperature: ['Celsius','Fahrenheit','Kelvin'],
  volume:      ['Milliliter','Liter','Cubic Meter','Teaspoon','Tablespoon','Cup','Fluid Ounce','Gallon']
};

const TO_BASE = {
  length:  { Millimeter:0.001, Centimeter:0.01, Meter:1, Kilometer:1000, Inch:0.0254, Feet:0.3048, Yard:0.9144, Mile:1609.344 },
  weight:  { Milligram:0.000001, Gram:0.001, Kilogram:1, Tonne:1000, Ounce:0.0283495, Pound:0.453592 },
  volume:  { Milliliter:0.001, Liter:1, 'Cubic Meter':1000, Teaspoon:0.00492892, Tablespoon:0.0147868, Cup:0.236588, 'Fluid Ounce':0.0295735, Gallon:3.78541 }
};

const DEFAULT_UNITS = {
  length:      { from:'Feet',    to:'Inch'        },
  weight:      { from:'Kilogram',to:'Pound'       },
  temperature: { from:'Celsius', to:'Fahrenheit'  },
  volume:      { from:'Liter',   to:'Milliliter'  }
};

const OP_SYMBOL = { '+':'+', '-':'−', '*':'×', '/':'÷' };

// ═══════════════════════════════════════════════════════════════
//  MATH HELPERS
// ═══════════════════════════════════════════════════════════════

function fmt(n) {
  if (!isFinite(n)) return String(n);
  if (Math.abs(n) > 0 && (Math.abs(n) < 0.0001 || Math.abs(n) > 1e9))
    return n.toExponential(4);
  return parseFloat(n.toPrecision(7)).toString();
}

function convertTemp(val, from, to) {
  if (from === to) return val;
  const toCelsius   = { Celsius: v => v, Fahrenheit: v => (v-32)*5/9, Kelvin: v => v-273.15 };
  const fromCelsius = { Celsius: v => v, Fahrenheit: v => v*9/5+32,   Kelvin: v => v+273.15 };
  return fromCelsius[to](toCelsius[from](val));
}

function toBaseUnit(val, type, unit)           { return val * TO_BASE[type][unit]; }
function fromBaseUnit(baseVal, type, unit)     { return baseVal / TO_BASE[type][unit]; }

/** Convert any value from one unit to another (same type) */
function convert(val, type, uFrom, uTo) {
  if (type === 'temperature') return convertTemp(val, uFrom, uTo);
  return fromBaseUnit(toBaseUnit(val, type, uFrom), type, uTo);
}

function populateSelect(selectEl, options, selectedValue) {
  selectEl.innerHTML = options.map(u => `<option value="${u}">${u}</option>`).join('');
  if (selectedValue && options.includes(selectedValue)) selectEl.value = selectedValue;
}

// ═══════════════════════════════════════════════════════════════
//  VALIDATION
// ═══════════════════════════════════════════════════════════════

function setFieldError(inputEl, message) {
  const wrap = inputEl.parentElement;
  const existing = wrap.nextElementSibling;
  if (existing && existing.classList.contains('field-error')) existing.remove();
  inputEl.classList.toggle('input-error', !!message);
  if (message) {
    const err = document.createElement('div');
    err.className = 'field-error';
    err.textContent = message;
    wrap.insertAdjacentElement('afterend', err);
  }
}
function clearFieldError(inputEl) { setFieldError(inputEl, null); }

function validatePassword(pwd) {
  if (pwd.length < 8)            return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(pwd))        return 'Must contain at least one uppercase letter (A–Z).';
  if (!/[a-z]/.test(pwd))        return 'Must contain at least one lowercase letter (a–z).';
  if (!/[0-9]/.test(pwd))        return 'Must contain at least one number (0–9).';
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'Must contain at least one special character (!@#$%…).';
  return null;
}
function validateMobile(val) {
  return /^\d{10}$/.test(val) ? null : 'Mobile number must be exactly 10 digits.';
}
function validateEmail(val) {
  if (!val) return 'Email is required.';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : 'Enter a valid email address.';
}

// ═══════════════════════════════════════════════════════════════
//  USER STORE  — localStorage
// ═══════════════════════════════════════════════════════════════
const UserStore = (() => {
  const USERS_KEY = 'qm_users';

  function getAll() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; }
  }
  function saveAll(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

  function findByEmail(email) {
    return getAll().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  function register({ name, mobile, email, password }) {
    const users = getAll();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase()))
      return 'This email is already registered. Please login.';
    users.push({ name, mobile, email, password });
    saveAll(users);
    return null;
  }

  function authenticate(email, password) {
    const user = findByEmail(email);
    if (!user)                   return { ok:false, field:'email',    message:'No account found with this email. Please signup first.' };
    if (user.password !== password) return { ok:false, field:'password', message:'Incorrect password. Please try again.' };
    return { ok:true, user };
  }

  return { register, authenticate, findByEmail };
})();

// ═══════════════════════════════════════════════════════════════
//  HISTORY STORE  — per-user calculation history in localStorage
// ═══════════════════════════════════════════════════════════════
const HistoryStore = (() => {
  function _key(email) { return `qm_history_${email.toLowerCase()}`; }

  function get(email) {
    try { return JSON.parse(localStorage.getItem(_key(email))) || []; } catch { return []; }
  }

  function add(email, entry) {
    const list = get(email);
    list.unshift({ ...entry, ts: new Date().toLocaleTimeString() }); // newest first
    if (list.length > 50) list.length = 50;                          // max 50 entries
    localStorage.setItem(_key(email), JSON.stringify(list));
  }

  function clear(email) { localStorage.removeItem(_key(email)); }

  return { get, add, clear };
})();

// ═══════════════════════════════════════════════════════════════
//  POPUP
// ═══════════════════════════════════════════════════════════════
function showPopup(type, title, message, onClose) {
  const overlay = document.getElementById('popup-overlay');
  document.getElementById('popup-icon').textContent    = type === 'success' ? '✅' : '❌';
  document.getElementById('popup-title').textContent   = title;
  document.getElementById('popup-message').textContent = message;
  const btn = document.getElementById('popup-ok-btn');
  btn.textContent = type === 'success' ? 'OK, Go to Login' : 'Try Again';
  btn.className   = `popup-ok-btn popup-ok-btn--${type}`;
  overlay.classList.add('active');
  overlay._onClose = onClose || null;
}
function closePopup() {
  const overlay = document.getElementById('popup-overlay');
  overlay.classList.remove('active');
  if (typeof overlay._onClose === 'function') { overlay._onClose(); overlay._onClose = null; }
}

// ═══════════════════════════════════════════════════════════════
//  AUTH MODULE
// ═══════════════════════════════════════════════════════════════
const Auth = (() => {
  function switchTab(tab) {
    ['login','signup'].forEach(t => {
      document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
      document.getElementById(`form-${t}`).classList.toggle('active', t === tab);
    });
    document.querySelectorAll('.field-error').forEach(el => el.remove());
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  }

  function getVal(id) { return document.getElementById(id).value.trim(); }

  function login() {
    const emailEl = document.getElementById('login-email');
    const passEl  = document.getElementById('login-password');
    let valid = true;

    const emailErr = validateEmail(getVal('login-email'));
    if (emailErr) { setFieldError(emailEl, emailErr); valid = false; } else clearFieldError(emailEl);

    if (!getVal('login-password')) { setFieldError(passEl, 'Password is required.'); valid = false; }
    else clearFieldError(passEl);

    if (!valid) return;

    const result = UserStore.authenticate(getVal('login-email'), getVal('login-password'));
    if (!result.ok) {
      setFieldError(result.field === 'email' ? emailEl : passEl, result.message);
      return;
    }
    App.showDashboard(result.user);
  }

  function signup() {
    const nameEl   = document.getElementById('signup-name');
    const mobileEl = document.getElementById('signup-mobile');
    const emailEl  = document.getElementById('signup-email');
    const passEl   = document.getElementById('signup-password');
    let valid = true;

    if (!getVal('signup-name')) { setFieldError(nameEl, 'Full name is required.'); valid = false; }
    else clearFieldError(nameEl);

    const mobileErr = validateMobile(getVal('signup-mobile'));
    if (mobileErr) { setFieldError(mobileEl, mobileErr); valid = false; } else clearFieldError(mobileEl);

    const emailErr = validateEmail(getVal('signup-email'));
    if (emailErr) { setFieldError(emailEl, emailErr); valid = false; } else clearFieldError(emailEl);

    const passErr = validatePassword(getVal('signup-password'));
    if (passErr) { setFieldError(passEl, passErr); valid = false; } else clearFieldError(passEl);

    if (!valid) return;

    const registerErr = UserStore.register({
      name:     getVal('signup-name'),
      mobile:   getVal('signup-mobile'),
      email:    getVal('signup-email'),
      password: getVal('signup-password'),
    });
    if (registerErr) { setFieldError(emailEl, registerErr); return; }

    ['signup-name','signup-mobile','signup-email','signup-password']
      .forEach(id => { document.getElementById(id).value = ''; });

    showPopup('success', 'Account Created!',
      'Your account has been created successfully. Please login to continue.',
      () => switchTab('login')
    );
  }

  return { switchTab, login, signup };
})();

// ═══════════════════════════════════════════════════════════════
//  CALCULATOR MODULE
// ═══════════════════════════════════════════════════════════════
const Calc = (() => {

  // ── Comparison ──────────────────────────────────────────────
  function comparison(type) {
    const val1  = parseFloat(document.getElementById('val-from').value) || 0;
    const val2  = parseFloat(document.getElementById('val-to').value)   || 0;
    const uFrom = document.getElementById('unit-from').value;
    const uTo   = document.getElementById('unit-to').value;

    let base1, base2;
    if (type === 'temperature') {
      base1 = convertTemp(val1, uFrom, 'Celsius');
      base2 = convertTemp(val2, uTo,   'Celsius');
    } else {
      base1 = toBaseUnit(val1, type, uFrom);
      base2 = toBaseUnit(val2, type, uTo);
    }

    const eps = 1e-9;
    if (Math.abs(base1-base2) < eps)
      return { value:`${val1} ${uFrom} = ${val2} ${uTo}`, note:'Both values are equal.' };
    if (base1 > base2)
      return { value:`${val1} ${uFrom} > ${val2} ${uTo}`, note:`${val1} ${uFrom} is greater by ${fmt(base1-base2)} (base unit).` };
    return { value:`${val1} ${uFrom} < ${val2} ${uTo}`, note:`${val2} ${uTo} is greater by ${fmt(base2-base1)} (base unit).` };
  }

  // ── Conversion ───────────────────────────────────────────────
  function conversion(type) {
    const val   = parseFloat(document.getElementById('val-from').value) || 0;
    const uFrom = document.getElementById('unit-from').value;
    const uTo   = document.getElementById('unit-to').value;
    const result = convert(val, type, uFrom, uTo);
    document.getElementById('val-to').value = fmt(result);
    return { value:`${fmt(result)} ${uTo}`, note:`${val} ${uFrom} = ${fmt(result)} ${uTo}` };
  }

  // ── Arithmetic (UPGRADED: two independent units + result unit) ─
  //
  // Logic:
  //   1. Convert Value A (unit-A) → base unit
  //   2. Convert Value B (unit-B) → base unit
  //   3. Perform operation on base values
  //   4. Convert result (base) → chosen result unit
  //
  // Temperature special case: convert everything to Celsius first,
  // operate, then convert result to chosen unit.
  // Multiplication & division on temperature don't map physically,
  // but we handle them numerically in Celsius and show a note.
  //
  function arithmetic(type) {
    const a       = parseFloat(document.getElementById('arith-a').value) || 0;
    const b       = parseFloat(document.getElementById('arith-b').value) || 0;
    const op      = document.getElementById('arith-op').value;
    const unitA   = document.getElementById('arith-unit-a').value;
    const unitB   = document.getElementById('arith-unit-b').value;
    const unitRes = document.getElementById('arith-unit-result').value;

    if (op === '/' && b === 0) { alert('Cannot divide by zero.'); return null; }

    let baseA, baseB, baseResult;

    if (type === 'temperature') {
      // Convert to Celsius for arithmetic
      baseA = convertTemp(a, unitA, 'Celsius');
      baseB = convertTemp(b, unitB, 'Celsius');
    } else {
      baseA = toBaseUnit(a, type, unitA);
      baseB = toBaseUnit(b, type, unitB);
    }

    // Perform operation in base/Celsius space
    switch (op) {
      case '+': baseResult = baseA + baseB; break;
      case '-': baseResult = baseA - baseB; break;
      case '*': baseResult = baseA * baseB; break;
      case '/': baseResult = baseA / baseB; break;
    }

    // Convert result back to chosen result unit
    let finalResult;
    if (type === 'temperature') {
      finalResult = convertTemp(baseResult, 'Celsius', unitRes);
    } else {
      finalResult = fromBaseUnit(baseResult, type, unitRes);
    }

    const opSym = OP_SYMBOL[op];
    return {
      value: `${fmt(finalResult)} ${unitRes}`,
      note:  `(${a} ${unitA}) ${opSym} (${b} ${unitB}) = ${fmt(finalResult)} ${unitRes}`
    };
  }

  return { comparison, conversion, arithmetic };
})();

// ═══════════════════════════════════════════════════════════════
//  APP  — state, UI, history rendering
// ═══════════════════════════════════════════════════════════════
const App = (() => {
  let state       = { type:'length', action:'comparison' };
  let currentUser = null;   // logged-in user object

  // ── Result box ───────────────────────────────────────────────
  function showResult(data) {
    if (!data) return;
    document.getElementById('result-value').textContent = data.value;
    document.getElementById('result-note').textContent  = data.note;
    document.getElementById('result-box').classList.add('show');
  }
  function hideResult() {
    document.getElementById('result-box').classList.remove('show');
  }

  // ── Unit selects ─────────────────────────────────────────────
  function refreshUnits() {
    const list = UNITS[state.type];
    const def  = DEFAULT_UNITS[state.type];

    populateSelect(document.getElementById('unit-from'), list, def.from);
    populateSelect(document.getElementById('unit-to'),   list, def.to);

    // Arithmetic: all three selects get the full unit list
    populateSelect(document.getElementById('arith-unit-a'),      list, def.from);
    populateSelect(document.getElementById('arith-unit-b'),      list, def.to);
    populateSelect(document.getElementById('arith-unit-result'), list, def.from);

    // Reset numeric inputs
    document.getElementById('val-from').value = 1;
    document.getElementById('val-to').value   = 1;
    document.getElementById('arith-a').value  = 1;
    document.getElementById('arith-b').value  = 1;

    hideResult();
  }

  // ── Action UI ────────────────────────────────────────────────
  function applyActionUI() {
    const isDual = state.action !== 'arithmetic';
    const isConv = state.action === 'conversion';

    document.getElementById('dual-calc').style.display  = isDual ? 'grid' : 'none';
    document.getElementById('arith-calc').style.display = isDual ? 'none' : 'block';
    document.getElementById('val-to').readOnly = isConv;

    if (isDual) {
      const labels = { comparison:['VALUE 1','VALUE 2'], conversion:['FROM','TO'] };
      document.getElementById('from-label').textContent = labels[state.action][0];
      document.getElementById('to-label').textContent   = labels[state.action][1];
    }
    const btnText = { comparison:'Compare', conversion:'Convert', arithmetic:'Calculate' };
    document.getElementById('main-action-btn').textContent = btnText[state.action];
    hideResult();
  }

  // ── History rendering ────────────────────────────────────────
  function renderHistory() {
    if (!currentUser) return;
    const list    = HistoryStore.get(currentUser.email);
    const listEl  = document.getElementById('history-list');
    const headerEl = document.getElementById('history-header');

    if (list.length === 0) {
      listEl.innerHTML = '';
      headerEl.classList.remove('visible');
      return;
    }

    headerEl.classList.add('visible');
    listEl.innerHTML = list.map(entry => `
      <div class="history-item">
        <span class="hist-badge">${entry.type} · ${entry.action}</span>
        <span class="hist-value">${entry.value}</span>
        <span class="hist-note">${entry.ts}</span>
      </div>
    `).join('');
  }

  // ── Public: selectType ───────────────────────────────────────
  function selectType(type) {
    state.type = type;
    document.querySelectorAll('#type-grid .type-card').forEach(c =>
      c.classList.toggle('active', c.dataset.type === type)
    );
    refreshUnits();
  }

  // ── Public: selectAction ─────────────────────────────────────
  function selectAction(action) {
    state.action = action;
    document.querySelectorAll('#action-tabs .action-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.action === action)
    );
    applyActionUI();
  }

  // ── Public: calculate ────────────────────────────────────────
  function calculate() {
    const result = Calc[state.action](state.type);
    if (!result) return;
    showResult(result);

    // Save to history
    if (currentUser) {
      HistoryStore.add(currentUser.email, {
        type:   state.type,
        action: state.action,
        value:  result.value,
        note:   result.note,
      });
      renderHistory();
    }
  }

  // ── Public: clearHistory ─────────────────────────────────────
  function clearHistory() {
    if (!currentUser) return;
    HistoryStore.clear(currentUser.email);
    renderHistory();
  }

  // ── Public: showDashboard ─────────────────────────────────────
  function showDashboard(user) {
    currentUser = user;
    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('dashboard-page').classList.add('active');

    const greet = document.getElementById('user-greeting');
    if (greet) greet.textContent = user && user.name ? `👋 Hi, ${user.name.split(' ')[0]}` : '';

    // Clear login inputs
    ['login-email','login-password'].forEach(id => { document.getElementById(id).value = ''; });

    // Reset dashboard
    state = { type:'length', action:'comparison' };
    document.querySelectorAll('#type-grid .type-card').forEach(c =>
      c.classList.toggle('active', c.dataset.type === 'length')
    );
    document.querySelectorAll('#action-tabs .action-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.action === 'comparison')
    );
    refreshUnits();
    applyActionUI();
    renderHistory();
  }

  // ── Public: logout ───────────────────────────────────────────
  function logout() {
    currentUser = null;
    document.getElementById('dashboard-page').classList.remove('active');
    document.getElementById('auth-page').classList.add('active');
    const greet = document.getElementById('user-greeting');
    if (greet) greet.textContent = '';
    Auth.switchTab('login');
    hideResult();
  }

  // ── Event wiring ─────────────────────────────────────────────
  function init() {
    document.getElementById('type-grid').addEventListener('click', e => {
      const card = e.target.closest('.type-card');
      if (card) selectType(card.dataset.type);
    });
    document.getElementById('action-tabs').addEventListener('click', e => {
      const btn = e.target.closest('.action-tab');
      if (btn) selectAction(btn.dataset.action);
    });
    ['unit-from','unit-to','arith-unit-a','arith-unit-b','arith-unit-result'].forEach(id => {
      document.getElementById(id).addEventListener('change', hideResult);
    });
  }

  return { selectType, selectAction, calculate, clearHistory, showDashboard, logout, init };
})();

// Boot
App.init();