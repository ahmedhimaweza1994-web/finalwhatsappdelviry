import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FaUpload, FaSearch, FaMoon, FaSun, FaSignOutAlt } from 'react-icons/fa';
import { format, isToday, isYesterday } from 'date-fns';
import useTheme from '../hooks/useTheme';

const ChatList = ({ selectedChat, onSelectChat, onOpenUpload }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadChats();
        // Poll for updates every 10 seconds
        const interval = setInterval(loadChats, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadChats = async () => {
        try {
            const response = await api.get('/chats');
            setChats(response.data.chats || []);
        } catch (error) {
            console.error('Failed to load chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredChats = chats.filter(chat =>
        chat.chat_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (isToday(date)) return format(date, 'HH:mm');
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMM d');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'processing':
                return <span className="text-xs text-wa-green">⏳ Processing...</span>;
            case 'failed':
                return <span className="text-xs text-red-500">❌ Failed</span>;
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-wa-panel-dark">
            {/* Header */}
            <div className="bg-wa-panel dark:bg-wa-received-dark p-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-wa-green flex items-center justify-center text-white font-semibold">
                        {user?.email?.[0]?.toUpperCase()}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-wa-text dark:text-wa-text-dark truncate max-w-[120px]">
                            {user?.email}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 text-wa-icon dark:text-wa-icon-dark">
                    <button
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        className="hover:text-wa-text dark:hover:text-wa-text-dark transition-colors"
                    >
                        {theme === 'light' ? <FaMoon className="text-lg" /> : <FaSun className="text-lg" />}
                    </button>
                    <button
                        onClick={onOpenUpload}
                        title="Upload Chat"
                        className="hover:text-wa-text dark:hover:text-wa-text-dark transition-colors"
                    >
                        <FaUpload className="text-lg" />
                    </button>
                    <button
                        onClick={logout}
                        title="Logout"
                        className="hover:text-wa-text dark:hover:text-wa-text-dark transition-colors"
                    >
                        <FaSignOutAlt className="text-lg" />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="p-3 bg-white dark:bg-wa-panel-dark border-b border-wa-border dark:border-wa-border-dark flex-shrink-0">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-wa-icon dark:text-wa-icon-dark text-sm" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-wa-panel dark:bg-wa-received-dark text-sm text-wa-text dark:text-wa-text-dark placeholder-wa-text-secondary dark:placeholder-wa-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-wa-green"
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
                    <div className="p-8 text-center">
                        {searchQuery ? (
                            <p className="text-wa-text-secondary dark:text-wa-text-secondary-dark">
                                No chats found matching "{searchQuery}"
                            </p>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-4xl">💬</div>
                                <p className="text-wa-text-secondary dark:text-wa-text-secondary-dark">
                                    No chats yet
                                </p>
                                <button
                                    onClick={onOpenUpload}
                                    className="px-6 py-3 bg-wa-green hover:bg-wa-green-dark text-white rounded-lg transition-colors font-medium"
                                >
                                    Upload Your First Chat
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    filteredChats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => onSelectChat(chat)}
                            className={`p-3 border-b border-wa-border dark:border-wa-border-dark cursor-pointer hover:bg-wa-panel dark:hover:bg-wa-bg-dark transition-colors ${selectedChat?.id === chat.id ? 'bg-wa-panel dark:bg-wa-bg-dark' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-wa-icon dark:bg-wa-icon-dark flex items-center justify-center text-white flex-shrink-0 font-semibold">
                                    {chat.chat_name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline gap-2">
                                        <h3 className="font-medium truncate text-wa-text dark:text-wa-text-dark">
                                            {chat.chat_name}
                                        </h3>
                                        {chat.last_message_time && (
                                            <span className="text-xs text-wa-text-secondary dark:text-wa-text-secondary-dark flex-shrink-0">
                                                {formatTime(chat.last_message_time)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm text-wa-text-secondary dark:text-wa-text-secondary-dark truncate">
                                            {chat.last_message || `${chat.message_count || 0} messages`}
                                        </p>
                                        {getStatusBadge(chat.parse_status)}
                                    </div>
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
