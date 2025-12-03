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
            <div className="relative group inline-block">
                <video
                    controls
                    className="max-w-full rounded max-h-96"
                    preload="metadata"
                >
                    <source src={src} type={media.mime_type || 'video/mp4'} />
                    Your browser does not support the video tag.
                </video>
                <a
                    href={`/api/media/download/${media.id}?token=${localStorage.getItem('token')}`}
                    download
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Download Video"
                >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"></path><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"></path></svg>
                </a>
            </div>
            {message.body && <div className="text-sm mt-2">{message.body}</div>}
        </>
    );
};

export default VideoMessage;
