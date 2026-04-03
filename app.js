// =================================================================
//  CONFIG
// =================================================================
const API         = 'http://localhost:3000';
const SESSION_KEY = 'qm_session';  // sessionStorage: logged-in user
const STATE_KEY   = 'qm_state';    // sessionStorage: dashboard type+action

// =================================================================
//  SESSION
//  User aur dashboard state dono sessionStorage mein save hote hain.
//  Page refresh par bhi logout nahi hoga aur jo type/action select
//  tha wo bhi yaad rahega.
// =================================================================
const Session = {
  // User
  save(user)  { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));  },
  get()       {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
  },

  // Dashboard state (type + action)
  saveState(s) { sessionStorage.setItem(STATE_KEY, JSON.stringify(s)); },
  getState()   {
    try { return JSON.parse(sessionStorage.getItem(STATE_KEY)) || null; }
    catch { return null; }
  },

  // Clear everything on logout
  clear() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(STATE_KEY);
  }
};

// =================================================================
//  CONSTANTS
// =================================================================
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
  length:      { from:'Feet',    to:'Inch'       },
  weight:      { from:'Kilogram',to:'Pound'      },
  temperature: { from:'Celsius', to:'Fahrenheit' },
  volume:      { from:'Liter',   to:'Milliliter' }
};

const OP_SYMBOL = { '+':'+', '-':'minus', '*':'x', '/':'div' };
const OP_DISPLAY = { '+':'+', '-':'minus', '*':'x', '/':'/' };

// =================================================================
//  MATH HELPERS
// =================================================================
function fmt(n) {
  if (!isFinite(n)) return String(n);
  if (Math.abs(n) > 0 && (Math.abs(n) < 0.0001 || Math.abs(n) > 1e9))
    return n.toExponential(4);
  return parseFloat(n.toPrecision(7)).toString();
}

function convertTemp(val, from, to) {
  if (from === to) return val;
  const toCelsius   = { Celsius: v => v, Fahrenheit: v => (v-32)*5/9, Kelvin: v => v-273.15 };
  const fromCelsius = { Celsius: v => v, Fahrenheit: v => v*9/5+32,   Kelvin: v => v+273.15  };
  return fromCelsius[to](toCelsius[from](val));
}

function toBaseUnit(val, type, unit)       { return val * TO_BASE[type][unit]; }
function fromBaseUnit(baseVal, type, unit) { return baseVal / TO_BASE[type][unit]; }

function convert(val, type, uFrom, uTo) {
  if (type === 'temperature') return convertTemp(val, uFrom, uTo);
  return fromBaseUnit(toBaseUnit(val, type, uFrom), type, uTo);
}

function populateSelect(sel, options, selectedValue) {
  sel.innerHTML = options.map(u => `<option value="${u}">${u}</option>`).join('');
  if (selectedValue && options.includes(selectedValue)) sel.value = selectedValue;
}

// =================================================================
//  VALIDATION
// =================================================================
function setFieldError(inputEl, message) {
  const wrap = inputEl.parentElement;
  const existing = wrap.nextElementSibling;
  if (existing && existing.classList.contains('field-error')) existing.remove();
  inputEl.classList.toggle('input-error', !!message);
  if (message) {
    const err = document.createElement('div');
    err.className   = 'field-error';
    err.textContent = message;
    wrap.insertAdjacentElement('afterend', err);
  }
}
function clearFieldError(inputEl) { setFieldError(inputEl, null); }

function validatePassword(pwd) {
  if (pwd.length < 8)            return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(pwd))        return 'Must contain at least one uppercase letter (A-Z).';
  if (!/[a-z]/.test(pwd))        return 'Must contain at least one lowercase letter (a-z).';
  if (!/[0-9]/.test(pwd))        return 'Must contain at least one number (0-9).';
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'Must contain at least one special character (!@#$%...).';
  return null;
}
function validateMobile(val) {
  return /^\d{10}$/.test(val) ? null : 'Mobile number must be exactly 10 digits.';
}
function validateEmail(val) {
  if (!val) return 'Email is required.';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : 'Enter a valid email address.';
}

