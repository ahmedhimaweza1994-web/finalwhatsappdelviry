# ChatVault Web - Self-hosted WhatsApp Chat Viewer

A fully self-hosted web application that allows you to upload WhatsApp chat exports (ZIP files with media) and view them in an exact replica of WhatsApp Web's interface. All processing, storage, and rendering happens on your VPS with no external dependencies.

![ChatVault Banner](https://via.placeholder.com/1200x300/25D366/FFFFFF?text=ChatVault+Web)

## ✨ Features

- 📦 **ZIP Upload & Parsing** - Upload WhatsApp exported ZIP files with all media included
- 🔍 **Intelligent Media Mapping** - Automatically matches media files to messages
- 💬 **Exact WhatsApp Web UI** - Pixel-perfect replica of WhatsApp Web's chat interface
- 🎨 **Dark/Light Themes** - Beautiful dark and light modes matching WhatsApp
- 🖼️ **Full Media Support** - Images, videos, voice notes, audio, and documents
- 🔒 **Private & Secure** - Multi-user authentication, all data stays on your VPS
- 🚀 **Background Processing** - Async ZIP parsing with progress tracking
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile
- 🔎 **Full-text Search** - Search through your chat messages
- ♾️ **Infinite Scroll** - Smooth pagination for large chats

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Database**: Post greSQL for metadata storage
- **File Processing**: Streaming ZIP extraction with `unzipper`
- **Chat Parsing**: Robust WhatsApp `.txt` parser supporting multiple formats
- **Media Mapping**: Fuzzy matching algorithm to link media files to messages
- **Background Jobs**: Bull queue with Redis for async processing
- **Thumbnails**: Sharp for image thumbnails, ffmpeg for video previews
- **Media Serving**: Authenticated endpoints with range request support

### Frontend (React + Tailwind CSS)
- **UI Framework**: React 18 with Vite build tool
- **Styling**: Tailwind CSS with custom WhatsApp color palette
- **State Management**: React Context for auth and app state
- **Routing**: React Router v6
- **API Client**: Axios with interceptors for auth

### Deployment
- **Containerization**: Docker Compose with PostgreSQL, Redis, Nginx
- **Reverse Proxy**: Nginx with SSL/TLS support
- **File Storage**: VPS filesystem with organized directory structure

## 📋 Prerequisites

- **VPS/Server**: 2GB RAM minimum, 20GB disk space
- **Docker & Docker Compose**: Version 20.10+
- **Domain (Optional)**: For SSL/HTTPS setup
- **ffmpeg (Optional)**: For video thumbnail generation

## 🚀 Quick Start

### 1. Clone and Configure

```bash
git clone <repository-url> chatvault
cd chatvault

# Copy environment template
cp .env.example .env

# Edit .env with your settings (IMPORTANT!)
nano .env
```

### 2. Set Environment Variables

Edit `.env` and configure:

```bash
# Generate a secure JWT secret (minimum 32 characters)
JWT_SECRET=your_very_secure_random_string_minimum_32_chars

# Database password
DB_PASSWORD=secure_database_password

# Optional: Email settings for password reset
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Start with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Services will be available at:
# - Frontend: http://localhost (port 80)
# - Backend API: http://localhost:3001
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### 4. Access the Application

Open your browser and navigate to `http://localhost` or `http://your-server-ip`

**Default credentials** (CHANGE IMMEDIATELY):
- Email: `admin@chatvault.local`
- Password: `admin123`

## 🛠️ Development Setup

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start PostgreSQL and Redis (via Docker or locally)
# Then run migrations
npm run migrate

# Start development server
npm run dev

# Start worker (in separate terminal)
npm run worker
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server (with API proxy)
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
chatvault/
├── backend/
│   ├── config/         # Database configuration
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware (auth, etc.)
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic (parsers, media mapper)
│   ├── workers/        # Background job processors
│   ├── migrations/     # Database migrations
│   └── server.js       # Express app entry point
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── context/    # React context providers
│   │   ├── hooks/      # Custom React hooks
│   │   ├── utils/      # Utilities (API client, helpers)
│   │   ├── App.jsx     # Main app component
│   │   └── main.jsx    # React entry point
│   ├── public/         # Static assets
│   └── index.html      # HTML template
├── nginx/              # Nginx configuration
├── scripts/            # Utility scripts (migrations, backups)
├── docker-compose.yml  # Docker Compose configuration
└── .env.example        # Environment variables template
```

## 📊 Database Schema

```sql
users
├── id (PK)
├── email (unique)
├── password_hash
├── created_at
└── last_login

chats
├── id (PK)
├── user_id (FK → users)
├── chat_name
├── original_filename
├── upload_uuid
├── message_count
├── size_bytes
└── parse_status

messages
├── id (PK)
├── chat_id (FK → chats)
├── sender_name
├── sender_is_me
├── timestamp
├── body
├── message_type
├── order_index
└── metadata (JSONB)

media_files
├── id (PK)
├── message_id (FK → messages)
├── chat_id (FK → chats)
├── user_id (FK → users)
├── original_name
├── storage_path
├── thumb_path
├── mime_type
└── size_bytes
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user
- `POST /api/auth/change-password` - Change password

### Upload
- `POST /api/upload` - Upload WhatsApp ZIP
- `GET /api/upload/status/:jobId` - Get parsing job status

### Chats
- `GET /api/chats` - List all chats (paginated)
- `GET /api/chats/:id` - Get chat details
- `GET /api/chats/:id/messages` - Get messages (paginated)
- `DELETE /api/chats/:id` - Delete chat
- `GET /api/chats/:id/search?q=query` - Search messages

### Media
- `GET /api/media/:userId/:chatId/:type/:filename` - Serve media file
- `GET /api/media/download/:mediaId` - Download media file

## 📦 How to Export WhatsApp Chat

### On Android:
1. Open WhatsApp and go to the chat you want to export
2. Tap the three dots (⋮) in the top-right corner
3. Select **More** → **Export chat**
4. Choose **Include media** (IMPORTANT!)
5. Select **Email** or **Save to Files**
6. The ZIP file will be created

### On iPhone:
1. Open WhatsApp and go to the chat
2. Tap the contact/group name at the top
3. Scroll down and tap **Export Chat**
4. Choose **Attach Media** (IMPORTANT!)
5. Select **Save to Files** or **Mail**

## 🎨 Frontend Components (To Be Completed)

The backend is fully implemented. The following frontend React components still need to be created:

### Pages
- ✅ `App.jsx` - Main app with routing (created)
- ⏳ `Login.jsx` - Login page
- ⏳ `Register.jsx` - Registration page
- ⏳ `Dashboard.jsx` - Main chat dashboard (two-panel layout)

### Components
- ⏳ `ProtectedRoute.jsx` - Route guard
- ⏳ `ChatList.jsx` - Left sidebar with chat list
- ⏳ `ChatWindow.jsx` - Main chat display panel
- ⏳ `MessageBubble.jsx` - Individual message bubble
- ⏳ `UploadModal.jsx` - ZIP upload interface
- ⏳ `MediaModal.jsx` - Fullscreen media viewer
- ⏳ `ExportGuide.jsx` - How-to guide

### Message Type Components
- ⏳ `TextMessage.jsx` - Text with emojis and links
- ⏳ `ImageMessage.jsx` - Image with thumbnail
- ⏳ `VideoMessage.jsx` - Video player
- ⏳ `AudioMessage.jsx` - Audio player
- ⏳ `DocumentMessage.jsx` - Document download

### Hooks
- ⏳ `useInfiniteScroll.js` - Infinite scroll pagination
- ⏳ `useTheme.js` - Dark/light theme toggle

## 🔒 Security Considerations

1. **Change default admin password immediately** after first login
2. **Use strong JWT_SECRET** (minimum 32 random characters)
3. **Enable HTTPS** in production (Let's Encrypt recommended)
4. **Set up firewall rules** to restrict database/Redis access
5. **Regular backups** of database and media files
6. **Rate limiting** is enabled by default (adjust in `server.js`)
7. **File upload limits** set to 500MB (configurable via `MAX_UPLOAD_SIZE`)

## 📝 Configuration

### Upload Limits
```env
MAX_UPLOAD_SIZE=524288000  # 500MB in bytes
```

### File Storage Paths
```env
UPLOADS_DIR=/var/www/chatvault/uploads
MEDIA_DIR=/var/www/chatvault/media
```

### JWT Configuration
```env
JWT_SECRET=your_super_secure_secret_key
JWT_EXPIRY=7d  # 7 days
```

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Rebuild after code changes
docker-compose up -d --build

# Access database
docker-compose exec postgres psql -U chatvault -d chatvault

# Access Redis CLI
docker-compose exec redis redis-cli

# Run migrations manually
docker-compose exec backend npm run migrate
```

## 🔧 Troubleshooting

### ZIP Parsing Fails
- Check worker logs: `docker-compose logs -f worker`
- Ensure Redis is running: `docker-compose ps`
- Verify disk space: `df -h`

### Media Files Not Displaying
- Check media file permissions
- Verify Nginx configuration for media serving
- Check browser console for 403/404 errors

### Database Connection Errors
- Verify PostgreSQL is running: `docker-compose ps`
- Check database credentials in `.env`
- Ensure migrations have run: `npm run migrate`

## 📚 Technologies Used

- **Backend**: Node.js, Express.js, PostgreSQL, Redis, Bull
- **Frontend**: React, Vite, Tailwind CSS, Axios
- **Deployment**: Docker, Docker Compose, Nginx
- **File Processing**: unzipper, sharp, ffmpeg
- **Authentication**: JWT, bcrypt

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- WhatsApp Web UI design inspiration
- Open-source community for excellent libraries

---

**Made with ❤️ for privacy-conscious users who want to own their data**
