# Quantity Measurement Frontend (Angular)

## 🗓 Day 2 – UC20: Angular frontend for the Quantity Measurement Spring Boot backend.
*(Date: 1-April-2026)*

## Project Structure

```
src/app/
├── models/
│   ├── user.ts           # User, LoginRequest, AuthResponse interfaces
│   └── measurement.ts    # QuantityDTO, units, enums
├── services/
│   ├── auth.ts           # Login, Signup, Logout, Refresh Token
│   └── measurement.ts    # All /api/user/quantities/* endpoints
├── guards/
│   └── auth-guard.ts     # Protects /measurement, /history, /dashboard
├── interceptors/
│   └── jwt-interceptor.ts # Auto-adds Bearer token + 401 refresh
├── pages/
│   ├── login/            # Login form
│   ├── signup/           # Signup form
│   ├── measurement/      # Main calculator (Compare/Convert/Arithmetic)
│   ├── history/          # Operation history from backend
│   └── dashboard/        # Stats & quick access
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure backend URL
Edit `src/environments/environment.ts`:
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',  // your Spring Boot URL
};
```

### 3. Run
```bash
ng serve
# Opens at http://localhost:4200
```

## Backend API Endpoints Used

| Feature      | Method | URL |
|-------------|--------|-----|
| Signup      | POST   | `/api/auth/signup` |
| Login       | POST   | `/api/auth/login` |
| Logout      | POST   | `/api/auth/logout` |
| Refresh     | POST   | `/api/auth/refresh` |
| Compare     | POST   | `/api/user/quantities/compare` |
| Convert     | POST   | `/api/user/quantities/convert` |
| Add         | POST   | `/api/user/quantities/add-with-target-unit` |
| Subtract    | POST   | `/api/user/quantities/subtract` |
| Multiply    | POST   | `/api/user/quantities/multiply` |
| Divide      | POST   | `/api/user/quantities/divide` |
| History     | GET    | `/api/user/quantities/history/operation/{op}` |
| Count       | GET    | `/api/user/quantities/count/{op}` |

## Routes

| Path | Component | Guard |
|------|-----------|-------|
| `/login` | LoginComponent | — |
| `/signup` | SignupComponent | — |
| `/measurement` | MeasurementComponent | ✅ Auth |
| `/history` | HistoryComponent | ✅ Auth |
| `/dashboard` | DashboardComponent | ✅ Auth |

## CORS Note

The proxy config (`src/proxy.conf.json`) forwards `/api/*` to `http://localhost:8080` 
during development to avoid CORS issues. For production, configure CORS on the backend:

