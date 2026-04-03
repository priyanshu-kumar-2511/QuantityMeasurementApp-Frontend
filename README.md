# Quantity Measurement App

A client-side web application for unit measurement operations, backed by a RESTful JSON Server. Supports user authentication, session persistence, stateful navigation, and per-user calculation history.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Folder Structure](#folder-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Application Modules](#application-modules)
- [Usage Guide](#usage-guide)
- [REST API Reference](#rest-api-reference)
- [Database Schema](#database-schema)
- [Form Validations](#form-validations)
- [Session & State Management](#session--state-management)
- [Known Issues & Resolutions](#known-issues--resolutions)
- [Supported Units](#supported-units)

---

## Project Overview

**Quantity Measurement App** is a vanilla JavaScript single-page application (SPA) that performs mathematical and unit-conversion operations across four measurement categories — Length, Weight, Temperature, and Volume.

The application uses **JSON Server** as a lightweight REST API backend that persists data to a local `db.json` file. User authentication is handled on the client side via HTTP requests to the `/users` endpoint. Calculation history is stored server-side per authenticated user and retrieved on each session restore.

---

## Features

| Feature | Technical Detail |
|---|---|
| User Registration | POST `/users` with duplicate email validation |
| User Authentication | GET `/users?email=` with credential matching |
| Session Persistence | `sessionStorage` — survives page refresh, cleared on tab close |
| Dashboard State Persistence | Active type & action stored in `sessionStorage` and restored on reload |
| Unit Comparison | Converts both values to SI base unit and performs relational comparison |
| Unit Conversion | Converts value from source unit to target unit via SI base unit intermediary |
| Cross-Unit Arithmetic | Converts both operands to base unit independently, performs operation, converts result to user-selected output unit |
| Calculation History | POST `/history` on every calculation; GET on session restore; DELETE all on clear |
| Inline Form Validation | Real-time field-level error rendering without page reload |
| Popup Notifications | Success and error states with callback-driven close handler |
| Responsive Layout | CSS Grid & Flexbox — supports mobile and desktop viewports |

---

## Folder Structure

```
quantity-measurement-json-server/
│
├── index.html        # Application entry point — markup and DOM structure
├── style.css         # Global stylesheet — CSS custom properties, layout, components
├── app.js            # Core application logic — Auth, Calc, App, Session modules
├── db.json           # JSON Server database — persists users and history collections
├── package.json      # Project manifest — npm scripts and devDependencies
├── icon.jpeg         # Application icon asset
└── README.md         # Project documentation
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 — Custom Properties, Flexbox, CSS Grid |
| Scripting | Vanilla JavaScript ES6+ (async/await, IIFE modules, arrow functions) |
| Backend | JSON Server v0.17 (REST API + static file server) |
| Client Storage | `sessionStorage` (session & state), `db.json` (persistent data) |
| HTTP Client | Fetch API (native browser) |
| Typography | Google Fonts — Poppins, Nunito |

---

## Prerequisites

Ensure the following runtime is installed on the system before proceeding:

- **Node.js** >= 14.x
- **npm** >= 6.x

Verify installation:

```bash
node -v
npm -v
```

Download Node.js (LTS recommended): [https://nodejs.org](https://nodejs.org)

---

## Installation

### 1. Navigate to the project directory

```bash
cd path/to/quantity-measurement-json-server
```

### 2. Install dependencies

```bash
npm install
```

This installs `json-server` as a devDependency into `node_modules/`.

> **PowerShell Execution Policy Error (Windows)**
>
> If you encounter the following error in PowerShell:
> ```
> File cannot be loaded because running scripts is disabled on this system.
> ```
> Run the following command in an **elevated (Administrator) PowerShell** session:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
> Alternatively, use **Command Prompt (cmd.exe)** instead of PowerShell — this error does not occur in cmd.

---

## Running the Application

```bash
npm start
```

This executes:

```bash
json-server db.json --port 3000 --static .
```

**Flags explained:**

| Flag | Purpose |
|---|---|
| `db.json` | Specifies the data source file for the REST API |
| `--port 3000` | Binds the server to port 3000 |
| `--static .` | Serves static files (HTML, CSS, JS) from the current directory |

> **Note:** `--watch` flag is intentionally omitted. With `--watch` enabled, JSON Server monitors `db.json` for changes and triggers a server reload — which, in combination with a browser's Live Server extension, causes an unwanted full page reload on every POST request (e.g., saving history). Removing `--watch` eliminates this side effect while all CRUD operations continue to function normally.

Once the server starts, the terminal output will be:

```
\{^_^}/ hi!

  Loading db.json
  Done

  Resources
  http://localhost:3000/users
  http://localhost:3000/history

  Home
  http://localhost:3000
```

Access the application at:

```
http://localhost:3000
```

> **Critical:** Do **not** open `index.html` via VS Code Live Server or the `file://` protocol.
> - **Live Server** watches the filesystem and reloads the page when `db.json` is modified by any POST/DELETE request — causing unwanted page blinks.
> - **`file://` protocol** blocks `fetch()` requests due to browser CORS restrictions.
>
> Always use **`http://localhost:3000`** exclusively.

---

## Application Modules

The application is organized into self-contained IIFE (Immediately Invoked Function Expression) modules, each with a single responsibility:

### `Session`
Manages `sessionStorage` for:
- `qm_session` — serialized authenticated user object
- `qm_state` — serialized dashboard state (`{ type, action }`)

Provides: `save()`, `get()`, `saveState()`, `getState()`, `clear()`

### `Auth`
Handles all authentication flows:
- `login()` — validates credentials via `UserAPI.authenticate()`, saves session, navigates to dashboard
- `signup()` — validates form inputs, calls `UserAPI.register()`, shows success popup
- `switchTab()` — toggles between Login and Signup forms, clears validation errors

### `UserAPI`
Abstracts HTTP calls to the `/users` endpoint:
- `findByEmail(email)` — GET with query parameter
- `register(user)` — duplicate check + POST
- `authenticate(email, password)` — credential verification

### `HistoryAPI`
Abstracts HTTP calls to the `/history` endpoint:
- `get(userId)` — GET with userId filter, sorted by id descending
- `add(userId, entry)` — POST new record
- `clearAll(userId)` — GET all user records + parallel DELETE

### `Calc`
Stateless computation module:
- `comparison(type)` — reads DOM values, normalizes to base unit, performs relational comparison
- `conversion(type)` — converts via base unit intermediary, updates readonly DOM field
- `arithmetic(type)` — independently normalizes both operands, performs operation in base space, converts result to selected output unit

### `App`
Top-level orchestrator:
- `selectType(type)` — updates state, persists to `sessionStorage`, refreshes unit dropdowns
- `selectAction(action)` — updates state, persists to `sessionStorage`, toggles UI panels
- `showDashboard(user)` — fresh login entry; resets state to defaults
- `restoreSession(user, state)` — page reload entry; restores previous state without reset
- `calculate()` — invokes `Calc`, renders result, POSTs to history, re-renders history list
- `logout()` — clears `currentUser`, clears `sessionStorage`, returns to auth view

### `Http`
Thin wrapper over the native Fetch API:
- `get(resource, query)` — constructs GET request with optional query string
- `post(resource, body)` — JSON POST with `Content-Type: application/json`
- `delete(resource, id)` — DELETE by resource ID

---

## Usage Guide

### Registration

1. Select the **SIGNUP** tab
2. Complete all fields — Name, Mobile, Email, Password
3. Click **Signup**
4. On success, a popup modal confirms account creation
5. Click **OK** to be redirected to the Login tab

### Authentication

1. Enter registered email and password
2. Click **Login**
3. On successful credential match, user is navigated to the dashboard

### Comparison

Determines which of two measurement values is greater when reduced to the same base unit.

1. Select measurement **Type** (e.g., Weight)
2. Select **Comparison** action
3. Enter Value 1 with its unit
4. Enter Value 2 with its unit
5. Click **Compare**
6. Result displays the relational expression (=, <, >) and the base-unit difference

### Conversion

Converts a value from one unit to another within the same measurement type.

1. Select measurement **Type**
2. Select **Conversion** action
3. Enter the source value and select the **FROM** unit
4. Select the **TO** unit
5. Click **Convert**
6. The TO field is readonly and auto-populated with the converted result

### Arithmetic

Performs arithmetic operations between two values with independent units. Both operands are normalized to the SI base unit before the operation is applied, and the result is then converted to the user's selected output unit.

1. Select measurement **Type**
2. Select **Arithmetic** action
3. Enter **Value 1** and its unit
4. Select an **operator** (+, -, ×, ÷)
5. Enter **Value 2** and its unit (can differ from Value 1's unit)
6. Select the **Result in** unit (desired output unit)
7. Click **Calculate**

**Example:** `5 Feet + 3 Meter = ? Centimeter`

Internal computation:
```
5 Feet    → 1.524 m (base)
3 Meter   → 3.000 m (base)
Sum       → 4.524 m (base)
4.524 m   → 452.4 Centimeter (output)
```

### History

- Every successful calculation is automatically persisted via POST to `/history`
- The history panel renders below the result box, sorted newest first
- Click **Clear All** to send DELETE requests for all history entries associated with the authenticated user

---

## REST API Reference

Base URL: `http://localhost:3000`

### Users

| Method | Endpoint | Request Body | Description |
|---|---|---|---|
| `GET` | `/users` | — | Retrieve all registered users |
| `GET` | `/users?email={email}` | — | Filter users by email address |
| `POST` | `/users` | `{ name, mobile, email, password }` | Create a new user record |

### History

| Method | Endpoint | Request Body | Description |
|---|---|---|---|
| `GET` | `/history?userId={id}` | — | Retrieve all history entries for a user |
| `GET` | `/history?userId={id}&_sort=id&_order=desc&_limit=50` | — | Retrieve latest 50 entries, newest first |
| `POST` | `/history` | `{ userId, type, action, value, note, ts }` | Persist a new calculation record |
| `DELETE` | `/history/{id}` | — | Delete a single history entry by ID |

---

## Database Schema

### Collection: `users`

```json
{
  "id": 1,
  "name": "Priyanshu Kumar",
  "mobile": "9876543210",
  "email": "priyanshu@example.com",
  "password": "Pass@123"
}
```

| Field | Type | Constraints |
|---|---|---|
| `id` | `number` | Auto-incremented by JSON Server |
| `name` | `string` | Required, non-empty |
| `mobile` | `string` | Exactly 10 digits |
| `email` | `string` | Required, unique, valid format |
| `password` | `string` | Min 8 chars, mixed case, digit, special char |

### Collection: `history`

```json
{
  "id": 1,
  "userId": 1,
  "type": "length",
  "action": "conversion",
  "value": "30.48 Centimeter",
  "note": "1 Feet = 30.48 Centimeter",
  "ts": "25/06/2025, 10:30:00 AM"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Auto-incremented primary key |
| `userId` | `number` | Foreign key referencing `users.id` |
| `type` | `string` | Measurement category: `length` / `weight` / `temperature` / `volume` |
| `action` | `string` | Operation type: `comparison` / `conversion` / `arithmetic` |
| `value` | `string` | Formatted result string |
| `note` | `string` | Full expression string (e.g., `1 Feet = 30.48 Centimeter`) |
| `ts` | `string` | ISO locale timestamp at time of calculation |

---

## Form Validations

### Signup Validations

| Field | Rule | Error Message |
|---|---|---|
| Full Name | Required | `Full name is required.` |
| Mobile | Regex: `^\d{10}$` | `Mobile number must be exactly 10 digits.` |
| Email | Regex: RFC 5322 simplified | `Enter a valid email address.` |
| Email | Unique constraint | `This email is already registered. Please login.` |
| Password | `length >= 8` | `Password must be at least 8 characters long.` |
| Password | `/[A-Z]/` | `Must contain at least one uppercase letter (A-Z).` |
| Password | `/[a-z]/` | `Must contain at least one lowercase letter (a-z).` |
| Password | `/[0-9]/` | `Must contain at least one number (0-9).` |
| Password | `/[^A-Za-z0-9]/` | `Must contain at least one special character (!@#$%...).` |

**Valid password example:** `Hello@123`

### Login Validations

| Field | Rule | Error Message |
|---|---|---|
| Email | Required + valid format | `Enter a valid email address.` |
| Email | Must exist in `/users` | `No account found with this email. Please signup first.` |
| Password | Required | `Password is required.` |
| Password | Must match stored value | `Incorrect password. Please try again.` |

---

## Session & State Management

### Authentication Session (`qm_session`)

- Stored in `sessionStorage` on successful login
- Contains the full user object returned by `UserAPI.authenticate()`
- Read during `App.init()` — if present, `restoreSession()` is invoked instead of showing the auth page
- Cleared via `sessionStorage.removeItem()` on logout

**Lifecycle:**
```
Login success  →  Session.save(user)  →  sessionStorage.setItem('qm_session', JSON)
Page refresh   →  App.init()  →  Session.get()  →  restoreSession()  →  dashboard restored
Logout         →  Session.clear()  →  sessionStorage cleared  →  auth page shown
Browser close  →  sessionStorage auto-cleared by browser  →  fresh login required next time
```

### Dashboard State (`qm_state`)

- Stored in `sessionStorage` whenever `selectType()` or `selectAction()` is called
- Contains `{ type: string, action: string }`
- Restored in `restoreSession()` — user is returned to the exact type and action they were on before the reload

**Why this matters:**
Without state persistence, any page reload (including those triggered by history save operations or accidental refreshes) would reset the dashboard to the default `length + comparison` view — disrupting the user's workflow.

---

## Known Issues & Resolutions

### Page blinks / reloads on calculation

**Cause:** VS Code Live Server monitors the filesystem. When a POST to `/history` modifies `db.json`, Live Server detects the file change and triggers a full browser reload.

**Resolution:**
- `--watch` flag removed from `json-server` command in `package.json`
- Application is served exclusively via `http://localhost:3000` (JSON Server's built-in static server)
- Live Server must not be used alongside this application

---

### Page reload causes logout and state reset

**Cause:** Application state (`currentUser`, `state`) was stored only in JavaScript memory (module-level variables). A page reload reinitializes the JS runtime, losing all in-memory state.

**Resolution:**
- `sessionStorage` is used to persist both the authenticated user object and the dashboard state
- `App.init()` checks `sessionStorage` on every page load — if a valid session is found, `restoreSession()` is called, bypassing the auth flow entirely

---

### `npm` command blocked in PowerShell

**Cause:** Windows PowerShell has a default execution policy (`Restricted`) that prevents running npm scripts.

**Resolution — Option A (elevated PowerShell):**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**Resolution — Option B (use CMD):**
```cmd
npm install
npm start
```

---

### `fetch()` fails when opening via `file://`

**Cause:** Browsers enforce the Same-Origin Policy. `fetch()` requests to `http://localhost:3000` from a `file://` origin are blocked as cross-origin requests.

**Resolution:** Always serve the application through JSON Server's static file server at `http://localhost:3000`. Never open `index.html` directly from the filesystem.

---

## Supported Units

### Length
`Millimeter`, `Centimeter`, `Meter`, `Kilometer`, `Inch`, `Feet`, `Yard`, `Mile`

### Weight
`Milligram`, `Gram`, `Kilogram`, `Tonne`, `Ounce`, `Pound`

### Temperature
`Celsius`, `Fahrenheit`, `Kelvin`

### Volume
`Milliliter`, `Liter`, `Cubic Meter`, `Teaspoon`, `Tablespoon`, `Cup`, `Fluid Ounce`, `Gallon`