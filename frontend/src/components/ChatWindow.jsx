import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/api';
import MessageBubble from './MessageBubble';
import SearchBar from './SearchBar';
import PinnedMessagesBar from './PinnedMessagesBar';
import DateSeparator from './DateSeparator';
import { FaArrowDown, FaEllipsisV, FaTrash, FaThumbtack } from 'react-icons/fa';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

const ChatWindow = ({ chat, onDelete }) => {
    const [messages, setMessages] = useState([]);
    const [displayedMessages, setDisplayedMessages] = useState([]);
    const [messageLimit, setMessageLimit] = useState(50); // Start with 50 messages
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [searchResults, setSearchResults] = useState(null);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (chat?.id) {
            fetchMessages();
            fetchPinnedMessages();
        }
    }, [chat?.id]);

    useEffect(() => {
        // Display only the latest messages based on limit
        if (messages.length > 0) {
            const latest = messages.slice(-messageLimit);
            setDisplayedMessages(latest);

            // Only scroll to bottom on initial load or when switching chats, not when loading more
            if (messageLimit === 50) {
                setTimeout(() => scrollToBottom(), 100);
            }
        } else {
            setDisplayedMessages([]);
        }
    }, [messages, messageLimit]);

    // Remove auto-scroll on every message change - only scroll on initial load

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowScrollButton(false); // Hide button when scrolled to bottom
    };

    const loadMoreMessages = () => {
        setMessageLimit(prev => prev + 50);
    };

    const fetchMessages = async () => {
        try {
            setLoading(true);
            setError('');
            // Load ALL messages without pagination from the API
            const response = await api.get(`/chats/${chat.id}/messages`, {
                params: { limit: 10000, offset: 0 } // Large limit to get all messages
            });
            setMessages(response.data.messages || []);
            setMessageLimit(50); // Reset limit when switching chats
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const fetchPinnedMessages = async () => {
        try {
            const response = await api.get(`/chats/${chat.id}/pinned-messages`);
            setPinnedMessages(response.data.messages || []);
        } catch (err) {
            console.error('Error fetching pinned messages:', err);
        }
    };

    const handleSearch = async (query) => {
        if (!query || query.trim().length === 0) {
            setSearchResults(null);
            return;
        }
        try {
            const response = await api.get(`/chats/${chat.id}/search`, {
                params: { q: query }
            });
            setSearchResults(response.data.results || []);
        } catch (err) {
            console.error('Error searching messages:', err);
        }
    };

    const handleClearSearch = () => {
        setSearchResults(null);
    };

    const handleTogglePin = async (messageId) => {
        try {
            await api.post(`/chats/${chat.id}/messages/${messageId}/pin`);
            await fetchPinnedMessages();
            await fetchMessages(); // Refresh to update pin status
        } catch (err) {
            console.error('Error toggling pin:', err);
        }
    };

    const scrollToMessage = (messageId) => {
        const messageEl = document.getElementById(`message-${messageId}`);
        if (messageEl) {
            messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageEl.classList.add('highlight-message');
            setTimeout(() => messageEl.classList.remove('highlight-message'), 2000);
        }
    };

    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
        setShowScrollButton(!isNearBottom);
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete "${chat.chat_name}"? This will permanently delete all messages and media files.`)) {
            return;
        }

        try {
            await api.delete(`/chats/${chat.id}`);
            onDelete?.(chat.id);
        } catch (error) {
            alert('Failed to delete chat: ' + (error.response?.data?.error || error.message));
        }
    };

    if (!chat) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-wa-panel dark:bg-wa-panel-dark p-8">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">💬</div>
                    <h2 className="text-2xl font-semibold text-wa-text dark:text-wa-text-dark mb-2">
                        ChatVault Web
                    </h2>
                    <p className="text-wa-text-secondary dark:text-wa-text-secondary-dark">
                        Select a chat from the list to view messages
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-wa-chat-bg dark:bg-wa-chat-bg-dark chat-pattern relative">
            {/* Header */}
            <div className="bg-wa-panel dark:bg-wa-received-dark px-4 py-3 flex items-center gap-3 border-b border-wa-border dark:border-wa-border-dark flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-wa-icon dark:bg-wa-icon-dark flex items-center justify-center text-white font-semibold">
                    {chat.chat_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="font-medium text-wa-text dark:text-wa-text-dark truncate">
                        {chat.chat_name}
                    </h2>
                    <p className="text-xs text-wa-text-secondary dark:text-wa-text-secondary-dark">
                        {chat.message_count} messages
                    </p>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="text-wa-icon dark:text-wa-icon-dark hover:text-wa-text dark:hover:text-wa-text-dark p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <FaEllipsisV />
                    </button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-wa-received-dark shadow-wa-lg rounded-lg py-2 min-w-[200px] z-20">
                                <button
                                    onClick={() => { setShowMenu(false); handleDelete(); }}
                                    className="w-full px-4 py-2 text-left hover:bg-wa-panel dark:hover:bg-wa-bg-dark text-red-600 dark:text-red-400 flex items-center gap-3 transition-colors"
                                >
                                    <FaTrash />
                                    Delete Chat
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <SearchBar
                onSearch={handleSearch}
                onClear={handleClearSearch}
                placeholder="Search messages..."
            />

            {/* Pinned Messages */}
            <PinnedMessagesBar
                pinnedMessages={pinnedMessages}
                onNavigate={scrollToMessage}
                onUnpin={handleTogglePin}
            />

            {/* Messages */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-1"
            >
                {loading && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="spinner"></div>
                    </div>
                ) : searchResults ? (
                    <div>
                        <div className="text-center py-2 text-sm text-wa-text-secondary dark:text-wa-text-secondary-dark">
                            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                        </div>
                        {searchResults.map((message) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                onTogglePin={handleTogglePin}
                            />
                        ))}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-wa-text-secondary dark:text-wa-text-secondary-dark">
                        No messages in this chat
                    </div>
                ) : (
                    <>
                        {/* Load More Button */}
                        {messages.length > messageLimit && (
                            <div className="text-center py-4">
                                <button
                                    onClick={loadMoreMessages}
                                    className="px-4 py-2 bg-wa-green hover:bg-wa-green-dark text-white rounded-lg text-sm transition-colors"
                                >
                                    Load Older Messages ({messages.length - messageLimit} more)
                                </button>
                            </div>
                        )}

                        {displayedMessages.map((message, index) => {
                            // Check if we need a date separator
                            const showDateSeparator = index === 0 ||
                                new Date(displayedMessages[index - 1].timestamp).toDateString() !==
                                new Date(message.timestamp).toDateString();

                            return (
                                <React.Fragment key={message.id}>
                                    {showDateSeparator && (
                                        <DateSeparator date={message.timestamp} />
                                    )}
                                    <MessageBubble
                                        message={message}
                                        onTogglePin={handleTogglePin}
                                    />
                                </React.Fragment>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-6 right-6 bg-white dark:bg-wa-received-dark p-3 rounded-full shadow-wa-lg hover:shadow-xl transition-all z-10 text-wa-icon dark:text-wa-icon-dark hover:text-wa-green"
                >
                    <FaArrowDown />
                </button>
            )}
        </div>
    );
};

export default ChatWindow;
