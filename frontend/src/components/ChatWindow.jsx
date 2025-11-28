import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/api';
import MessageBubble from './MessageBubble';
import { FaArrowDown, FaEllipsisV, FaTrash, FaSearch } from 'react-icons/fa';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

const ChatWindow = ({ chat, onDelete }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        if (chat) {
            resetAndLoad();
        }
    }, [chat?.id]);

    const resetAndLoad = () => {
        setMessages([]);
        setOffset(0);
        setHasMore(true);
        setLoading(true);
        loadMessages(0, true);
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            // Load ALL messages without pagination
            const response = await api.get(`/chats/${chat.id}/messages`, {
                params: { limit: 10000, offset: 0 } // Large limit to get all messages
            });

            const newMessages = response.data.messages || [];
            setMessages(newMessages.reverse());
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowScrollButton(false);
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
