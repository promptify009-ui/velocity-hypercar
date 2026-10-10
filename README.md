# VELOCITY — Hypercar Configurator Backend

A FastAPI + SQLAlchemy + SQLite backend for a fictional hypercar configurator. Users register, browse cars and options, build a configuration, save it to their garage, and share it by a public Build ID. The server validates every selection and calculates price and performance itself — it never trusts client-supplied numbers.

## Features
- JWT authentication (register / login / me), bcrypt password hashing
- Cars and customization options (paint, wheels, calipers, interior, engine, performance package, aero)
- Server-side **price** and **performance** calculation
- Save / list / view / edit / delete configurations (owner-only)
- Unique random Build IDs (e.g. `VX-8F29A`) and a public shared-build endpoint
- Garage summary endpoint
- Idempotent auto-seeding, Swagger docs, 70+ pytest tests, works fully offline

## Technology Stack
Python 3.11+, FastAPI, Uvicorn, SQLAlchemy 2.x, SQLite, Pydantic v2 + pydantic-settings, PyJWT, pwdlib (bcrypt), pytest, httpx.

## Project Structure
```
velocity-backend/
├── app/
│   ├── main.py              # app, CORS, startup (create tables + seed), / and /health
│   ├── core/                # config.py (env settings), security.py (hashing, JWT)
│   ├── db/                  # database.py (engine/session), seed.py (idempotent seed)
│   ├── models/              # SQLAlchemy tables: user, car, options, configuration
│   ├── schemas/             # Pydantic request/response models
│   ├── routers/             # thin HTTP layer: auth, cars, options, configurations (+garage)
│   ├── services/            # business logic: auth, configuration, pricing, performance
│   └── utils/build_id.py    # secure Build ID generation/validation
├── tests/                   # pytest suite
├── .env.example  .gitignore  requirements.txt  run.py
```
Request flow: `router → configuration_service → pricing_service / performance_service → SQLAlchemy → SQLite`.

## Installation
### Virtual environment (Windows)
```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
macOS/Linux: `python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`

### Environment setup
Copy `.env.example` to `.env`:
```
copy .env.example .env        (Windows)
cp .env.example .env          (macOS/Linux)
```
`JWT_SECRET_KEY` is the secret used to sign login tokens. Replace `CHANGE_THIS_SECRET` with a long random value, e.g. `python -c "import secrets; print(secrets.token_hex(32))"`. Never commit `.env`.

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | default `sqlite:///./velocity.db` |
| `JWT_SECRET_KEY` / `JWT_ALGORITHM` | token signing secret / algorithm (HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | token lifetime (60) |
| `CORS_ORIGINS` | comma-separated allowed frontend origins |
| `DEBUG` | `true` enables auto-reload in `run.py` |

## Database
SQLite — a single file `velocity.db` is created automatically on first start, tables are created, and seed data is inserted if missing. Seeding is idempotent (safe to repeat; also `python -m app.db.seed`). Delete `velocity.db` to reset everything.

## Running
```
python run.py
# or
uvicorn app.main:app --reload
```
- API: http://127.0.0.1:8000
- Swagger docs: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

## Running Tests
```
pytest
```
Tests use an isolated in-memory database; your `velocity.db` is never touched.

## Frontend Connection
The React/Vite frontend should use `http://127.0.0.1:8000` as its API base URL (CORS allows `http://localhost:5173` and `http://127.0.0.1:5173` by default). Send `Authorization: Bearer <token>` on protected requests.

## API Endpoints
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` , `/health` | – | API info, health |
| POST | `/api/auth/register` | – | Create account (201) |
| POST | `/api/auth/login` | – | Body `{email, password}` → `{access_token, token_type, user}` |
| GET | `/api/auth/me` | ✔ | Current user |
| GET | `/api/cars`, `/api/cars/{id}` | – | Active cars |
| GET | `/api/options` | – | All options grouped by category |
| GET | `/api/options/{paints, wheels, calipers, interior-materials, interior-colors, seat-types, engines, performance-packages, aero-packages}` | – | One category |
| POST | `/api/configurations` | ✔ | Create build (201) |
| GET | `/api/configurations` | ✔ | My builds (full detail) |
| GET | `/api/configurations/{id}` | ✔ | One of my builds (403 if not mine) |
| PUT | `/api/configurations/{id}` | ✔ | Partial update; price/stats recalculated |
| DELETE | `/api/configurations/{id}` | ✔ | Delete (owner only) |
| GET | `/api/configurations/build/{build_id}` | – | Public shared build |
| GET | `/api/garage` | ✔ | `{builds: [{id, build_id, name, car, price, created_at, updated_at}]}` |

Status codes: 400 invalid selection / malformed Build ID, 401 not authenticated, 403 not the owner, 404 not found, 409 duplicate email/username, 422 validation, 500 generic JSON error.

### Notes for the frontend developer
- Create request: option IDs plus `name`. Any price/stat fields you send are ignored.
- Responses use `pricing` (`base_price`, `options_total`, `final_price`) and `performance.stats`.
- The public shared-build response has the same shape as a private one except it has no internal `id`, includes full `car` details, and contains no user information.
- Build IDs are case-insensitive on lookup, format `VX-` + 5 hex characters.
- Calculation rules: price = car base + sum of all nine option modifiers (integer INR). Stats = car stats + engine + performance package (+ aero for handling/top speed). Acceleration floor 1.0 s; handling and braking clamped to 0–100. Wheel `performance_modifier` is stored but not applied.

## Seed Data
3 active vehicles (Porsche 911 GT3 RS, Suzuki Swift, Apex F1-GT), 6 paints, 4 wheels, 4 calipers, 3 interior materials, 4 interior colours, 3 seat types, 5 vehicle-specific powertrains, 6 performance packages, and 5 aero packages. Apex F1-GT's `model_url` and thumbnail path are placeholders until its GLB and PNG assets are supplied.

## Example Requests
```
POST /api/auth/register
{"email": "user@example.com", "username": "arya", "password": "password123"}

POST /api/auth/login
{"email": "user@example.com", "password": "password123"}

POST /api/configurations      (Authorization: Bearer <token>)
{"car_id": 2, "paint_id": 1, "wheel_id": 2, "caliper_id": 1, "interior_material_id": 2,
 "interior_color_id": 1, "seat_type_id": 2, "engine_id": 4, "performance_package_id": 4,
 "aero_package_id": 4, "name": "Black Beast"}
```
Expected result for that build (Porsche 911 GT3 RS with Weissach options): final price 42,275,000 INR; 595 hp, 302 km/h, 3.0 s, handling 100, braking 100.

## 3D cars
The backend decides which cars exist (`/api/cars`); the frontend renders each car's own GLB from `assets/models/<slug>.glb`.
Only cars listed in `app/db/seed.py` are served. See `frontend/vehicle-assets.md` for how to add a model or car, and `assets/models/README.md`.
