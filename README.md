# Fitness Day 1

## Setup

```bash
cp .env.example .env        # fill in your DB credentials
npm install
npm run migrate             # creates all tables
npm run dev                 # starts with nodemon
```

## Project structure

```
src/
├── config/
│   ├── db.js               # MySQL pool
│   └── migrate.js          # schema migration 
├── controllers/
│   ├── authController.js
│   └── profileController.js
├── middleware/
│   ├── auth.js             # JWT verification
│   └── validate.js         # express-validator error formatter
├── routes/
│   ├── auth.js
│   └── profile.js
├── utils/
│   └── fitness.js          # BMI / BMR / TDEE formulas
├── app.js
└── server.js
```

---

## API Reference

### Auth

#### POST /api/auth/register
```json
{
  "email": "ali@example.com",
  "password": "Test1234"
}
```
Response `201`:
```json
{
  "success": true,
  "data": { "token": "eyJ...", "user": { "id": 1, "email": "ali@example.com" } }
}
```

#### POST /api/auth/login
```json
{ "email": "ali@example.com", "password": "Test1234" }
```

#### POST /api/auth/forgot-password
```json
{ "email": "ali@example.com" }
```

#### POST /api/auth/reset-password
```json
{ "token": "<reset_token>", "new_password": "NewPass1234" }
```

---

### Profile  (all require `Authorization: Bearer <token>`)

#### POST /api/profile — create profile
```json
{
  "full_name": "Ali",
  "age": 27,
  "gender": "male",
  "height_cm": 178,
  "weight_kg": 80,
  "activity_level": "lightly_active",
  "goal": "weight_loss"
}
```

#### GET /api/profile — get profile + computed stats
#### PUT /api/profile — update any fields (partial update supported)

#### GET /api/profile/stats — BMI / BMR / TDEE only
Response:
```json
{
  "success": true,
  "data": {
    "bmi": 25.25,
    "bmi_classification": { "key": "overweight", "label": "زائد" },
    "bmr": 1876.5,
    "tdee": 2580.19
  }
}
```

---

## Activity level values
| Value | Description |
|---|---|
| `sedentary` | Little/no exercise |
| `lightly_active` | 1–3 days/week |
| `moderately_active` | 3–5 days/week |
| `very_active` | 6–7 days/week |
| `extra_active` | Physical job + training |

## Goal values
`weight_loss` · `muscle_gain` · `general_fitness`