// =================================================================
//  HTTP HELPERS
// =================================================================
const Http = {
  async get(resource, query) {
    const url = query ? `${API}/${resource}?${query}` : `${API}/${resource}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET /${resource} failed (${res.status})`);
    return res.json();
  },
  async post(resource, body) {
    const res = await fetch(`${API}/${resource}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`POST /${resource} failed (${res.status})`);
    return res.json();
  },
  async delete(resource, id) {
    const res = await fetch(`${API}/${resource}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE /${resource}/${id} failed (${res.status})`);
    return res.json();
  }
};

// =================================================================
//  USER API  ->  /users
// =================================================================
const UserAPI = {
  async findByEmail(email) {
    const results = await Http.get('users', `email=${encodeURIComponent(email)}`);
    return results.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  async register({ name, mobile, email, password }) {
    const existing = await this.findByEmail(email);
    if (existing) return 'This email is already registered. Please login.';
    await Http.post('users', { name, mobile, email, password });
    return null;
  },
  async authenticate(email, password) {
    const user = await this.findByEmail(email);
    if (!user)                      return { ok:false, field:'email',    message:'No account found with this email. Please signup first.' };
    if (user.password !== password) return { ok:false, field:'password', message:'Incorrect password. Please try again.' };
    return { ok:true, user };
  }
};

// =================================================================
//  HISTORY API  ->  /history
// =================================================================
const HistoryAPI = {
  async get(userId) {
    return Http.get('history', `userId=${userId}&_sort=id&_order=desc&_limit=50`);
  },
  async add(userId, { type, action, value, note }) {
    return Http.post('history', {
      userId, type, action, value, note,
      ts: new Date().toLocaleString()
    });
  },
  async clearAll(userId) {
    const records = await Http.get('history', `userId=${userId}`);
    await Promise.all(records.map(r => Http.delete('history', r.id)));
  }
};

// =================================================================
//  POPUP
// =================================================================
function showPopup(type, title, message, onClose) {
  const overlay = document.getElementById('popup-overlay');
  document.getElementById('popup-icon').textContent    = type === 'success' ? '???' : '???';
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

// =================================================================
//  AUTH MODULE
// =================================================================
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

  // LOGIN
  async function login() {
    const emailEl = document.getElementById('login-email');
    const passEl  = document.getElementById('login-password');
    const btn     = document.getElementById('btn-login');
    let valid = true;

    const emailErr = validateEmail(getVal('login-email'));
    if (emailErr) { setFieldError(emailEl, emailErr); valid = false; } else clearFieldError(emailEl);
    if (!getVal('login-password')) { setFieldError(passEl, 'Password is required.'); valid = false; }
    else clearFieldError(passEl);
    if (!valid) return;

    btn.disabled = true;
    btn.textContent = 'Logging in...';
    try {
      const result = await UserAPI.authenticate(getVal('login-email'), getVal('login-password'));
      if (!result.ok) {
        setFieldError(result.field === 'email' ? emailEl : passEl, result.message);
        return;
      }
      Session.save(result.user);
      App.showDashboard(result.user);
    } catch (err) {
      console.error(err);
      showPopup('error', 'Server Error', 'JSON Server se connect nahi ho paya. "npm start" chal raha hai check karo.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Login';
    }
  }

  // SIGNUP
  async function signup() {
    const nameEl   = document.getElementById('signup-name');
    const mobileEl = document.getElementById('signup-mobile');
    const emailEl  = document.getElementById('signup-email');
    const passEl   = document.getElementById('signup-password');
    const btn      = document.getElementById('btn-signup');
    let valid = true;

    if (!getVal('signup-name'))  { setFieldError(nameEl, 'Full name is required.'); valid = false; }
    else clearFieldError(nameEl);
    const mobileErr = validateMobile(getVal('signup-mobile'));
    if (mobileErr) { setFieldError(mobileEl, mobileErr); valid = false; } else clearFieldError(mobileEl);
    const emailErr = validateEmail(getVal('signup-email'));
    if (emailErr) { setFieldError(emailEl, emailErr); valid = false; } else clearFieldError(emailEl);
    const passErr = validatePassword(getVal('signup-password'));
    if (passErr) { setFieldError(passEl, passErr); valid = false; } else clearFieldError(passEl);
    if (!valid) return;

    btn.disabled = true;
    btn.textContent = 'Creating account...';
    try {
      const err = await UserAPI.register({
        name:     getVal('signup-name'),
        mobile:   getVal('signup-mobile'),
        email:    getVal('signup-email'),
        password: getVal('signup-password'),
      });
      if (err) { setFieldError(emailEl, err); return; }
      ['signup-name','signup-mobile','signup-email','signup-password']
        .forEach(id => { document.getElementById(id).value = ''; });
      showPopup('success', 'Account Created!', 'Account ban gaya! Ab login karein.', () => switchTab('login'));
    } catch (e) {
      console.error(e);
      showPopup('error', 'Server Error', 'JSON Server se connect nahi ho paya. "npm start" chal raha hai check karo.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Signup';
    }
  }

  return { switchTab, login, signup };
})();

// =================================================================
//  CALCULATOR MODULE
// =================================================================
const Calc = (() => {
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

  function conversion(type) {
    const val   = parseFloat(document.getElementById('val-from').value) || 0;
    const uFrom = document.getElementById('unit-from').value;
    const uTo   = document.getElementById('unit-to').value;
    const result = convert(val, type, uFrom, uTo);
    document.getElementById('val-to').value = fmt(result);
    return { value:`${fmt(result)} ${uTo}`, note:`${val} ${uFrom} = ${fmt(result)} ${uTo}` };
  }

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
      baseA = convertTemp(a, unitA, 'Celsius');
      baseB = convertTemp(b, unitB, 'Celsius');
    } else {
      baseA = toBaseUnit(a, type, unitA);
      baseB = toBaseUnit(b, type, unitB);
    }
    switch (op) {
      case '+': baseResult = baseA + baseB; break;
      case '-': baseResult = baseA - baseB; break;
      case '*': baseResult = baseA * baseB; break;
      case '/': baseResult = baseA / baseB; break;
    }
    const finalResult = type === 'temperature'
      ? convertTemp(baseResult, 'Celsius', unitRes)
      : fromBaseUnit(baseResult, type, unitRes);
    const opSym = { '+':'+', '-':'-', '*':'*', '/':'/' }[op];
    return {
      value: `${fmt(finalResult)} ${unitRes}`,
      note:  `(${a} ${unitA}) ${opSym} (${b} ${unitB}) = ${fmt(finalResult)} ${unitRes}`
    };
  }

  return { comparison, conversion, arithmetic };
})();

// =================================================================
//  APP
// =================================================================
const App = (() => {
  let state       = { type:'length', action:'comparison' };
  let currentUser = null;

  // Result box
  function showResult(data) {
    if (!data) return;
    document.getElementById('result-value').textContent = data.value;
    document.getElementById('result-note').textContent  = data.note;
    document.getElementById('result-box').classList.add('show');
  }
  function hideResult() {
    document.getElementById('result-box').classList.remove('show');
  }

  // Unit selects
  function refreshUnits() {
    const list = UNITS[state.type];
    const def  = DEFAULT_UNITS[state.type];
    populateSelect(document.getElementById('unit-from'),         list, def.from);
    populateSelect(document.getElementById('unit-to'),           list, def.to);
    populateSelect(document.getElementById('arith-unit-a'),      list, def.from);
    populateSelect(document.getElementById('arith-unit-b'),      list, def.to);
    populateSelect(document.getElementById('arith-unit-result'), list, def.from);
    document.getElementById('val-from').value = 1;
    document.getElementById('val-to').value   = 1;
    document.getElementById('arith-a').value  = 1;
    document.getElementById('arith-b').value  = 1;
    hideResult();
  }

  // Action UI
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

  // History
  async function renderHistory() {
    if (!currentUser) return;
    const listEl   = document.getElementById('history-list');
    const headerEl = document.getElementById('history-header');
    try {
      const list = await HistoryAPI.get(currentUser.id);
      if (list.length === 0) {
        listEl.innerHTML = '';
        headerEl.classList.remove('visible');
        return;
      }
      headerEl.classList.add('visible');
      listEl.innerHTML = list.map(e => `
        <div class="history-item">
          <span class="hist-badge">${e.type} - ${e.action}</span>
          <span class="hist-value">${e.value}</span>
          <span class="hist-note">${e.ts}</span>
        </div>
      `).join('');
    } catch (e) {
      console.warn('History load failed:', e.message);
    }
  }

  // ---------------------------------------------------------------
  //  selectType — type card click par
  //  State + UI update + sessionStorage save
  // ---------------------------------------------------------------
  function selectType(type) {
    state.type = type;
    document.querySelectorAll('#type-grid .type-card').forEach(c =>
      c.classList.toggle('active', c.dataset.type === type)
    );
    Session.saveState(state);   // <-- state bachao
    refreshUnits();
  }

  // ---------------------------------------------------------------
  //  selectAction — action tab click par
  // ---------------------------------------------------------------
  function selectAction(action) {
    state.action = action;
    document.querySelectorAll('#action-tabs .action-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.action === action)
    );
    Session.saveState(state);   // <-- state bachao
    applyActionUI();
  }

  // ---------------------------------------------------------------
  //  calculate
  // ---------------------------------------------------------------
  async function calculate() {
    const result = Calc[state.action](state.type);
    if (!result) return;
    showResult(result);
    if (currentUser) {
      try {
        await HistoryAPI.add(currentUser.id, {
          type:   state.type,
          action: state.action,
          value:  result.value,
          note:   result.note,
        });
        await renderHistory();
      } catch (e) {
        console.warn('History save failed:', e.message);
      }
    }
  }

  async function clearHistory() {
    if (!currentUser) return;
    try {
      await HistoryAPI.clearAll(currentUser.id);
      await renderHistory();
    } catch (e) {
      console.warn('History clear failed:', e.message);
    }
  }

  // ---------------------------------------------------------------
  //  _setupUI — common UI steps for both login and restore
  // ---------------------------------------------------------------
  function _setupUI(user) {
    currentUser = user;
    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('dashboard-page').classList.add('active');
    const greet = document.getElementById('user-greeting');
    if (greet) greet.textContent = user && user.name ? `Hi, ${user.name.split(' ')[0]}` : '';
  }

  // ---------------------------------------------------------------
  //  showDashboard — fresh LOGIN ke baad
  //  State reset hoti hai: length + comparison
  // ---------------------------------------------------------------
  async function showDashboard(user) {
    _setupUI(user);

    // Clear login inputs
    ['login-email','login-password'].forEach(id => {
      document.getElementById(id).value = '';
    });

    // Fresh state
    state = { type:'length', action:'comparison' };
    Session.saveState(state);

    document.querySelectorAll('#type-grid .type-card').forEach(c =>
      c.classList.toggle('active', c.dataset.type === 'length')
    );
    document.querySelectorAll('#action-tabs .action-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.action === 'comparison')
    );
    refreshUnits();
    applyActionUI();
    await renderHistory();
  }

  // ---------------------------------------------------------------
  //  restoreSession — PAGE REFRESH ke baad
  //  User jahan tha wahin wapas jaata hai (state preserved)
  //  Login page nahi aata, state reset nahi hota
  // ---------------------------------------------------------------
  async function restoreSession(user, savedState) {
    _setupUI(user);

    // Saved state use karo (ya default agar kuch nahi mila)
    state = savedState || { type:'length', action:'comparison' };

    // Type cards aur action tabs restore karo
    document.querySelectorAll('#type-grid .type-card').forEach(c =>
      c.classList.toggle('active', c.dataset.type === state.type)
    );
    document.querySelectorAll('#action-tabs .action-tab').forEach(b =>
      b.classList.toggle('active', b.dataset.action === state.action)
    );
    refreshUnits();
    applyActionUI();
    await renderHistory();
  }

  // ---------------------------------------------------------------
  //  logout
  // ---------------------------------------------------------------
  function logout() {
    currentUser = null;
    Session.clear();
    document.getElementById('dashboard-page').classList.remove('active');
    document.getElementById('auth-page').classList.add('active');
    const greet = document.getElementById('user-greeting');
    if (greet) greet.textContent = '';
    Auth.switchTab('login');
    hideResult();
  }

  // ---------------------------------------------------------------
  //  init — page load par ek baar chalega
  // ---------------------------------------------------------------
  async function init() {
    // Event listeners
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

    // Session restore check
    const savedUser  = Session.get();
    const savedState = Session.getState();

    if (savedUser) {
      // User pehle se logged in tha — restore karo bina reset ke
      await restoreSession(savedUser, savedState);
    }
    // Agar session nahi — auth page already visible hai (default HTML)
  }

  return { selectType, selectAction, calculate, clearHistory, showDashboard, logout, init };
})();

// Boot
App.init();