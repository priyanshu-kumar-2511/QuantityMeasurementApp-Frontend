# Quantity Measurement Frontend (Angular)

Angular 21 frontend for the Quantity Measurement Spring Boot backend.

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
