import { useState } from 'react';
import { FaThumbtack, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import '../styles/PinnedMessagesBar.css';

const PinnedMessagesBar = ({ pinnedMessages, onNavigate, onUnpin }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!pinnedMessages || pinnedMessages.length === 0) {
        return null;
    }

    const formatMessagePreview = (message) => {
        if (message.message_type === 'image') return '📷 Photo';
        if (message.message_type === 'video') return '🎥 Video';
        if (message.message_type === 'audio') return '🎵 Audio';
        if (message.message_type === 'document') return '📄 Document';
        return message.body || 'Message';
    };

    return (
        <div className="pinned-messages-bar">
            <div className="pinned-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="pinned-title">
                    <FaThumbtack className="pin-icon" />
                    <span>{pinnedMessages.length} Pinned Message{pinnedMessages.length > 1 ? 's' : ''}</span>
                </div>
                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </div>

            {isExpanded && (
                <div className="pinned-messages-list">
                    {pinnedMessages.map((message) => (
                        <div key={message.id} className="pinned-message-item">
                            <div
                                className="pinned-message-content"
                                onClick={() => onNavigate(message.id)}
                            >
                                <div className="pinned-sender">{message.sender_name}</div>
                                <div className="pinned-preview">
                                    {formatMessagePreview(message)}
                                </div>
                            </div>
                            <button
                                className="unpin-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUnpin(message.id);
                                }}
                                aria-label="Unpin message"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PinnedMessagesBar;
