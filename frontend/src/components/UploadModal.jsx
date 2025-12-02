import React, { useState, useRef } from 'react';
import api from '../utils/api';
import { FaTimes, FaUpload, FaCheckCircle, FaExclamationCircle, FaQuestionCircle } from 'react-icons/fa';

const UploadModal = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [jobId, setJobId] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, processing, success, error
    const [error, setError] = useState('');
    const [showGuide, setShowGuide] = useState(false);
    const [uploadMethod, setUploadMethod] = useState('direct'); // 'direct' or 'drive'
    const [driveLink, setDriveLink] = useState('');
    const fileInputRef = useRef(null);

    const handleDriveUpload = async () => {
        if (!driveLink) return;

        setUploading(true);
        setStatus('uploading');
        setError('');
        setProgress(0);

        try {
            const response = await api.post('/upload/drive', { url: driveLink });
            const { uploadUuid } = response.data;

            // Poll for download status
            const interval = setInterval(async () => {
                try {
                    const statusRes = await api.get(`/upload/drive/status/${uploadUuid}`);

                    if (statusRes.data.status === 'downloading') {
                        setProgress(statusRes.data.progress);
                    } else if (statusRes.data.status === 'completed') {
                        clearInterval(interval);
                        setStatus('processing');
                        setProgress(0);

                        // Start polling for parse job
                        pollJobStatus(statusRes.data.jobId);
                    } else if (statusRes.data.status === 'error') {
                        clearInterval(interval);
                        throw new Error(statusRes.data.error);
                    }
                } catch (err) {
                    clearInterval(interval);
                    console.error('Drive status check failed:', err);
                    setError(err.message || 'Failed to check download status');
                    setStatus('error');
                    setUploading(false);
                }
            }, 2000);

        } catch (err) {
            console.error('Drive upload failed:', err);
            setError(err.response?.data?.error || 'Failed to start Drive download');
            setStatus('error');
            setUploading(false);
        }
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.name.endsWith('.zip')) {
                setFile(selectedFile);
                setError('');
            } else {
                setError('Please select a .zip file');
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.zip')) {
            setFile(droppedFile);
            setError('');
        } else {
            setError('Please drop a .zip file');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setStatus('uploading');
        setError('');
        setProgress(0);

        // Use tus for resumable uploads
        const { Upload } = await import('tus-js-client');

        const token = localStorage.getItem('token');

        const upload = new Upload(file, {
            endpoint: `${window.location.protocol}//${window.location.host}/api/upload/tus/`,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            metadata: {
                filename: file.name,
                filetype: file.type
            },
            headers: {
                'Authorization': `Bearer ${token}`
            },
            chunkSize: 100 * 1024 * 1024, // 100MB chunks
            onError: (error) => {
                console.error('Upload failed:', error);
                setError('Upload failed: ' + error.message);
                setStatus('error');
                setUploading(false);
            },
            onProgress: (bytesUploaded, bytesTotal) => {
                const percent = Math.round((bytesUploaded / bytesTotal) * 100);
                setProgress(percent);
            },
            onSuccess: async () => {
                console.log('Upload completed successfully');
                setStatus('processing');
                setProgress(0);

                // Get the upload URL to extract job ID
                const uploadUrl = upload.url;
                const uploadId = uploadUrl.split('/').pop();

                // Poll for processing status
                // Note: We'll need to modify backend to return jobId from tus upload
                // For now, just show success after a delay
                setTimeout(() => {
                    setStatus('success');
                    setTimeout(() => {
                        onSuccess?.();
                        onClose();
                    }, 2000);
                }, 3000);
            }
        });

        // Start the upload
        upload.start();
    };

    const pollJobStatus = async (id) => {
        const interval = setInterval(async () => {
            try {
                const response = await api.get(`/upload/status/${id}`);
                setProgress(response.data.progress || 0);

                if (response.data.state === 'completed') {
                    clearInterval(interval);
                    setStatus('success');
                    setTimeout(() => {
                        onSuccess?.();
                        onClose();
                    }, 2000);
                } else if (response.data.state === 'failed') {
                    clearInterval(interval);
                    setError(response.data.error || 'Processing failed');
                    setStatus('error');
                }
            } catch (error) {
                clearInterval(interval);
                setError('Failed to check status');
                setStatus('error');
            }
        }, 3000);
    };

    const resetUpload = () => {
        setStatus('idle');
        setError('');
        setFile(null);
        setProgress(0);
        setJobId(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-wa-panel-dark rounded-lg shadow-wa-lg max-w-md w-full p-6 animate-slide-up">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-wa-text dark:text-wa-text-dark">
                        Upload WhatsApp Chat
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-wa-icon dark:text-wa-icon-dark hover:text-wa-text dark:hover:text-wa-text-dark transition-colors"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                {status === 'success' ? (
                    <div className="text-center py-8">
                        <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4 animate-fade-in" />
                        <p className="text-lg font-medium text-wa-text dark:text-wa-text-dark">
                            Chat imported successfully!
                        </p>
                        <p className="text-sm text-wa-text-secondary dark:text-wa-text-secondary-dark mt-2">
                            Redirecting...
                        </p>
                    </div>
                ) : status === 'error' ? (
                    <div className="text-center py-8">
                        <FaExclamationCircle className="text-5xl text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <button
                            onClick={resetUpload}
                            className="px-6 py-2 bg-wa-green hover:bg-wa-green-dark text-white rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex mb-6 border-b border-wa-border dark:border-wa-border-dark">
                            <button
                                className={`flex-1 pb-2 text-sm font-medium transition-colors ${uploadMethod === 'direct'
                                    ? 'text-wa-green border-b-2 border-wa-green'
                                    : 'text-wa-text-secondary hover:text-wa-text dark:text-wa-text-secondary-dark dark:hover:text-wa-text-dark'
                                    }`}
                                onClick={() => setUploadMethod('direct')}
                            >
                                Direct Upload
                            </button>
                            <button
                                className={`flex-1 pb-2 text-sm font-medium transition-colors ${uploadMethod === 'drive'
                                    ? 'text-wa-green border-b-2 border-wa-green'
                                    : 'text-wa-text-secondary hover:text-wa-text dark:text-wa-text-secondary-dark dark:hover:text-wa-text-dark'
                                    }`}
                                onClick={() => setUploadMethod('drive')}
                            >
                                Google Drive Link
                            </button>
                        </div>

                        {uploadMethod === 'direct' ? (
                            <div
                                className="border-2 border-dashed border-wa-border dark:border-wa-border-dark rounded-lg p-8 text-center cursor-pointer hover:border-wa-green dark:hover:border-wa-green transition-colors mb-4"
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                <FaUpload className="text-4xl text-wa-icon dark:text-wa-icon-dark mx-auto mb-4" />
                                <p className="text-wa-text dark:text-wa-text-dark mb-2">
                                    {file ? (
                                        <>
                                            <span className="font-medium">{file.name}</span>
                                            <br />
                                            <span className="text-sm text-wa-text-secondary">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </>
                                    ) : (
                                        'Click to select or drag ZIP file here'
                                    )}
                                </p>
                                <p className="text-xs text-wa-text-secondary dark:text-wa-text-secondary-dark">
                                    Maximum size: 10GB
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".zip"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-wa-text dark:text-wa-text-dark mb-2">
                                    Google Drive Link
                                </label>
                                <input
                                    type="text"
                                    value={driveLink}
                                    onChange={(e) => setDriveLink(e.target.value)}
                                    placeholder="https://drive.google.com/file/d/..."
                                    className="w-full px-4 py-2 rounded-lg border border-wa-border dark:border-wa-border-dark bg-white dark:bg-wa-bg-dark text-wa-text dark:text-wa-text-dark focus:outline-none focus:border-wa-green transition-colors"
                                />
                                <p className="text-xs text-wa-text-secondary dark:text-wa-text-secondary-dark mt-2">
                                    Make sure the link is accessible (Anyone with the link)
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        {(uploading || status === 'processing') && (
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2 text-wa-text dark:text-wa-text-dark">
                                    <span>{status === 'uploading' ? 'Uploading...' : 'Processing chat...'}</span>
                                    <span className="font-medium">{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-wa-green h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-wa-text-secondary dark:text-wa-text-secondary-dark mt-2 text-center">
                                    {status === 'processing' && 'Parsing messages and mapping media files...'}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={uploadMethod === 'direct' ? handleUpload : handleDriveUpload}
                            disabled={(uploadMethod === 'direct' && !file) || (uploadMethod === 'drive' && !driveLink) || uploading || status === 'processing'}
                            className="w-full px-6 py-3 bg-wa-green hover:bg-wa-green-dark text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <div className="spinner"></div>
                                    Uploading...
                                </>
                            ) : status === 'processing' ? (
                                <>
                                    <div className="spinner"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <FaUpload />
                                    Upload
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setShowGuide(!showGuide)}
                            className="w-full mt-3 px-4 py-2 text-wa-green hover:bg-wa-green/10 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <FaQuestionCircle />
                            {showGuide ? 'Hide' : 'How to export chat from WhatsApp?'}
                        </button>

                        {showGuide && (
                            <div className="mt-4 p-4 bg-wa-panel dark:bg-wa-bg-dark rounded-lg text-sm space-y-3 max-h-60 overflow-y-auto">
                                <div>
                                    <p className="font-semibold text-wa-text dark:text-wa-text-dark mb-2">📱 On Android:</p>
                                    <ol className="list-decimal list-inside space-y-1 text-wa-text-secondary dark:text-wa-text-secondary-dark">
                                        <li>Open the chat in WhatsApp</li>
                                        <li>Tap the three dots (⋮) → <strong>More</strong> → <strong>Export chat</strong></li>
                                        <li>Choose <strong>Include media</strong></li>
                                        <li>Save the ZIP file</li>
                                    </ol>
                                </div>
                                <div>
                                    <p className="font-semibold text-wa-text dark:text-wa-text-dark mb-2">📱 On iPhone:</p>
                                    <ol className="list-decimal list-inside space-y-1 text-wa-text-secondary dark:text-wa-text-secondary-dark">
                                        <li>Open the chat in WhatsApp</li>
                                        <li>Tap contact/group name at top</li>
                                        <li>Scroll down → <strong>Export Chat</strong></li>
                                        <li>Choose <strong>Attach Media</strong></li>
                                        <li>Save to Files</li>
                                    </ol>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default UploadModal;
