# Absensi Beyond Hospital

Sistem absensi dan manajemen kehadiran untuk Beyond EMS (Emergency Medical Services) dengan integrasi Discord Bot dan dashboard web admin.

---

## Fitur Utama
- **Absensi via Web & Discord**: On duty dan off duty melalui dashboard web atau bot Discord
- **Leaderboard**: Leaderboard jam kerja anggota
- **Manajemen User**: Admin dapat mengelola user, jabatan, dan status
- **Integrasi Discord**: Otentikasi dan absensi langsung dari Discord
- **Statistik Mingguan & Bulanan**
- **API RESTful**: Endpoint untuk integrasi eksternal

---


## Instalasi & Setup
1. **Clone repo**
   ```bash
   git clone https://github.com/idMJA/Absensi-Beyond-Hospital.git
   cd Absensi-Beyond-Hospital
   ```
2. **Install dependencies**
   ```bash
   bun install
   # atau
   npm install
   ```
3. **Copy & edit file environment**
   ```bash
   cp .env.example .env
   # Edit .env sesuai kebutuhan (lihat penjelasan di bawah)
   ```
4. **Jalankan development server**
   ```bash
   bun run dev
   # atau
   npm run dev
   ```

---

## Konfigurasi Environment (.env)
- `TURSO_DATABASE_URL` & `TURSO_AUTH_TOKEN`: Koneksi database (Turso/LibSQL)
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`: OAuth Discord
- `DISCORD_AUTH_API`: Random string untuk auth API bot
- `NEXT_PUBLIC_APP_URL`: URL web (misal: http://localhost:3000)

---

## API Utama
### **Absensi Web**
- `GET /api/attendance` — Data user, absensi aktif, dan riwayat
- `POST /api/attendance` — Clock in/out (body: `{ action: "clock_in" | "clock_out" }`)

### **API Discord Bot**
- `POST /api/discord` — Perintah dari bot Discord (header: `x-bot-token`)
  - Body contoh:
    ```json
    {
      "action": "clock_in",
      "discordId": "123456789012345678",
      "username": "mjba#0"
    }
    ```
- `GET /api/discord?action=leaderboard` — Leaderboard
- `GET /api/discord?action=active_members` — Anggota aktif

---

## Contoh Request (curl)
**Clock In via Discord Bot:**
```bash
curl -X POST http://localhost:3000/api/discord \
  -H "Content-Type: application/json" \
  -H "x-bot-token: <DISCORD_AUTH_API>" \
  -d '{
    "action": "clock_in",
    "discordId": "123456789012345678",
    "username": "mjba#0"
  }'
```

**Leaderboard:**
```bash
curl -X GET "http://localhost:3000/api/discord?action=leaderboard" \
  -H "x-bot-token: <DISCORD_AUTH_API>"
```

---

## Pengembangan
- **Frontend**: Next.js App Router, TailwindCSS
- **Backend**: Next.js API Route, Drizzle ORM, Turso/LibSQL
- **Bot Discord**: Integrasi via API endpoint

---

## Lisensi
MIT
