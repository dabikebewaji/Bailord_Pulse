import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Search, MessageSquare } from 'lucide-react';
import { NewConversationDialog } from '@/components/NewConversationDialog';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import { useMessages } from '@/hooks/use-messages';
import { useSocket } from '@/hooks/use-socket';
import { messageAPI } from '@/services/api';
import { toast } from 'sonner';

// Time formatting helper
const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than a minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  
  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // Less than a week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
  
  // Otherwise return the date
  return date.toLocaleDateString();
};

interface Conversation {
  id: number;
  name: string;
  company: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = new URLSearchParams(location.search).get('userId');

  // Define all useState hooks first
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{
    id: string;
    name: string;
    businessName?: string;
    email: string;
    role?: string;
  }>>([]);
  // Removed duplicate typingTimeoutRef declaration

  // Then other hooks
  const { 
    messages, 
    conversations,
    isLoading, 
    fetchMessages, 
    fetchConversations,
    sendMessage,
    createConversation
  } = useMessages({
    userId: Number(user?.id) || 0,
  });
  
  const { startTyping, stopTyping, socket } = useSocket();

  // Set initial selected conversation when conversations are loaded
  useEffect(() => {
    console.log('Conversations updated:', conversations);
    if (conversations.length > 0) {
      if (userId) {
        console.log('Looking for conversation with userId:', userId);
        // Find the conversation with the specified retailer
        const targetConversation = conversations.find(
          (conv) => String(conv.id) === userId
        );
        if (targetConversation) {
          console.log('Found target conversation:', targetConversation);
          setSelectedConversation(targetConversation);
          navigate('/messages', { replace: true });
        } else {
          console.log('Creating new conversation with userId:', userId);
          // Create a new conversation with the retailer
          createConversation(userId)
            .then(newConversation => {
              console.log('Created new conversation:', newConversation);
              setSelectedConversation(newConversation);
              navigate('/messages', { replace: true });
            })
            .catch((error) => {
              console.error('Failed to create conversation:', error);
              // If creation fails, fall back to the first conversation
              if (conversations.length > 0) {
                console.log('Falling back to first conversation:', conversations[0]);
                setSelectedConversation(conversations[0]);
              }
            });
        }
      } else if (!selectedConversation) {
        console.log('No userId, selecting first conversation:', conversations[0]);
        setSelectedConversation(conversations[0]);
      }
    } else {
      console.log('No conversations available');
    }
  }, [conversations, userId, navigate, createConversation]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (selectedConversation) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send typing indicator
      startTyping(Number(selectedConversation.id));

      // Stop typing indicator after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(Number(selectedConversation.id));
      }, 2000);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for typing indicators
    socket.on('user_typing', (data) => {
      if (selectedConversation && data.user_id === Number(selectedConversation.id)) {
        setIsTyping(true);
      }
    });

    socket.on('user_stopped_typing', (data) => {
      if (selectedConversation && data.user_id === Number(selectedConversation.id)) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, [socket, selectedConversation]);

  // Initial message fetch
  useEffect(() => {
    fetchConversations();

    // Fetch available users for new conversations
    const fetchAvailableUsers = async () => {
      try {
        const response = await messageAPI.getAvailableUsers();
        setAvailableUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch available users:', error);
        toast.error('Failed to load available users');
      }
    };
    fetchAvailableUsers();
  }, [fetchConversations]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation && selectedConversation.id) {
      console.log('Selected conversation changed, fetching messages:', selectedConversation);
      fetchMessages(selectedConversation.id);
    } else {
      console.log('No conversation selected or invalid ID');
    }
  }, [fetchMessages, selectedConversation?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Handle send message called');
    console.log('Selected conversation:', selectedConversation);
    console.log('Message input:', messageInput);
    
    if (!messageInput.trim()) {
      console.log('Message is empty');
      return;
    }
    
    if (!selectedConversation) {
      console.log('No conversation selected');
      return;
    }
    
    try {
      // Clear any ongoing typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        stopTyping(Number(selectedConversation.id));
      }

      console.log('Sending message to user:', selectedConversation.id);
      const result = await sendMessage(Number(selectedConversation.id), messageInput.trim());
      console.log('Message sent successfully:', result);
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-1">
              Communicate with retailers and team members
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowNewConversation(true)}>
            <MessageSquare className="h-4 w-4" />
            New Message
          </Button>
        </div>

        <NewConversationDialog 
          isOpen={showNewConversation}
          onClose={() => setShowNewConversation(false)}
          onSelectUser={async (user) => {
            try {
              console.log('Creating conversation with user:', user);
              const newConversation = await createConversation(user.id);
              console.log('Created conversation:', newConversation);
              
              // Immediately select the new conversation
              setSelectedConversation(newConversation);
              
              // Refresh conversations list
              await fetchConversations();
              
              // Clear the search params but don't add to browser history
              navigate('/messages', { replace: true });
              
              toast.success(`Started conversation with ${user.name}`);
            } catch (error) {
              console.error('Failed to create conversation:', error);
              toast.error('Failed to start conversation');
            }
          }}
          users={availableUsers}
        />

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-16rem)]">
          {/* Conversations List */}
          <Card className="col-span-4 p-0 overflow-hidden">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-5rem)]">
              <div className="p-2">
                {conversations
                  .filter(conv => 
                    searchQuery 
                      ? conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        conv.company.toLowerCase().includes(searchQuery.toLowerCase())
                      : true
                  )
                  .map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full p-3 rounded-lg transition-colors text-left ${
                        selectedConversation?.id === conversation.id
                          ? 'bg-primary/10'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm truncate">{conversation.name}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(conversation.last_message_time)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{conversation.company}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message}
                          </p>
                        </div>
                        {conversation.unread_count > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="col-span-8 p-0 overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              {selectedConversation ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{selectedConversation.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedConversation.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.company || selectedConversation.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Chatting as {user?.name}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  Select a conversation to start messaging
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground text-sm">Loading conversation...</p>
                </div>
              ) : !selectedConversation ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground">Start the conversation by sending a message</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = String(message.senderId) === String(user?.id);
                    return (
                      <div
                        key={message.id}
                        className={`flex items-start gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isOwnMessage && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{selectedConversation?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p
                              className={`text-xs ${
                                isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              }).replace(/\s+/g, ' ').trim()}
                            </p>
                            {message.isRead && isOwnMessage && (
                              <span className="text-xs text-primary-foreground/70">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            <form 
              onSubmit={handleSendMessage} 
              className="p-4 border-t"
            >
              <div className="space-y-2">
                {isTyping && (
                  <p className="text-xs text-muted-foreground italic">
                    {selectedConversation.name} is typing...
                  </p>
                )}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={selectedConversation ? "Type a message..." : "Select a conversation to start messaging"}
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (selectedConversation && messageInput.trim()) {
                          handleSendMessage(e);
                        }
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    variant={!selectedConversation || !messageInput.trim() ? "outline" : "default"}
                    disabled={!selectedConversation || !messageInput.trim()}
                  >
                    <Send className={`h-4 w-4 ${!selectedConversation || !messageInput.trim() ? 'text-muted-foreground' : ''}`} />
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
  );
};

export default Messages;
