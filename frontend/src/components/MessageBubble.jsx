import React, { useState } from 'react';
import { format } from 'date-fns';
import { FaThumbtack } from 'react-icons/fa';
import TextMessage from './MessageTypes/TextMessage';
import ImageMessage from './MessageTypes/ImageMessage';
import VideoMessage from './MessageTypes/VideoMessage';
import AudioMessage from './MessageTypes/AudioMessage';
import DocumentMessage from './MessageTypes/DocumentMessage';

const MessageBubble = ({ message, prevMessage, onTogglePin }) => {
    const isSent = message.sender_is_me;
    const showSender = !prevMessage || prevMessage.sender_name !== message.sender_name;
    const [showMenu, setShowMenu] = useState(false);

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
            case 'system':
                return (
                    <div className="text-center py-2">
                        <div className="inline-block px-3 py-1 bg-white/80 dark:bg-black/20 rounded-lg text-xs text-wa-text-secondary dark:text-wa-text-secondary-dark">
                            {message.body}
                        </div>
                    </div>
                );
            default:
                return <TextMessage message={message} />;
        }
    };

    // System messages are centered
    if (message.message_type === 'system') {
        return renderContent();
    }

    return (
        <div
            id={`message-${message.id}`}
            className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-1 animate-fade-in`}
        >
            <div
                onContextMenu={(e) => {
                    e.preventDefault();
                    setShowMenu(!showMenu);
                }}
                className={`relative max-w-[65%] px-3 py-2 rounded-wa shadow-wa cursor-context-menu ${isSent
                    ? 'bg-wa-sent dark:bg-wa-sent-dark text-black dark:text-white'
                    : 'bg-wa-received dark:bg-wa-received-dark text-wa-text dark:text-wa-text-dark'
                    }`}
            >
                {/* Message tail */}
                <div className={isSent ? 'message-tail-sent' : 'message-tail-received'} />

                {/* Sender name for received messages */}
                {!isSent && showSender && (
                    <div className="text-sm font-semibold text-wa-green dark:text-wa-green mb-1">
                        {message.sender_name}
                    </div>
                )}

                {/* Message content */}
                <div className="message-content">
                    {renderContent()}
                </div>

                {/* Timestamp with full date */}
                <div className="flex items-center justify-end gap-1 mt-1">
                    {message.is_pinned && (
                        <FaThumbtack
                            className="text-xs opacity-60"
                            style={{ color: '#dc3545' }}
                            title="Pinned message"
                        />
                    )}
                    <div className="text-[10px] opacity-60 text-right select-none">
                        {format(new Date(message.timestamp), 'MMM d, yyyy h:mm a')}
                    </div>
                </div>
            </div>

            {/* Context Menu for Pin */}
            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-wa-received-dark shadow-wa-lg rounded-lg py-2 min-w-[150px] z-20">
                        <button
                            onClick={() => {
                                setShowMenu(false);
                                onTogglePin?.(message.id);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-wa-panel dark:hover:bg-wa-bg-dark flex items-center gap-3 transition-colors text-sm"
                        >
                            <FaThumbtack />
                            {message.is_pinned ? 'Unpin' : 'Pin'} Message
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default MessageBubble;
