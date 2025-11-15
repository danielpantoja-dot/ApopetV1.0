import { useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Bell, Heart, MessageCircle, UserPlus, Settings, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useNotifications } from "../hooks/use-notifications";
import { useAuth } from "../hooks/use-auth";

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  from: {
    id: string;
    name: string;
    avatar: string;
    petName?: string;
  };
  content: string;
  timestamp: string;
  read: boolean;
  postId?: string;
}

interface NotificationsProps {
  onUserClick: (userId: string) => void;
  onPostClick: (postId: string) => void;
}

export function Notifications({ onUserClick, onPostClick }: NotificationsProps) {
  const { user } = useAuth();
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications(user?.id);
  
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Ahora";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-[#FF6F61]" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-[#6C63FF]" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-[#FFD166]" />;
      case 'mention':
        return <Bell className="w-4 h-4 text-[#FF6F61]" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.post_id) {
      onPostClick(notification.post_id);
    } else if (notification.type === 'follow' && notification.sender_id) {
      onUserClick(notification.sender_id);
    }
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-yellow-50 pt-20 pb-8">
      <div className="max-w-md mx-auto px-4">
        
        {/* Header */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#6C63FF]/10 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#6C63FF]" />
                </div>
                <div>
                  <h2 className="text-[#6C63FF]">Notificaciones</h2>
                  {unreadCount > 0 && (
                    <Badge className="bg-[#FF6F61] text-white">
                      {unreadCount} nuevas
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost" 
                size="sm"
                className="text-[#6C63FF] hover:text-[#6C63FF]/80"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Filter buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-[#6C63FF] hover:bg-[#6C63FF]/90' : 'border-[#6C63FF] text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white'}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
            className={filter === 'unread' ? 'bg-[#FF6F61] hover:bg-[#FF6F61]/90' : 'border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white'}
          >
            Sin leer ({unreadCount})
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-gray-600 hover:text-gray-800 ml-auto"
            >
              Marcar todas leídas
            </Button>
          )}
        </div>

        {/* Notifications list */}
        <div className="space-y-2">
          {loading ? (
            // Loading state
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6 pb-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">Cargando notificaciones...</p>
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6 pb-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">No hay notificaciones</p>
                <p className="text-sm text-gray-500">
                  {filter === 'unread' 
                    ? "¡Genial! No tienes notificaciones sin leer" 
                    : "Cuando tengas actividad nueva, aparecerá aquí"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`shadow-md border-0 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    notification.read 
                      ? 'bg-white/70 backdrop-blur-sm' 
                      : 'bg-white/90 backdrop-blur-sm ring-2 ring-[#FF6F61]/20'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12 ring-2 ring-[#E0E0E0]">
                          <AvatarImage src={notification.sender?.avatar_url || ''} alt={notification.sender?.name || 'Usuario'} />
                          <AvatarFallback className="bg-[#6C63FF] text-white">
                            {notification.sender?.name ? notification.sender.name.split(' ').map(n => n[0]).join('') : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span 
                                className="text-[#6C63FF] hover:text-[#FF6F61] transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (notification.sender_id) {
                                    onUserClick(notification.sender_id);
                                  }
                                }}
                              >
                                {notification.sender?.name || 'Usuario'}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.content}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-[#FF6F61] rounded-full"></div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-500 w-8 h-8 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Bottom spacer */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}