```java
// SecurityConfig.java mein add karo:
.cors(cors -> cors.configurationSource(request -> {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:4200"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    return config;
}))
```
🔗 *Code Link:*  
[Day 1 – Angular frontend for the Quantity Measurement Spring Boot backend](https://github.com/priyanshu-kumar-2511/QuantityMeasurementApp-Frontend/tree/feature/frontend-html-css-angular)

## 🗓 Day 3 – UC20: Angular Project Setup and Routing Configuration
*(Date: 11-April-2026)*

- Initialized Angular 21 standalone component project for the Quantity Measurement Application.
- Configured lazy-loaded routing using `loadComponent` for all pages.
- Implemented `AuthGuard` (`CanActivateFn`) to protect measurement, history, and dashboard routes — unauthenticated users redirected to `/login`.
- Created the base folder structure:
  - `pages/` — Login, Signup, Forgot-Password, Measurement, History, Dashboard
  - `services/` — AuthService, MeasurementService
  - `models/` — User, Measurement interfaces
  - `guards/` — AuthGuard
  - `interceptors/` — JwtInterceptor
- Defined application routes:
  - `/login` → LoginComponent
  - `/signup` → SignupComponent
  - `/forgot-password` → ForgotPasswordComponent
  - `/measurement` → MeasurementComponent *(protected)*
  - `/history` → HistoryComponent *(protected)*
  - `/dashboard` → DashboardComponent *(protected)*
  - `**` → redirects to `/login`

## Models and Type Definitions

- Defined all TypeScript interfaces and type aliases for the application.
- `QuantityDTO` — represents a single quantity with `value`, `unit`, and `measurementType`.
- `QuantityInputDTO` — wraps `thisQuantityDTO`, `thatQuantityDTO`, and optional `targetQuantityDTO` for API requests.
- `QuantityMeasurementDTO` — mirrors backend response with `resultValue`, `resultUnit`, `resultString`, `error`, `errorMessage` etc.
- `MeasurementType` — union type: `'LengthUnit' | 'VolumeUnit' | 'WeightUnit' | 'TemperatureUnit'`
- `ActionType` — union type: `'comparison' | 'conversion' | 'arithmetic'`
- `MEASUREMENT_UNITS` — constant map of unit options per measurement type:
  - Length: FEET, INCHES, YARDS, CENTIMETERS
  - Volume: LITER, MILLILITER, GALLON
  - Weight: MILLIGRAM, GRAM, KILOGRAM, POUND, TONNE
  - Temperature: CELSIUS, FAHRENHEIT, KELVIN
- `MEASUREMENT_LABELS` — display labels mapped from type keys to human-readable names.
- `User`, `SignUpRequest`, `LoginRequest`, `AuthResponse` — interfaces for user/auth domain.

## JWT Interceptor and Auth Service

- Implemented `JwtInterceptor` as a functional `HttpInterceptorFn` (Angular 21 style).
- Main Flow:
  - On every outgoing HTTP request, interceptor reads JWT from `sessionStorage`.
  - Auth routes (`/api/auth/login`, `/api/auth/signup`, `/api/auth/refresh`) are skipped — no token attached.
  - For all other routes, `Authorization: Bearer <token>` header is cloned onto the request.
  - On `401 Unauthorized` response — interceptor calls `AuthService.refreshToken()` once and retries the original request with the new token.
  - If refresh also fails → `AuthService.logout()` called → user redirected to `/login`.
- Implemented `AuthService` with full authentication lifecycle:
  - `signup()` — POST `/api/auth/register`
  - `login()` — POST `/api/auth/login` → stores `accessToken` + `refreshToken` + user in `sessionStorage` → fetches full user profile from `/api/user/me`
  - `logout()` — POST `/api/auth/logout` → clears `sessionStorage` → navigates to `/login`
  - `loginWithGoogle()` — redirects browser to backend OAuth2 authorize URL
  - `handleOAuthCallback()` — called after Google redirect — stores tokens → fetches profile → updates `currentUserSubject`
  - `refreshToken()` — POST `/api/auth/refresh` → updates stored access token
  - `isLoggedIn()` — checks `sessionStorage` for token
  - `getCurrentUser()` — returns current user from `BehaviorSubject`
- `currentUser$` — `Observable<User | null>` for reactive UI updates across components.

## Login, Signup, and Forgot Password Pages

- Created `LoginComponent` with:
  - Email and password form fields with validation.
  - `login()` calls `AuthService.login()` → navigates to `/measurement` on success.
  - `loginWithGoogle()` button calls `AuthService.loginWithGoogle()` for OAuth2 flow.
  - On page load, checks URL query params for `token` and `refreshToken` — handles Google OAuth2 redirect callback using `handleOAuthCallback()`.
  - Error messages displayed for invalid credentials.
- Created `SignupComponent` with:
  - `firstName`, `lastName`, `email`, `mobileNo`, `password` fields.
  - Calls `AuthService.signup()` → shows success message → redirects to `/login`.
  - Password strength and field validation.
- Created `ForgotPasswordComponent` with:
  - Step 1: Enter email → POST `/api/auth/forgotPassword/{email}` → OTP sent.
  - Step 2: Enter OTP + new password → POST `/api/auth/resetPassword/{email}` → password updated.
  - Two-step UI flow with state management.

## Measurement Service and Dashboard

- Implemented `MeasurementService` with all quantity operation API calls:
  - `compare()` — POST `/api/user/quantities/compare`
  - `convert()` — POST `/api/user/quantities/convert`
  - `add()` — POST `/api/user/quantities/add`
  - `addWithTarget()` — POST `/api/user/quantities/add-with-target-unit`
  - `subtract()` — POST `/api/user/quantities/subtract`
  - `multiply()` — POST `/api/user/quantities/multiply`
  - `divide()` — POST `/api/user/quantities/divide`
  - `getHistoryByOperation()` — GET `/api/user/quantities/history/operation/{op}`
  - `getHistoryByType()` — GET `/api/user/quantities/history/type/{type}`
  - `getOperationCount()` — GET `/api/user/quantities/count/{op}`
  - `deleteAllHistory()` — DELETE `/api/user/quantities/history/all`
  - `deleteHistoryById()` — DELETE `/api/user/quantities/history/{id}`
  - `getErrorHistory()` — GET `/api/user/quantities/history/errored`
- Created `DashboardComponent`:
  - Displays welcome message with user's first name.
  - Shows quick action cards — navigate to Measurement page or History page.
  - Logout button clears session and redirects to login.

## Measurement Page (Compare, Convert, Arithmetic)

- Created `MeasurementComponent` — the core page for all quantity operations.
- Main Flow:
  - User selects **measurement type** (Length, Volume, Weight, Temperature) from type selector — units refreshed automatically.
  - User selects **action** (Comparison, Conversion, or Arithmetic) — UI panel switches accordingly.
  - On **Compare**: builds `QuantityInputDTO` with `thisQuantityDTO` and `thatQuantityDTO` → calls `MeasurementService.compare()` → reads `resultString` from response to display `true`/`false` result.
  - On **Convert**: builds `QuantityInputDTO` → calls `MeasurementService.convert()` → reads `resultValue` and `resultUnit` from response → displays formatted result.
  - On **Arithmetic** (+, -, ×, ÷): builds `QuantityInputDTO` with `targetQuantityDTO` for explicit result unit → calls corresponding service method → reads `resultValue` and `resultUnit`.
  - `loading` flag shows spinner during API calls; `apiError` displays backend error messages.
  - Session history maintained in-component (`historyList[]` — last 50 entries).
  - `fmt()` utility for smart number formatting (scientific notation for very small/large values, 7 significant figures otherwise).
- Type icons mapped: 📏 Length, 🧴 Volume, ⚖️ Weight, 🌡️ Temperature.
- Navigate to `/history` page via `goToHistory()`.

## History Page with Filters and Delete Operations

- Created `HistoryComponent` — displays persistent operation history fetched from backend.
- Main Flow:
  - On `ngOnInit()`, fetches history for all 6 operations (COMPARE, CONVERT, ADD, SUBTRACT, MULTIPLY, DIVIDE) in parallel using 6 concurrent API calls.
  - All results merged into `records[]` and sorted by `id` descending (newest first).
  - `mapRecord()` normalizes backend response fields (`thisValue`, `thisUnit`, `thatValue`, `thatUnit`, `resultValue`, `resultUnit`, `createdAt`) into display-friendly strings.
  - **Filter by Operation** — dropdown filters `records[]` by `displayOp`.
  - **Filter by Type** — dropdown filters by `measurementType` (Length, Volume, Weight, Temperature).
  - **Search** — text search across `displayInput` and `displayResult` fields.
  - `applyFilters()` combines all three filters with AND logic into `filtered[]`.
  - `clearFilters()` resets all filter state.
  - **Delete All** — `deleteAll()` calls `MeasurementService.deleteAllHistory()` → reloads all records.
  - **Delete by ID** — `deleteById(id)` calls `MeasurementService.deleteHistoryById(id)` → removes record locally from `records[]` without full reload.
  - Error entries displayed with `⚠ Error` badge.

## Microservices Backend Integration

- Migrated all API calls from monolith URL to **API Gateway** at `http://localhost:8080`.
- Key fixes made during microservices integration:
  - Fixed comparison result — reads `resultString` field from `QuantityMeasurementDTO` (was previously reading wrong field, showing incorrect output).
  - Fixed history deletion — passes `item.id` correctly as path variable to `deleteHistoryById(id)`.
  - Fixed login, signup, forgot-password, reset-password — matched URL contracts exactly to microservices auth-service endpoints.
  - Fixed Google OAuth2 callback — `handleOAuthCallback()` correctly reads `?token=` and `?refreshToken=` from URL query params after redirect.
- `AuthService.loginWithGoogle()` — redirects directly to auth-service (port 8083) instead of gateway, since OAuth2 redirect URI must hit backend directly.
- `AuthService.login()` — after storing tokens, fetches full user profile from `/api/user/me` and updates `currentUserSubject` with firstName + lastName.
- All tokens stored in `sessionStorage` (not `localStorage`) for security.

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (Standalone Components) |
| Language | TypeScript 6 |
| HTTP | Angular HttpClient + Functional Interceptors |
| State Management | RxJS BehaviorSubject |
| Auth | JWT (sessionStorage) + Google OAuth2 |
| Routing | Angular Router with Lazy Loading + AuthGuard |
| Testing | Jasmine + Karma |
| Build | Angular CLI (`ng build`) |

## 📁 Project Structure

```
src/app/
├── guards/
│   └── auth-guard.ts          # CanActivateFn — protects measurement, history, dashboard
├── interceptors/
│   └── jwt-interceptor.ts     # Attaches JWT, handles 401 + auto refresh
├── models/
│   ├── measurement.ts         # QuantityDTO, QuantityInputDTO, QuantityMeasurementDTO, MEASUREMENT_UNITS
│   └── user.ts                # User, SignUpRequest, LoginRequest, AuthResponse
├── services/
│   ├── auth.ts                # AuthService — login, signup, logout, OAuth2, refresh
│   └── measurement.ts         # MeasurementService — all 13 API methods
└── pages/
    ├── login/                 # Login + Google OAuth2 callback handler
    ├── signup/                # User registration
    ├── forgot-password/       # 2-step OTP password reset
    ├── dashboard/             # Home page with navigation cards
    ├── measurement/           # Compare, Convert, Arithmetic operations
    └── history/               # Persistent history with filter + delete
```

## 🚀 Run Locally

```bash
npm install
ng serve
```

App runs at: `http://localhost:4200`

> Make sure the Microservices backend (API Gateway at port 8080) is running first.

🔗 *Code Link:*  
[Day 3 – Microservices Backend Integration](https://github.com/priyanshu-kumar-2511/QuantityMeasurementApp-Frontend/tree/feature/frontend-html-css-angular_microservices)


🔗 *Backend Repository:*  
[QuantityMeasurementApp — Microservices](https://github.com/priyanshu-kumar-2511/QuantityMeasurementApp/tree/feature/UC21-Microservices-Architectures)
