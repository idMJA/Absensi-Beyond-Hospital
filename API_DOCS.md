# Beyond EMS API Documentation

Dokumentasi lengkap API endpoints untuk sistem absensi Beyond EMS.

## Base URL
```
http://localhost:3000/api  # Development
https://your-domain.com/api  # Production
```

## Authentication

Sebagian besar endpoint memerlukan JWT token dalam header:
```
Authorization: Bearer <your_jwt_token>
```

Untuk Discord bot endpoints, gunakan:
```
X-Bot-Token: <your_discord_bot_token>
```

## Endpoints

### 🔐 Authentication

#### POST /auth/login
Login dengan kredensial Discord untuk mendapatkan JWT token.

**Request Body:**
```json
{
  "discordId": "123456789",
  "username": "EMSUser",
  "displayName": "EMS User Demo",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "discordId": "123456789",
    "username": "EMSUser",
    "displayName": "EMS User Demo",
    "rank": "Rookie",
    "department": "EMS",
    "totalHours": 0
  }
}
```

### ⏰ Attendance System

#### POST /attendance
Clock in atau clock out untuk absensi.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Clock In Request:**
```json
{
  "action": "clock_in",
  "location": "Central Hospital",
  "activity": "Emergency Response",
  "notes": "Starting shift"
}
```

**Clock In Response:**
```json
{
  "success": true,
  "message": "Successfully clocked in",
  "attendance": {
    "id": 1,
    "userId": 1,
    "discordId": "123456789",
    "clockIn": "2024-12-30T10:00:00.000Z",
    "location": "Central Hospital",
    "activity": "Emergency Response",
    "status": "active"
  }
}
```

**Clock Out Request:**
```json
{
  "action": "clock_out",
  "notes": "Shift completed successfully"
}
```

**Clock Out Response:**
```json
{
  "success": true,
  "message": "Successfully clocked out",
  "attendance": {
    "id": 1,
    "clockOut": "2024-12-30T18:00:00.000Z",
    "duration": 480,
    "status": "completed"
  },
  "duration": "8h 0m"
}
```

#### GET /attendance
Mendapatkan riwayat absensi user.

**Query Parameters:**
- `limit` (optional): Jumlah record yang diambil (default: 10)
- `offset` (optional): Offset untuk pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "activeAttendance": {
    "id": 2,
    "clockIn": "2024-12-30T10:00:00.000Z",
    "location": "Fire Station",
    "activity": "Standby",
    "status": "active"
  },
  "attendanceHistory": [
    {
      "id": 1,
      "clockIn": "2024-12-29T09:00:00.000Z",
      "clockOut": "2024-12-29T17:00:00.000Z",
      "duration": 480,
      "location": "Central Hospital",
      "status": "completed"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

### 🤖 Discord Bot Integration

#### POST /discord
Endpoint utama untuk Discord bot commands.

**Headers:**
```
X-Bot-Token: <discord_bot_token>
Content-Type: application/json
```

**Clock In via Bot:**
```json
{
  "action": "clock_in",
  "discordId": "123456789",
  "username": "EMSUser",
  "location": "Central Hospital",
  "activity": "Emergency Response",
  "notes": "Starting shift via Discord"
}
```

**Clock Out via Bot:**
```json
{
  "action": "clock_out",
  "discordId": "123456789",
  "notes": "Shift completed via Discord"
}
```

**Status Check via Bot:**
```json
{
  "action": "status",
  "discordId": "123456789"
}
```

**Bot Response Format:**
```json
{
  "success": true,
  "message": "<@123456789> berhasil clock in di **Central Hospital**",
  "data": {
    "attendance": { /* attendance object */ },
    "user": {
      "username": "EMSUser",
      "rank": "Paramedic",
      "totalHours": 2450
    }
  }
}
```

#### GET /discord?action=leaderboard
Mendapatkan leaderboard top 10 EMS berdasarkan jam kerja.

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "username": "TopEMS",
        "discordId": "987654321",
        "position": "Chief",
        "totalHours": "125h 30m",
        "totalMinutes": 7530
      }
    ]
  }
}
```

#### GET /discord?action=active_members
Mendapatkan daftar anggota yang sedang bertugas.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeMembers": [
      {
        "username": "EMSUser",
        "discordId": "123456789",
        "rank": "Paramedic",
        "location": "Central Hospital",
        "clockInTime": "2024-12-30T10:00:00.000Z",
        "activity": "Emergency Response",
        "duration": "120 minutes"
      }
    ],
    "count": 1
  }
}
```

### 📋 Leave Management

#### POST /leave
Mengajukan permohonan cuti/izin.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request:**
```json
{
  "startDate": "2024-12-31T00:00:00.000Z",
  "endDate": "2025-01-02T23:59:59.000Z",
  "reason": "Family vacation",
  "type": "vacation"
}
```

**Valid Types:**
- `sick` - Sakit
- `vacation` - Liburan
- `personal` - Keperluan pribadi
- `emergency` - Darurat

**Response:**
```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "leaveRequest": {
    "id": 1,
    "userId": 1,
    "startDate": "2024-12-31T00:00:00.000Z",
    "endDate": "2025-01-02T23:59:59.000Z",
    "reason": "Family vacation",
    "type": "vacation",
    "status": "pending"
  }
}
```

#### GET /leave
Mendapatkan daftar permohonan cuti user.

**Query Parameters:**
- `status` (optional): Filter berdasarkan status (pending, approved, rejected)
- `limit` (optional): Jumlah record (default: 10)
- `offset` (optional): Offset pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "leaveRequests": [
    {
      "id": 1,
      "startDate": "2024-12-31T00:00:00.000Z",
      "endDate": "2025-01-02T23:59:59.000Z",
      "reason": "Family vacation",
      "type": "vacation",
      "status": "pending",
      "createdAt": "2024-12-30T08:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

## Error Responses

Semua error menggunakan format standar:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE"  // Optional
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Example Error Responses

**401 Unauthorized:**
```json
{
  "error": "Authorization token required"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid action. Use 'clock_in' or 'clock_out'"
}
```

**400 Already Clocked In:**
```json
{
  "success": false,
  "message": "<@123456789> sudah clock in pada 30/12/2024 10:00:00",
  "data": {
    "isAlreadyClockedIn": true,
    "clockInTime": "2024-12-30T10:00:00.000Z",
    "location": "Central Hospital"
  }
}
```

## Rate Limiting

API memiliki rate limiting untuk mencegah spam:
- General endpoints: 100 requests per minute per IP
- Discord bot endpoints: 200 requests per minute per bot token

## Webhook Support

API mendukung webhook untuk notifikasi real-time:
- Clock in/out events
- Leave request updates
- User status changes

## Testing

Gunakan tools seperti Postman atau curl untuk testing:

```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"discordId":"123456789","username":"TestUser"}'

# Test clock in (dengan token)
curl -X POST http://localhost:3000/api/attendance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"clock_in","location":"Test Location","activity":"Testing"}'

# Test Discord bot endpoint
curl -X POST http://localhost:3000/api/discord \
  -H "X-Bot-Token: YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"status","discordId":"123456789"}'
```

## SDK/Libraries

Untuk memudahkan integrasi, tersedia library helper:
- JavaScript/Node.js
- Python
- Discord.js integration

## Support

Untuk bantuan API:
- GitHub Issues
- Discord: Beyond Roleplay server
- Email: support@beyondrp.com
