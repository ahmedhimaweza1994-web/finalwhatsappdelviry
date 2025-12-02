import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/api';
import MessageBubble from './MessageBubble';
import { FaArrowDown, FaEllipsisV, FaTrash, FaSearch } from 'react-icons/fa';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

const ChatWindow = ({ chat, onDelete }) => {
    const [messages, setMessages] = useState([]);
    const [displayedMessages, setDisplayedMessages] = useState([]);
    const [messageLimit, setMessageLimit] = useState(50); // Start with 50 messages
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (chat?.id) {
            fetchMessages();
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
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-wa-text-secondary dark:text-wa-text-secondary-dark">
                        No messages in this chat
                    </div>
                ) : (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
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

                            {displayedMessages.map((message) => (
                                <MessageBubble key={message.id} message={message} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
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
