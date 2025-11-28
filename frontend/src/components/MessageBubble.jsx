import React from 'react';
import { format } from 'date-fns';
import TextMessage from './MessageTypes/TextMessage';
import ImageMessage from './MessageTypes/ImageMessage';
import VideoMessage from './MessageTypes/VideoMessage';
import AudioMessage from './MessageTypes/AudioMessage';
import DocumentMessage from './MessageTypes/DocumentMessage';

const MessageBubble = ({ message, prevMessage }) => {
    const isSent = message.sender_is_me;
    const showSender = !prevMessage || prevMessage.sender_name !== message.sender_name;

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
        <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-1 animate-fade-in`}>
            <div
                className={`relative max-w-[65%] px-3 py-2 rounded-wa shadow-wa ${isSent
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

                {/* Timestamp */}
                <div className={`text-[10px] text-right mt-1 ${isSent ? 'text-gray-600 dark:text-gray-400' : 'text-wa-text-secondary dark:text-wa-text-secondary-dark'
                    }`}>
                    {format(new Date(message.timestamp), 'HH:mm')}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
