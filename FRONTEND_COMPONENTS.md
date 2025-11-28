# ChatVault Frontend - Remaining Components Guide

This document provides detailed specifications for all remaining frontend components needed to complete the ChatVault Web application. The backend is fully implemented and ready to serve data.

## 📋 Component Checklist

### ✅ Completed
- [x] `App.jsx` - Main app with routing
- [x] `main.jsx` - React entry point
- [x] `AuthContext.jsx` - Auth state management
- [x] `ProtectedRoute.jsx` - Route guard  
- [x] `Login.jsx` - Login page
- [x] `Register.jsx` - Registration page
- [x] `Dashboard.jsx` - Basic dashboard (placeholder)
- [x] `api.js` - API client utility

### ⏳ To Be Implemented
- [ ] `Dashboard.jsx` - Full WhatsApp Web two-panel layout
- [ ] `ChatList.jsx` - Left sidebar with chat list
- [ ] `ChatWindow.jsx` - Main chat display
- [ ] `MessageBubble.jsx` - Individual message component
- [ ] `UploadModal.jsx` - ZIP upload interface
- [ ] `MediaModal.jsx` - Fullscreen media viewer
- [ ] `ExportGuide.jsx` - How-to export guide
- [ ] Message type components (6 total)
- [ ] Custom hooks (2 total)

---

## 🎨 Complete Dashboard Layout

Replace the placeholder `Dashboard.jsx` with the full WhatsApp Web layout:

```jsx
// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import UploadModal from '../components/UploadModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [chats, setChats] = useState([]);

  return (
    <div className="h-screen flex bg-wa-panel dark:bg-wa-panel-dark">
      {/* Left Sidebar - Chat List */}
      <div className="w-full md:w-[400px] flex-shrink-0 border-r border-wa-border dark:border-wa-border-dark">
        <ChatList 
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          onOpenUpload={() => setShowUpload(true)}
          onRefresh={loadChats}
        />
      </div>

      {/* Right Panel - Chat Window */}
      <div className="flex-1 hidden md:flex">
        {selectedChat ? (
          <ChatWindow chat={selectedChat} />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal 
          onClose={() => setShowUpload(false)}
          onSuccess={loadChats}
        />
      )}
    </div>
  );
};
```

**Key Features:**
- Responsive: Mobile shows chat list OR chat window
- Desktop shows both panels side-by-side
- Upload modal overlay
- State management for selected chat

---

## 📱 ChatList Component

Left sidebar showing all user chats.

