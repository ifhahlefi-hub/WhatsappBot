import { useState, useEffect, useRef } from 'react';
import { Search, User, MessageSquare, Bot, Download } from 'lucide-react';
import { formatJam } from '../utils/formatTime';
import api from '../services/api';
import { io } from 'socket.io-client';

export default function ChatHistory() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [searchChat, setSearchChat] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [chatPage, setChatPage] = useState(1);
  const [hasMoreChats, setHasMoreChats] = useState(true);
  
  const chatEndRef = useRef(null);
  const selectedUserIdRef = useRef(null);
  const searchUserRef = useRef('');
  const searchChatRef = useRef('');

  useEffect(() => {
    selectedUserIdRef.current = selectedUser?.id;
  }, [selectedUser]);

  useEffect(() => {
    searchUserRef.current = searchUser;
  }, [searchUser]);

  useEffect(() => {
    searchChatRef.current = searchChat;
  }, [searchChat]);

  // Socket.IO Auto-update listener
  useEffect(() => {
    const adminPort = import.meta.env.VITE_ADMIN_PORT || 3001;
    const socketUrl = `http://${window.location.hostname}:${adminPort}`;
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on('chat_update', async (payload) => {
      // 1. Silent refetch daftar users (sidebar)
      try {
        const resUsers = await api.get('/users', { params: { search: searchUserRef.current, limit: 30 } });
        const usersData = resUsers.data?.data || resUsers.data || resUsers || {};
        setUsers(usersData.users || []);
      } catch (err) {
        console.error('Silent fetch users failed:', err);
      }

      // 2. Silent refetch chats HANYA JIKA user.id sama dengan yang sedang dibuka
      if (payload && payload.userId && selectedUserIdRef.current === payload.userId) {
        try {
          const resChats = await api.get('/chats', { 
            params: { user_id: selectedUserIdRef.current, search: searchChatRef.current, page: 1, limit: 50 } 
          });
          const chatsResData = resChats.data?.data || resChats.data || resChats || {};
          const newChatsData = chatsResData.chats || [];
          const newChatsReversed = [...newChatsData].reverse();

          setChats(prev => {
            const prevIds = new Set(prev.map(c => c.id));
            const newMessages = newChatsReversed.filter(c => !prevIds.has(c.id));
            if (newMessages.length > 0) {
              return [...prev, ...newMessages];
            }
            return prev;
          });
        } catch (err) {
          console.error('Silent fetch chats failed:', err);
        }
      }
    });

    return () => {
      socket.off('chat_update');
      socket.disconnect();
    };
  }, []);

  // Fetch users for sidebar
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users', { params: { search: searchUser, limit: 30 } });
        const data = res.data?.data || res.data || res || {};
        setUsers(data.users || []);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    const timeoutId = setTimeout(() => fetchUsers(), 500); // debounce
    return () => clearTimeout(timeoutId);
  }, [searchUser]);

  // Fetch chats for selected user
  useEffect(() => {
    if (!selectedUser) return;
    
    const fetchChats = async () => {
      setIsLoadingChats(true);
      try {
        const res = await api.get('/chats', { 
          params: { user_id: selectedUser.id, search: searchChat, page: chatPage, limit: 50 } 
        });
        
        const data = res.data?.data || res.data || res || {};
        const chatsData = data.chats || [];
        if (chatPage === 1) {
          // Reverse to show newest at bottom
          setChats([...chatsData].reverse());
        } else {
          setChats(prev => [...[...chatsData].reverse(), ...prev]);
        }
        
        setHasMoreChats(chatsData.length === 50);
      } catch (err) {
        console.error('Failed to fetch chats:', err);
        if (chatPage === 1) setChats([]);
      } finally {
        setIsLoadingChats(false);
      }
    };
    
    const timeoutId = setTimeout(() => fetchChats(), 300);
    return () => clearTimeout(timeoutId);
  }, [selectedUser, searchChat, chatPage]);

  // Scroll to bottom on new chat load (if page 1)
  useEffect(() => {
    if (chatPage === 1 && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chats, chatPage]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setChatPage(1);
    setChats([]);
    setSearchChat('');
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col -m-6 sm:-m-8">
      <div className="flex-1 flex overflow-hidden bg-gray-50 border-t border-gray-200">
        
        {/* Sidebar Kiri - Daftar User */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white border-r border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Conversations</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari user..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoadingUsers ? (
              <div className="p-4 text-center text-sm text-gray-500 animate-pulse">Memuat...</div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">Tidak ada user</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {users.map(user => (
                  <div 
                    key={user.id} 
                    onClick={() => handleSelectUser(user)}
                    className={`p-4 flex items-center cursor-pointer transition-colors ${selectedUser?.id === user.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {user.profile_picture ? (
                        <img src={user.profile_picture} className="w-12 h-12 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{user.push_name || user.whatsapp_number}</h3>
                        <span className="text-xs text-gray-400">{user.last_active ? formatJam(user.last_active) : ''}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.whatsapp_number}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel Kanan - Chat History */}
        <div className="hidden md:flex flex-1 flex-col bg-[#efeae2]">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center">
                  {selectedUser.profile_picture ? (
                    <img src={selectedUser.profile_picture} className="w-10 h-10 rounded-full mr-3 object-cover" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{selectedUser.push_name || 'Unknown'}</h2>
                    <p className="text-xs text-gray-500">{selectedUser.whatsapp_number}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => {
                    const ADMIN_URL = import.meta.env.VITE_ADMIN_PORT ? `http://localhost:${import.meta.env.VITE_ADMIN_PORT}` : '';
                    const token = localStorage.getItem('accessToken');
                    window.location.href = `${ADMIN_URL}/api/export/chats?token=${token}`;
                  }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg flex items-center transition-colors">
                    <Download className="h-4 w-4 mr-1"/>
                    Export CSV
                  </button>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari pesan..."
                      value={searchChat}
                      onChange={(e) => setSearchChat(e.target.value)}
                      className="pl-9 pr-4 py-1.5 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm w-48 transition-all"
                    />
                    <Search className="absolute left-3 top-2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4" style={{ backgroundImage: "url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')", backgroundSize: '400px' }}>
                {hasMoreChats && (
                  <div className="text-center">
                    <button 
                      onClick={() => setChatPage(p => p + 1)}
                      className="bg-white/90 text-sm text-blue-600 font-medium px-4 py-1.5 rounded-full shadow-sm hover:bg-white transition-colors"
                    >
                      {isLoadingChats ? 'Loading...' : 'Load older messages'}
                    </button>
                  </div>
                )}
                
                {chats.length === 0 && !isLoadingChats ? (
                  <div className="flex justify-center mt-10">
                    <span className="bg-white/90 text-gray-500 text-sm px-4 py-2 rounded-lg shadow-sm">Belum ada pesan.</span>
                  </div>
                ) : (
                  chats.map((chat) => {
                    const isBot = chat.sender === 'bot' || chat.sender === 'system';
                    return (
                      <div key={chat.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[70%] rounded-lg p-3 shadow-sm relative ${
                          isBot ? 'bg-white rounded-tl-none' : 'bg-[#d9fdd3] rounded-tr-none'
                        }`}>
                          {isBot && <div className="text-xs font-bold text-blue-500 mb-1 flex items-center"><Bot className="h-3 w-3 mr-1"/> Bot</div>}
                          <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">{chat.message}</div>
                          <div className="text-[10px] text-gray-400 mt-1 text-right">
                            {formatJam(chat.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
              <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                <MessageSquare className="h-10 w-10 text-gray-300" />
              </div>
              <h2 className="text-xl font-medium text-gray-900">Pilih User</h2>
              <p className="text-gray-500 mt-2">Pilih user di sidebar kiri untuk melihat riwayat percakapan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
