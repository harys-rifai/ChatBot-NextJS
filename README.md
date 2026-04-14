# AI Chatbot - Next.js Application

Web chatbot dengan integrasi AI menggunakan Kilo AI API.

## Tech Stack

- **Framework:** Next.js 16
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** NextAuth.js
- **AI:** Kilo AI API

## Fitur

- Login/Register user
- Chat dengan AI (Kilo AI)
- Riwayat chat per user (disimpan di database)
- Manajemen user untuk admin

## Setup

### 1. Clone & Install

```bash
cd chatbot-web
npm install
```

### 2. Environment Variables

Buat file `.env`:

```env
DATABASE_URL="postgresql://postgres:@localhost:5432/chatbot_db"
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=your-kilo-ai-api-key
```

### 3. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema ke database
npx prisma db push
```

### 4. Run

```bash
npm run dev
```

Buka http://localhost:3000

## Database Schema

### User Table

```sql
CREATE TABLE "User" (
  id        TEXT   PRIMARY KEY DEFAULT uuid(),
  email     TEXT   UNIQUE,
  name      TEXT,
  password  TEXT,
  role      TEXT   DEFAULT 'USER',
  isActive  BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT now(),
  updatedAt TIMESTAMP DEFAULT now()
);
```

### ChatHistory Table

```sql
CREATE TABLE "ChatHistory" (
  id        TEXT   PRIMARY KEY DEFAULT uuid(),
  userId    TEXT   NOT NULL,
  userEmail TEXT   NOT NULL,
  role      TEXT   NOT NULL,
  content   TEXT   NOT NULL,
  createdAt TIMESTAMP DEFAULT now(),
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE
);
```

## Default Users

| Email | Password | Role |
|-------|----------|------|
| harys@google.com | (dari database lama) | ADMIN |
| cahya@gmail.com | (dari database lama) | ADMIN |

## API Routes

- `POST /api/chat` - Kirim pesan chat
- `GET /api/chat` - Ambil riwayat chat
- `POST /api/auth/register` - Register user
- `POST /api/auth/[...nextauth]` - Authentication

## AI Configuration

- **Endpoint:** https://api.kilo.ai/v1/chat
- **Model:** kilo-mini
- **Temperature:** 0.7

Response dalam Bahasa Indonesia.

## Deploy ke Vercel

1. Push ke GitHub
2. Import project di Vercel
3. Set environment variables
4. Deploy

```bash
git push origin main
```