```jsx
// frontend/src/components/ChatList.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FaUpload, FaSearch, FaEllipsisV } from 'react-icons/fa';
import { format } from 'date-fns';

const ChatList = ({ selectedChat, onSelectChat, onOpenUpload, onRefresh }) => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data.chats);
      onRefresh?.(response.data.chats);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.chat_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-wa-panel-dark">
      {/* Header */}
      <div className="bg-wa-panel dark:bg-wa-received-dark p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-wa-green flex items-center justify-center text-white font-semibold">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <span className="font-medium">{user?.email}</span>
        </div>
        <div className="flex gap-4 text-wa-icon dark:text-wa-icon-dark">
          <button onClick={onOpenUpload} title="Upload Chat">
            <FaUpload className="text-xl" />
          </button>
          <button onClick={logout} title="Logout">
            <FaEllipsisV />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 bg-white dark:bg-wa-panel-dark border-b border-wa-border dark:border-wa-border-dark">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-wa-icon-dark" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-wa-panel dark:bg-wa-received-dark text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="spinner"></div>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-wa-text-secondary">
            <p>No chats found</p>
            <button 
              onClick={onOpenUpload}
              className="mt-4 px-4 py-2 bg-wa-green text-white rounded-lg"
            >
              Upload Your First Chat
            </button>
          </div>
        ) : (
          filteredChats.map(chat => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={`p-3 border-b border-wa-border dark:border-wa-border-dark cursor-pointer hover:bg-wa-panel dark:hover:bg-wa-bg-dark transition-colors ${
                selectedChat?.id === chat.id ? 'bg-wa-panel dark:bg-wa-bg-dark' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-wa-icon dark:bg-wa-icon-dark flex items-center justify-center text-white">
                  {chat.chat_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium truncate">{chat.chat_name}</h3>
                    {chat.last_message_time && (
                      <span className="text-xs text-wa-text-secondary ml-2">
                        {format(new Date(chat.last_message_time), 'MMM d')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-wa-text-secondary truncate">
                    {chat.last_message || `${chat.message_count} messages`}
                  </p>
                  {chat.parse_status === 'processing' && (
                    <span className="text-xs text-wa-green">Processing...</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
```

**Features:**
- User profile header
- Search functionality
- Chat item rendering with avatar
- Last message preview
- Processing status indicator
- Click to select chat

---

## 💬 ChatWindow Component

Main chat display panel (right side).

```jsx
// frontend/src/components/ChatWindow.jsx
import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/api';
import MessageBubble from './MessageBubble';
import { FaArrowDown } from 'react-icons/fa';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

const ChatWindow = ({ chat }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (chat) {
      loadMessages(true);
    }
  }, [chat]);

  const loadMessages = async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const response = await api.get(`/chats/${chat.id}/messages`, {
        params: { limit: 50, offset: currentOffset }
      });

      if (reset) {
        setMessages(response.data.messages);
        scrollToBottom();
      } else {
        setMessages(prev => [...response.data.messages, ...prev]);
      }

      setHasMore(response.data.hasMore);
      setOffset(currentOffset + response.data.messages.length);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Infinite scroll
  useInfiniteScroll(containerRef, () => {
    if (hasMore && !loading) {
      loadMessages();
    }
  });

  return (
    <div className="h-full flex flex-col bg-wa-chat-bg dark:bg-wa-chat-bg-dark chat-pattern">
      {/* Header */}
      <div className="bg-wa-panel dark:bg-wa-received-dark px-4 py-3 flex items-center gap-3 border-b border-wa-border dark:border-wa-border-dark">
        <div className="w-10 h-10 rounded-full bg-wa-icon dark:bg-wa-icon-dark flex items-center justify-center text-white">
          {chat?.chat_name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="font-medium">{chat?.chat_name}</h2>
          <p className="text-xs text-wa-text-secondary">
            {chat?.message_count} messages
          </p>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {messages.map((message, idx) => (
              <MessageBubble 
                key={message.id} 
                message={message}
                prevMessage={messages[idx - 1]}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Scroll to bottom button */}
      <button
        onClick={scrollToBottom}
        className="absolute bottom-20 right-8 bg-white dark:bg-wa-received-dark p-3 rounded-full shadow-wa-lg"
      >
        <FaArrowDown className="text-wa-icon dark:text-wa-icon-dark" />
      </button>
    </div>
  );
};

export default ChatWindow;
```

**Features:**
- Chat header with name and message count
- Infinite scroll for loading older messages
- Auto-scroll to bottom on open
- Scroll-to-bottom button
- WhatsApp background pattern

---

## 💬 MessageBubble Component

Individual message rendering with exact WhatsApp styling.

```jsx
// frontend/src/components/MessageBubble.jsx
import React from 'react';
import { format } from 'date-fns';
import TextMessage from './MessageTypes/TextMessage';
import ImageMessage from './MessageTypes/ImageMessage';
import VideoMessage from './MessageTypes/VideoMessage';
import AudioMessage from './MessageTypes/AudioMessage';
import DocumentMessage from './MessageTypes/DocumentMessage';

const MessageBubble = ({ message, prevMessage }) => {
  const isSent = message.sender_is_me;
  const showSender = !prev Message || prevMessage.sender_name !== message.sender_name;

  const renderContent = () => {
    switch (message.message_type) {
      case 'image':
        return <ImageMessage message={message} />;
      case 'video':
        return <VideoMessage message={message} />;
      case 'audio':
        return <AudioMessage message={message} />;
      case 'document':
        return <DocumentMessage message={message} />;
      default:
        return <TextMessage message={message} />;
    }
  };

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div 
        className={`relative max-w-[65%] px-3 py-2 rounded-wa shadow-wa ${
          isSent 
            ? 'bg-wa-sent dark:bg-wa-sent-dark text-black' 
            : 'bg-wa-received dark:bg-wa-received-dark'
        }`}
      >
        {/* Tail */}
        <div className={isSent ? 'message-tail-sent' : 'message-tail-received'} />

        {/* Sender name (for received messages) */}
        {!isSent && showSender && (
          <div className="text-sm font-semibold text-wa-green mb-1">
            {message.sender_name}
          </div>
        )}

        {/* Message content */}
        {renderContent()}

        {/* Timestamp */}
        <div className={`text-[10px] text-right mt-1 ${
          isSent ? 'text-gray-600' : 'text-wa-text-secondary'
        }`}>
          {format(new Date(message.timestamp), 'HH:mm')}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
```

**Styling:**
- Exact WhatsApp bubble shape with tail
- Different colors for sent/received
- Sender name for group chats
- Timestamp in bottom-right corner

---

## 📤 UploadModal Component

ZIP file upload interface with drag-and-drop.

```jsx
// frontend/src/components/UploadModal.jsx
import React, { useState } from 'react';
import api from '../utils/api';
import { FaTimes, FaUpload, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const UploadModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, success, error
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.zip')) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a .zip file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus('uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        }
      });

      setJobId(response.data.jobId);
      setStatus('processing');
      pollJobStatus(response.data.jobId);

    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const pollJobStatus = async (id) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/upload/status/${id}`);
        setProgress(response.data.progress || 0);

        if (response.data.state === 'completed') {
          clearInterval(interval);
          setStatus('success');
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 2000);
        } else if (response.data.state === 'failed') {
          clearInterval(interval);
          setError(response.data.error || 'Processing failed');
          setStatus('error');
        }
      } catch (error) {
        clearInterval(interval);
        setError('Failed to check status');
        setStatus('error');
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-wa-panel-dark rounded-lg shadow-wa-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload WhatsApp Chat</h2>
          <button onClick={onClose} className="text-wa-icon hover:text-wa-text">
            <FaTimes />
          </button>
        </div>

        {status === 'success' ? (
          <div className="text-center py-8">
            <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Chat imported successfully!</p>
          </div>
        ) : status === 'error' ? (
          <div className="text-center py-8">
            <FaExclamationCircle className="text-5xl text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => { setStatus('idle'); setError(''); setFile(null); }}
              className="mt-4 px-4 py-2 bg-wa-green text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div 
              className="border-2 border-dashed border-wa-border dark:border-wa-border-dark rounded-lg p-8 text-center cursor-pointer hover:border-wa-green transition-colors"
              onClick={() => document.getElementById('file-input').click()}
            >
              <FaUpload className="text-4xl text-wa-icon mx-auto mb-4" />
              <p className="text-wa-text dark:text-wa-text-dark">
                {file ? file.name : 'Click to select or drag ZIP file here'}
              </p>
              <p className="text-sm text-wa-text-secondary mt-2">
                Maximum size: 500MB
              </p>
              <input
                id="file-input"
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {(uploading || status === 'processing') && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>{status === 'uploading' ? 'Uploading...' : 'Processing...'}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-wa-green h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading || status === 'processing'}
              className="w-full mt-6 px-6 py-3 bg-wa-green hover:bg-wa-green-dark text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading...' : status === 'processing' ? 'Processing...' : 'Upload'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
```

**Features:**
- File selection with validation
- Upload progress bar
- Parse job polling with progress
- Success/error states
- Drag-and-drop support (can be enhanced)

---

## 🖼️ Message Type Components

Create these 5 components in `frontend/src/components/MessageTypes/`:

### TextMessage.jsx
```jsx
import React from 'react';
import Linkify from 'linkify-react';

const TextMessage = ({ message }) => {
  return (
    <div className="text-sm whitespace-pre-wrap break-words">
      <Linkify options={{ target: '_blank', className: 'text-blue-500 underline' }}>
        {message.body}
      </Linkify>
    </div>
  );
};

export default TextMessage;
```

### ImageMessage.jsx
```jsx
import React, { useState } from 'react';
import MediaModal from '../MediaModal';

const ImageMessage = ({ message }) => {
  const [showModal, setShowModal] = useState(false);
  const media = message.media?.[0];
  const src = media ? `/api/media/${media.storage_path}` : null;

  return (
    <>
      {src ? (
        <img 
          src={src}
          alt={media.original_name}
          className="max-w-full rounded cursor-pointer"
          onClick={() => setShowModal(true)}
        />
      ) : (
        <div className="text-sm text-red-500">Image missing</div>
      )}
      {showModal && <MediaModal media={media} onClose={() => setShowModal(false)} />}
      {message.body && <div className="text-sm mt-1">{message.body}</div>}
    </>
  );
};

export default ImageMessage;
```

### VideoMessage.jsx
```jsx
const VideoMessage = ({ message }) => {
  const media = message.media?.[0];
  const src = media ? `/api/media/${media.storage_path}` : null;

  return (
    <>
      {src ? (
        <video 
          controls 
          className="max-w-full rounded"
          preload="metadata"
        >
          <source src={src} type={media.mime_type} />
        </video>
      ) : (
        <div className="text-sm text-red-500">Video missing</div>
      )}
      {message.body && <div className="text-sm mt-1">{message.body}</div>}
    </>
  );
};
```

### AudioMessage.jsx
```jsx
const AudioMessage = ({ message }) => {
  const media = message.media?.[0];
  const src = media ? `/api/media/${media.storage_path}` : null;

  return (
    <>
      {src ? (
        <audio controls className="max-w-full">
          <source src={src} type={media.mime_type} />
        </audio>
      ) : (
        <div className="text-sm text-red-500">Audio missing</div>
      )}
    </>
  );
};
```

### DocumentMessage.jsx
```jsx
import { FaFile, FaDownload } from 'react-icons/fa';

const DocumentMessage = ({ message }) => {
  const media = message.media?.[0];

  return (
    <div className="flex items-center gap-3 p-2 bg-white/10 rounded">
      <FaFile className="text-3xl text-wa-icon" />
      <div className="flex-1">
        <div className="text-sm font-medium">{media?.original_name || 'Document'}</div>
        <div className="text-xs text-wa-text-secondary">
          {(media?.size_bytes / 1024).toFixed(0)} KB
        </div>
      </div>
      {media && (
        <a 
          href={`/api/media/download/${media.id}`}
          download
          className="text-wa-icon hover:text-wa-green"
        >
          <FaDownload />
        </a>
      )}
    </div>
  );
};
```

---

## 🔧 Custom Hooks

### useInfiniteScroll.js
```jsx
// frontend/src/hooks/useInfiniteScroll.js
import { useEffect } from 'react';

const useInfiniteScroll = (containerRef, callback) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0) {
        callback();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, callback]);
};

export default useInfiniteScroll;
```

### useTheme.js
```jsx
// frontend/src/hooks/useTheme.js
import { useState, useEffect } from 'react';

const useTheme = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
};

export default useTheme;
```

---

## 🚀 Implementation Order

1. **Phase 1**: Message types and MediaModal
2. **Phase 2**: MessageBubble component
3. **Phase 3**: ChatWindow with infinite scroll
4. **Phase 4**: ChatList with search
5. **Phase 5**: Full Dashboard layout
6. **Phase 6**: UploadModal and ExportGuide
7. **Phase 7**: Theme toggle and polish

---

## 🎨 Design Specifications

### WhatsApp Colors (from tailwind.config.js)
- **Sent messages**: `bg-wa-sent` (#D9FDD3)
- **Received messages**: `bg-wa-received` (#FFFFFF)
- **Green accent**: `bg-wa-green` (#25D366)
- **Teal header**: `bg-wa-teal` (#075E54)

### Spacing & Sizing
- **Message bubble**: `max-w-[65%]`, `px-3 py-2`, `rounded-wa` (7.5px)
- **Chat list items**: `p-3`
- **Avatar sizes**: 40px (list), 48px (header)

### Fonts
- **Default**: Segoe UI, Helvetica Neue
- **Message text**: 14px (text-sm)
- **Timestamp**: 10px (text-[10px])

---

## 📝 API Integration Examples

All API calls use the configured `api` instance from `utils/api.js`:

```jsx
// Load chats
const chats = await api.get('/chats?limit=50&offset=0');

// Load messages
const messages = await api.get(`/chats/${chatId}/messages?limit=50&offset=0`);

// Upload file
const formData = new FormData();
formData.append('file', file);
await api.post('/upload', formData);

// Delete chat
await api.delete(`/chats/${chatId}`);

// Search
const results = await api.get(`/chats/${chatId}/search?q=${query}`);
```

---

## ✅ Testing Checklist

After implementing all components:

- [ ] Login and register work
- [ ] Upload a WhatsApp ZIP file
- [ ] Check parse progress
- [ ] View chat list
- [ ] Open a chat and see messages
- [ ] Images render and open in modal
- [ ] Videos play inline
- [ ] Audio players work
- [ ] Documents download
- [ ] Infinite scroll loads older messages
- [ ] Search finds messages
- [ ] Delete chat works
- [ ] Dark/light theme toggle works
- [ ] Mobile responsive layout works

---

**All backend APIs are ready and waiting for these frontend components!** 🚀
