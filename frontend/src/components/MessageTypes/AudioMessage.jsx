import React, { useRef, useState, useEffect } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';

const AudioMessage = ({ message }) => {
    const media = message.media?.[0];
    const audioRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    if (!media) {
        return (
            <div className="flex items-center gap-2 text-sm text-red-500 py-2">
                <span>🎵</span>
                <span>Audio file missing</span>
            </div>
        );
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

    const togglePlay = () => {
        if (!audioRef.current || loading || error) return;

        if (playing) {
            audioRef.current.pause();
            setPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setPlaying(true);
            }).catch(err => {
                console.error('Audio playback error:', err);
                setError(true);
            });
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
            setLoading(false);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleEnded = () => {
        setPlaying(false);
        setCurrentTime(0);
    };

    const handleError = (e) => {
        console.error('Audio loading error:', e);
        setError(true);
        setLoading(false);
    };

    const handleCanPlay = () => {
        setLoading(false);
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds === 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (error) {
        return (
            <div className="flex items-center gap-2 text-sm text-red-500 py-2">
                <span>🎵</span>
                <span>Failed to load audio</span>
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm">
            <div className="flex items-center gap-2 bg-white/10 dark:bg-black/10 rounded-lg px-3 py-2">
                {/* Play/Pause Button */}
                <button
                    onClick={togglePlay}
                    disabled={loading || error}
                    className={`flex-shrink-0 w-10 h-10 rounded-full ${loading || error ? 'bg-gray-400 cursor-not-allowed' : 'bg-wa-green hover:bg-wa-green-dark'} text-white flex items-center justify-center transition-colors`}
                    aria-label={playing ? 'Pause' : 'Play'}
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        playing ? <FaPause size={14} /> : <FaPlay size={14} className="ml-0.5" />
                    )}
                </button>

                {/* Waveform/Progress */}
                <div className="flex-1 flex flex-col gap-1">
                    <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-wa-green transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                </div>
            </div>

            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onError={handleError}
                onCanPlay={handleCanPlay}
            />

            {message.body && <div className="text-sm mt-2">{message.body}</div>}
        </div>
    );
};

export default AudioMessage;
