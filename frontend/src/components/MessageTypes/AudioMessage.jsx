import React from 'react';

const AudioMessage = ({ message }) => {
    const media = message.media?.[0];

    if (!media) {
        return <div className="text-sm text-red-500">🎵 Audio missing</div>;
    }

    // Extract media URL from storage_path
    const getMediaUrl = (storagePath) => {
        if (!storagePath) return null;
        const token = localStorage.getItem('token');
        if (!token) return null;
        const normalized = storagePath.replace(/\\/g, '/');
        const parts = normalized.split('/');
        const relevantParts = parts.slice(-4);
        return `/api/media/${relevantParts.join('/')}?token=${token}`;
    };

    const src = getMediaUrl(media.storage_path);

    return (
        <div className="w-full max-w-sm">
            <audio controls className="w-full">
                <source src={src} type={media.mime_type || 'audio/mpeg'} />
                Your browser does not support the audio tag.
            </audio>
            {message.body && <div className="text-sm mt-2">{message.body}</div>}
        </div>
    );
};

export default AudioMessage;
