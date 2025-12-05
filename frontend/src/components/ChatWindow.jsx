import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../utils/api';
import MessageBubble from './MessageBubble';
import SearchBar from './SearchBar';
import PinnedMessagesBar from './PinnedMessagesBar';
import DateSeparator from './DateSeparator';
import SearchResultsModal from './SearchResultsModal';
import { FaArrowDown, FaEllipsisV, FaTrash, FaThumbtack } from 'react-icons/fa';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

const ChatWindow = ({ chat, onDelete }) => {
    const [messages, setMessages] = useState([]);
    const [displayedMessages, setDisplayedMessages] = useState([]);
    const [messageLimit, setMessageLimit] = useState(50);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null); // Full search results for modal
    const [showSearchModal, setShowSearchModal] = useState(false);
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
        // Display messages based on limit
        if (messages.length > 0) {
            // Normal mode - show only latest based on limit
            const latest = messages.slice(-messageLimit);
            setDisplayedMessages(latest);

            // Only scroll to bottom on initial load or when switching chats
            if (messageLimit === 50 && !showSearchModal) {
                setTimeout(() => scrollToBottom(), 100);
            }
        } else {
            setDisplayedMessages([]);
        }
    }, [messages, messageLimit, showSearchModal]);

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
            // Load initial messages (last 50)
            const response = await api.get(`/chats/${chat.id}/messages`, {
                params: { limit: 50, offset: 0 }
            });
            setMessages(response.data.messages || []);
            setMessageLimit(50);
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessagesAround = useCallback(async (messageId) => {
        try {
            const response = await api.get(`/chats/${chat.id}/messages/around/${messageId}`);
            setMessages(response.data.messages || []);
            return response.data.targetIndex;
        } catch (err) {
            console.error('Error fetching messages around:', err);
            return -1;
        }
    }, [chat?.id]);

    const fetchPinnedMessages = async () => {
        try {
            const response = await api.get(`/chats/${chat.id}/pinned-messages`);
            setPinnedMessages(response.data.messages || []);
        } catch (err) {
            console.error('Error fetching pinned messages:', err);
        }
    };

    const handleSearch = useCallback(async (query) => {
        console.log('[DEBUG] handleSearch called with:', query);
        if (!query || query.trim().length === 0) {
            setSearchQuery('');
            setSearchResults(null);
            setShowSearchModal(false);
            return;
        }
        try {
            const response = await api.get(`/chats/${chat.id}/search`, {
                params: { q: query }
            });

            console.log('[DEBUG] Search response:', response.data);
            setSearchQuery(query);
            setSearchResults(response.data);
            setShowSearchModal(true);
            console.log('[DEBUG] Modal should open now');
        } catch (err) {
            console.error('Error searching messages:', err);
        }
    }, [chat?.id]);

    const handleResultClick = useCallback(async (messageId) => {
        // Close modal
        setShowSearchModal(false);

        // Load messages around this result
        await fetchMessagesAround(messageId);

        // Scroll to message
        setTimeout(() => {
            scrollToSearchResult(messageId);
        }, 200);
    }, [fetchMessagesAround]);

    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
        setSearchResults(null);
        setShowSearchModal(false);
        setMessageLimit(50);
    }, []);

    const scrollToSearchResult = useCallback((messageId) => {
        // Just scroll to the message - we already loaded all messages on search
        const messageEl = document.getElementById(`message-${messageId}`);
        if (messageEl) {
            messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageEl.classList.add('search-highlight-active');
            setTimeout(() => {
                messageEl.classList.remove('search-highlight-active');
            }, 2000);
        } else {
            // Message not in DOM yet, might need to scroll or it's not loaded
            console.warn(`Message ${messageId} not found in DOM`);
        }
    }, []);

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

    const handleRename = async () => {
        const newName = window.prompt('Enter new chat name:', chat.chat_name);
        if (!newName || newName.trim() === '' || newName === chat.chat_name) return;

        try {
            const response = await api.put(`/chats/${chat.id}`, { chat_name: newName });
            // Update local state if needed, but ideally parent should reload. 
            // Since we don't have a direct way to update parent list from here without a prop, 
            // we'll rely on the parent's polling or trigger a callback if available.
            // For now, we can update the chat object locally if it's state-driven, 
            // but 'chat' is a prop. 
            // We should call an onUpdate prop if it existed, or just force a reload.
            // Let's assume the user will see the update on next poll or we can reload the page.
            // Better: Call onRename prop if we add it, or just alert success.
            window.location.reload(); // Simple and effective for now to refresh list and header
        } catch (error) {
            alert('Failed to rename chat: ' + (error.response?.data?.error || error.message));
        }
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
                                <button
                                    onClick={() => { setShowMenu(false); handleRename(); }}
                                    className="w-full px-4 py-2 text-left hover:bg-wa-panel dark:hover:bg-wa-bg-dark text-wa-text dark:text-wa-text-dark flex items-center gap-3 transition-colors"
                                >
                                    <span className="text-lg">✏️</span>
                                    Rename Chat
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

            {/* Search Results Modal */}
            {console.log('[DEBUG] showSearchModal:', showSearchModal, 'searchResults:', searchResults)}
            <SearchResultsModal
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                results={searchResults}
                searchQuery={searchQuery}
                onResultClick={handleResultClick}
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
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-wa-text-secondary dark:text-wa-text-secondary-dark">
                        No messages in this chat
                    </div>
                ) : (
                    <>
                        {/* Load More Button - Hide during search */}
                        {!searchResults && messages.length > messageLimit && (
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
                                        searchQuery={searchQuery}
                                        isSearchMatch={false}
                                    />
                                </React.Fragment>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Scroll to bottom button */}
            {
                showScrollButton && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-6 right-6 bg-white dark:bg-wa-received-dark p-3 rounded-full shadow-wa-lg hover:shadow-xl transition-all z-10 text-wa-icon dark:text-wa-icon-dark hover:text-wa-green"
                    >
                        <FaArrowDown />
                    </button>
                )
            }
        </div >
    );
};

export default ChatWindow;
