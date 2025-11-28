import React from 'react';

const VideoMessage = ({ message }) => {
    const media = message.media?.[0];

    if (!media) {
        return <div className="text-sm text-red-500">🎥 Video missing</div>;
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
        <>
            <video
                controls
                className="max-w-full rounded max-h-96"
                preload="metadata"
            >
                <source src={src} type={media.mime_type || 'video/mp4'} />
                Your browser does not support the video tag.
            </video>
            {message.body && <div className="text-sm mt-2">{message.body}</div>}
        </>
    );
};

export default VideoMessage;
