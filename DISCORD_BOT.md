# Discord Bot Example untuk Beyond EMS

Ini adalah contoh implementasi Discord bot sederhana yang dapat berinteraksi dengan API Beyond EMS.

## Setup

1. Install discord.js:
```bash
npm install discord.js axios dotenv
```

2. Buat file `.env` untuk bot:
```env
DISCORD_BOT_TOKEN=your_bot_token_here
API_BASE_URL=http://localhost:3000
```

3. Buat file `bot.js`:

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Helper function untuk API calls
async function callAPI(endpoint, data = null, method = 'GET') {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}/api/discord${endpoint}`,
      headers: {
        'X-Bot-Token': BOT_TOKEN,
        'Content-Type': 'application/json',
      },
    };

    if (data && method === 'POST') {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    return { success: false, message: 'Terjadi error saat menghubungi server' };
  }
}

client.on('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();
  const args = message.content.split(' ');
  const command = args[0].toLowerCase();

  // Clock In Command
  if (command === '!clockin') {
    const location = args[1] || 'Unknown Location';
    const activity = args.slice(2).join(' ') || 'On Duty';

    const result = await callAPI('', {
      action: 'clock_in',
      discordId: message.author.id,
      username: message.author.username,
      location,
      activity,
    }, 'POST');

    if (result.success) {
      message.reply({
        embeds: [{
          title: '✅ Clock In Berhasil',
          description: result.message,
          color: 0x00ff00,
          fields: [
            { name: 'Lokasi', value: location, inline: true },
            { name: 'Aktivitas', value: activity, inline: true },
            { name: 'Waktu', value: new Date().toLocaleString('id-ID'), inline: true },
          ],
          footer: { text: 'Beyond EMS - Sistem Absensi' },
        }]
      });
    } else {
      message.reply({
        embeds: [{
          title: '❌ Clock In Gagal',
          description: result.message,
          color: 0xff0000,
          footer: { text: 'Beyond EMS - Sistem Absensi' },
        }]
      });
    }
  }

  // Clock Out Command
  else if (command === '!clockout') {
    const notes = args.slice(1).join(' ') || '';

    const result = await callAPI('', {
      action: 'clock_out',
      discordId: message.author.id,
      notes,
    }, 'POST');

    if (result.success) {
      message.reply({
        embeds: [{
          title: '✅ Clock Out Berhasil',
          description: result.message,
          color: 0x00ff00,
          fields: result.data.duration ? [
            { name: 'Durasi Kerja', value: result.data.duration, inline: true },
            { name: 'Waktu', value: new Date().toLocaleString('id-ID'), inline: true },
          ] : [],
          footer: { text: 'Beyond EMS - Sistem Absensi' },
        }]
      });
    } else {
      message.reply({
        embeds: [{
          title: '❌ Clock Out Gagal',
          description: result.message,
          color: 0xff0000,
          footer: { text: 'Beyond EMS - Sistem Absensi' },
        }]
      });
    }
  }

  // Status Command
  else if (command === '!status') {
    const result = await callAPI('', {
      action: 'status',
      discordId: message.author.id,
    }, 'POST');

    if (result.success && result.data) {
      const user = result.data.user;
      const isOnDuty = result.data.isCurrentlyClockedIn;

      message.reply({
        embeds: [{
          title: '👤 Status EMS',
          description: `Status untuk ${user.username}`,
          color: isOnDuty ? 0x00ff00 : 0x808080,
          fields: [
            { name: 'Rank', value: user.rank, inline: true },
            { name: 'Department', value: user.department, inline: true },
            { name: 'Total Jam', value: user.totalHours, inline: true },
            { name: 'Status', value: isOnDuty ? '🟢 On Duty' : '🔴 Off Duty', inline: true },
          ],
          footer: { text: 'Beyond EMS - Sistem Absensi' },
        }]
      });
    } else {
      message.reply('❌ Gagal mengambil data status');
    }
  }

  // Leaderboard Command
  else if (command === '!leaderboard') {
    const result = await callAPI('?action=leaderboard');

    if (result.success && result.data.leaderboard) {
      const leaderboard = result.data.leaderboard.slice(0, 10);
      const leaderboardText = leaderboard.map(user => 
        `${user.rank}. **${user.username}** - ${user.totalHours} (${user.position})`
      ).join('\n');

      message.reply({
        embeds: [{
          title: '🏆 Leaderboard EMS',
          description: leaderboardText || 'Belum ada data',
          color: 0xffd700,
          footer: { text: 'Beyond EMS - Top 10 berdasarkan jam kerja' },
        }]
      });
    } else {
      message.reply('❌ Gagal mengambil data leaderboard');
    }
  }

  // Active Members Command
  else if (command === '!active') {
    const result = await callAPI('?action=active_members');

    if (result.success && result.data.activeMembers) {
      const activeMembers = result.data.activeMembers;
      
      if (activeMembers.length === 0) {
        message.reply({
          embeds: [{
            title: '👥 Anggota Aktif',
            description: 'Tidak ada anggota yang sedang bertugas',
            color: 0x808080,
            footer: { text: 'Beyond EMS - Active Members' },
          }]
        });
        return;
      }

      const membersList = activeMembers.map(member => 
        `**${member.username}** (${member.rank})\n📍 ${member.location} - ${member.activity}\n⏱️ ${member.duration}`
      ).join('\n\n');

      message.reply({
        embeds: [{
          title: '👥 Anggota Aktif',
          description: membersList,
          color: 0x00ff00,
          footer: { text: `${activeMembers.length} anggota sedang bertugas` },
        }]
      });
    } else {
      message.reply('❌ Gagal mengambil data anggota aktif');
    }
  }

  // Help Command
  else if (command === '!help' || command === '!ems') {
    message.reply({
      embeds: [{
        title: '📋 Commands Beyond EMS',
        description: 'Daftar command untuk sistem absensi EMS',
        color: 0x0099ff,
        fields: [
          {
            name: '⏰ Absensi',
            value: '`!clockin [lokasi] [aktivitas]` - Clock in\n`!clockout [catatan]` - Clock out\n`!status` - Cek status',
            inline: false,
          },
          {
            name: '📊 Info',
            value: '`!leaderboard` - Top 10 EMS\n`!active` - Anggota yang bertugas\n`!help` - Bantuan',
            inline: false,
          },
          {
            name: '📝 Contoh',
            value: '`!clockin "Central Hospital" "Emergency Response"`\n`!clockout "Shift selesai"`',
            inline: false,
          },
        ],
        footer: { text: 'Beyond EMS - Sistem Absensi' },
      }]
    });
  }
});

client.login(BOT_TOKEN);
```

4. Jalankan bot:
```bash
node bot.js
```

## Commands yang Tersedia

- `!clockin [lokasi] [aktivitas]` - Clock in untuk memulai shift
- `!clockout [catatan]` - Clock out untuk mengakhiri shift  
- `!status` - Cek status absensi saat ini
- `!leaderboard` - Top 10 EMS berdasarkan jam kerja
- `!active` - Lihat anggota yang sedang bertugas
- `!help` atau `!ems` - Bantuan commands

## Contoh Penggunaan

```
!clockin "Central Hospital" "Emergency Response Team"
!clockout "Shift completed, 5 emergency calls handled"
!status
!leaderboard
!active
!help
```

Bot akan merespon dengan embed messages yang informatif dan mudah dibaca.

## Features

- ✅ Rich embed responses
- ✅ Error handling
- ✅ Command validation
- ✅ Real-time data dari API
- ✅ User-friendly interface
- ✅ Automatic user creation

## Notes

- Bot akan otomatis membuat user baru jika belum ada di database
- Semua data tersimpan secara real-time
- Bot menggunakan webhook API untuk komunikasi dengan sistem
- Response menggunakan embed Discord untuk tampilan yang lebih baik
