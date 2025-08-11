# Beyond EMS - Sistem Absensi

Sistem absensi digital untuk Emergency Medical Services (EMS) di Beyond Roleplay server dengan integrasi Discord bot dan dashboard web yang modern.

## 🚨 Features

### 📱 Dashboard Web
- **Real-time Clock In/Out** - Sistem absensi real-time dengan tracking waktu otomatis
- **Dashboard Analytics** - Statistik personal jam kerja, ranking, dan performa
- **Attendance History** - Riwayat absensi dengan detail lokasi dan aktivitas
- **Responsive Design** - Tampilan optimal di desktop dan mobile
- **Dark Theme** - Interface modern dengan tema gelap

### 🤖 Discord Bot Integration
- **HTTP API** untuk Discord bot commands
- **Clock In/Out** via Discord commands
- **Leaderboard** ranking berdasarkan jam kerja
- **Active Members** monitoring anggota yang sedang bertugas
- **Status Check** untuk cek status absensi individual

### 🗄️ Database & Backend
- **Drizzle ORM** dengan Turso SQLite database
- **JWT Authentication** untuk security
- **RESTful API** endpoints
- **Real-time data sync**
- **Admin logging** untuk audit trail

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: Turso (SQLite)
- **Authentication**: JWT, Discord OAuth (ready)
- **UI Components**: Radix UI, Lucide Icons
- **Package Manager**: Bun

## 📋 Database Schema

### Tables
- **users** - Data anggota EMS (Discord ID, rank, department, total hours)
- **attendance** - Records absensi (clock in/out, duration, location, activity)
- **shifts** - Jadwal shift (morning/afternoon/night shifts)
- **leave_requests** - Pengajuan cuti/izin
- **performance_metrics** - Metrics performa bulanan
- **admin_logs** - Audit trail untuk admin actions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ atau Bun
- Turso account untuk database
- Discord application untuk bot integration

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd Absensi-Beyond-Hospital
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   # Database
   TURSO_DATABASE_URL=your_turso_database_url_here
   TURSO_AUTH_TOKEN=your_turso_auth_token_here
   
   # JWT Secret
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # Discord Bot
   DISCORD_BOT_TOKEN=your_discord_bot_token_here
   DISCORD_CLIENT_ID=your_discord_client_id_here
   
   # App Settings
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Setup database**
   ```bash
   # Generate migration
   bun run drizzle-kit generate
   
   # Push to database
   bun run drizzle-kit push
   ```

5. **Run development server**
   ```bash
   bun dev
   ```

   Open [http://localhost:3000](http://localhost:3000) dalam browser.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login dengan Discord credentials

### Attendance
- `POST /api/attendance` - Clock in/out
- `GET /api/attendance` - Get attendance history

### Discord Bot API
- `POST /api/discord` - Bot commands (clock_in, clock_out, status)
- `GET /api/discord?action=leaderboard` - Get leaderboard
- `GET /api/discord?action=active_members` - Get active members

### Leave Management
- `POST /api/leave` - Submit leave request
- `GET /api/leave` - Get leave requests

## 🤖 Discord Bot Commands

### Basic Commands
```
!clockin [lokasi] [aktivitas] - Clock in untuk memulai shift
!clockout [catatan] - Clock out untuk mengakhiri shift
!status - Cek status absensi saat ini
!leaderboard - Top 10 EMS berdasarkan jam kerja
!active - Lihat anggota yang sedang bertugas
```

### Example Usage
```
!clockin "Central Hospital" "Emergency Response"
!clockout "Shift selesai, 3 panggilan darurat"
!status
!leaderboard
!active
```

## 🔧 Discord Bot Setup

### Bot Headers Required
Untuk menggunakan API Discord bot, kirim header berikut:
```
X-Bot-Token: your_discord_bot_token_here
Content-Type: application/json
```

### Request Examples

**Clock In:**
```json
POST /api/discord
{
  "action": "clock_in",
  "discordId": "123456789",
  "username": "EMSUser",
  "location": "Central Hospital",
  "activity": "Emergency Response",
  "notes": "Starting shift"
}
```

**Clock Out:**
```json
POST /api/discord
{
  "action": "clock_out",
  "discordId": "123456789",
  "notes": "Shift completed"
}
```

**Status Check:**
```json
POST /api/discord
{
  "action": "status",
  "discordId": "123456789"
}
```

## 📊 Features Detail

### Attendance System
- **Auto Clock In/Out** - Sistem otomatis dengan validasi
- **Duration Tracking** - Perhitungan durasi kerja real-time
- **Location Logging** - Track lokasi tugas (Hospital, Fire Station, etc.)
- **Activity Notes** - Catatan aktivitas dan tugas yang dilakukan

### Analytics & Reporting
- **Personal Dashboard** - Statistik individual per user
- **Leaderboard System** - Ranking berdasarkan jam kerja
- **Monthly Reports** - Laporan bulanan per anggota
- **Performance Metrics** - Tracking performa dan attendance rate

### Admin Features
- **User Management** - Kelola anggota EMS
- **Attendance Override** - Edit/koreksi data absensi
- **Leave Approval** - Sistem persetujuan cuti
- **Audit Logs** - Track semua perubahan data

## 🎨 UI/UX Features

- **Modern Design** - Interface clean dengan gradien dan glass effect
- **Real-time Updates** - Data terupdate secara real-time
- **Mobile Responsive** - Optimal di semua device
- **Dark Theme** - Tema gelap yang nyaman dimata
- **Smooth Animations** - Transisi halus dan interactive

## 🔒 Security

- **JWT Tokens** - Secure authentication dengan JWT
- **API Rate Limiting** - Protection dari spam requests
- **Input Validation** - Validasi semua input data
- **SQL Injection Protection** - Drizzle ORM built-in protection
- **Bot Token Verification** - Discord bot authentication

## 📱 Mobile Support

Dashboard fully responsive dengan support untuk:
- iOS Safari
- Android Chrome
- Mobile browsers
- PWA ready (Progressive Web App)

## 🚀 Deployment

### Recommended Platforms
- **Vercel** (recommended) - Deploy langsung dari Git
- **Netlify** - Alternative hosting
- **Railway** - Full-stack hosting
- **VPS** - Self-hosted option

### Environment Setup
Pastikan semua environment variables sudah diset sebelum deploy:
- Database credentials (Turso)
- JWT secret (generate random string)
- Discord bot token
- App URL (production domain)

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

Project ini menggunakan MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 🆘 Support

Untuk bantuan dan pertanyaan:
- Create issue di GitHub repository
- Contact admin Beyond Roleplay
- Discord server Beyond Roleplay

## 🔮 Roadmap

### Future Features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Shift scheduling system
- [ ] Integration dengan voice channels Discord
- [ ] Payroll calculation system
- [ ] Photo verification untuk clock in/out
- [ ] Geolocation tracking
- [ ] Push notifications
- [ ] Multi-language support

---

**Beyond EMS** - Professional attendance system for Emergency Medical Services roleplay server.

Made with ❤️ for Beyond Roleplay Community
