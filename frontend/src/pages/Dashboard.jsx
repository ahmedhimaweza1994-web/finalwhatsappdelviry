import React, { useState, useEffect } from 'react';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import UploadModal from '../components/UploadModal';

const Dashboard = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [showUpload, setShowUpload] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isMockMode, setIsMockMode] = useState(false);

    useEffect(() => {
        setIsMockMode(localStorage.getItem('useMockAPI') === 'true');
    }, []);

    const handleUploadSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
        setShowUpload(false);
    };

    const handleChatDelete = (chatId) => {
        if (selectedChat?.id === chatId) {
            setSelectedChat(null);
        }
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="h-screen flex flex-col bg-wa-panel dark:bg-wa-panel-dark overflow-hidden">
            {/* Mock Mode Warning Banner */}
            {isMockMode && (
                <div className="bg-yellow-500 text-black px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
                    <span className="font-semibold">⚠️ Demo Mode</span>
                    <span>Backend not connected - using localStorage (data will be lost on refresh)</span>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Left Sidebar - Chat List */}
                <div className={`w-full md:w-[400px] flex-shrink-0 border-r border-wa-border dark:border-wa-border-dark ${selectedChat ? 'hidden md:flex' : 'flex'
                    } flex-col min-h-0`}>
                    <ChatList
                        key={refreshTrigger}
                        selectedChat={selectedChat}
                        onSelectChat={setSelectedChat}
                        onOpenUpload={() => setShowUpload(true)}
                    />
                </div>

                {/* Right Panel - Chat Window */}
                <div className={`flex-1 ${selectedChat ? 'flex' : 'hidden md:flex'} flex-col min-w-0 min-h-0`}>
                    {/* Mobile back button */}
                    {selectedChat && (
                        <div className="md:hidden bg-wa-panel dark:bg-wa-received-dark px-4 py-2 border-b border-wa-border dark:border-wa-border-dark flex-shrink-0">
                            <button
                                onClick={() => setSelectedChat(null)}
                                className="text-wa-green hover:text-wa-green-dark font-medium"
                            >
                                ← Back to chats
                            </button>
                        </div>
                    )}

                    <ChatWindow
                        chat={selectedChat}
                        onDelete={handleChatDelete}
                    />
                </div>
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <UploadModal
                    onClose={() => setShowUpload(false)}
                    onSuccess={handleUploadSuccess}
                />
            )}
        </div>
    );
};

export default Dashboard;
