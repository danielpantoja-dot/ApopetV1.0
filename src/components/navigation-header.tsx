import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowLeft, Settings, Home, Users, Bell, QrCode } from "lucide-react";

interface NavigationHeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  ownerData?: {
    name?: string;
    avatar?: string;
  };
  notificationCount?: number;
}

export function NavigationHeader({ currentView, onNavigate, ownerData, notificationCount = 0 }: NavigationHeaderProps) {
  // Ensure ownerData has safe defaults with multiple fallbacks
  const defaultUserData = {
    name: 'Usuario',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
  };
  
  const safeOwnerData = {
    ...defaultUserData,
    ...(ownerData && typeof ownerData === 'object' ? ownerData : {}),
    // Final safety check to ensure name is always a valid string
    name: (ownerData?.name && typeof ownerData.name === 'string' && ownerData.name.trim()) 
      ? ownerData.name.trim() 
      : defaultUserData.name
  };

  // Debug log to identify the issue
  console.log('NavigationHeader Debug:', { ownerData, safeOwnerData, name: safeOwnerData.name });

  const getTitle = () => {
    switch (currentView) {
      case 'pet-profile':
        return null;
      case 'dashboard':
        return 'Mi Perfil';
      case 'community':
        return 'Comunidad';
      case 'notifications':
        return 'Notificaciones';
      case 'qr-options':
        return 'Código QR';
      case 'edit-user':
        return 'Editar Perfil';
      case 'edit-pet':
        return 'Editar Mascota';
      case 'user-profile':
        return 'Perfil';
      default:
        return '';
    }
  };

  const getInitials = (name?: string | null) => {
    // Multiple safety checks
    if (!name) return 'U';
    if (typeof name !== 'string') return 'U';
    if (name.trim() === '') return 'U';
    
    try {
      const cleanName = String(name).trim();
      if (!cleanName) return 'U';
      
      const parts = cleanName.split(' ').filter(part => part.length > 0);
      if (parts.length === 0) return 'U';
      
      const initials = parts.map(part => part.charAt(0)).join('').toUpperCase();
      return initials || 'U';
    } catch (error) {
      console.warn('Error generating initials:', error);
      return 'U';
    }
  };

  const showBackButton = !['pet-profile', 'dashboard', 'community'].includes(currentView);
  const showBottomNav = ['dashboard', 'community', 'pet-profile', 'qr-options'].includes(currentView);
  const showNotificationBell = ['dashboard', 'community'].includes(currentView);

  // For pet-profile, only show notification bell
  if (currentView === 'pet-profile') {
    return (
      <>
        {/* Notification Bell - Top Right */}
        {showNotificationBell && notificationCount > 0 && (
          <div className="fixed top-4 right-16 z-50">
            <Button
              onClick={() => onNavigate('notifications')}
              className="bg-white/90 backdrop-blur-sm border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground shadow-lg rounded-full w-12 h-12 p-0 relative"
            >
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('dashboard')}
                className="text-secondary hover:text-primary"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <h1 className="text-foreground">{getTitle()}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell - Top Right */}
            {showNotificationBell && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('notifications')}
                className="text-accent hover:text-primary relative p-2"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs flex items-center justify-center shadow-lg ring-2 ring-white animate-pulse">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </Button>
            )}
            
            {!showBottomNav && (
              <Avatar className="w-8 h-8 ring-2 ring-primary/30">
                <AvatarImage src={safeOwnerData.avatar} alt={safeOwnerData.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(safeOwnerData.name)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-border px-4 py-3">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {/* Comunidad - Primera posición */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('community')}
              className={`flex flex-col items-center gap-1 ${
                currentView === 'community'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Comunidad</span>
            </Button>

            {/* QR - Segunda posición */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('qr-options')}
              className={`flex flex-col items-center gap-1 ${
                currentView === 'qr-options'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span className="text-xs">QR</span>
            </Button>

            {/* Perfil - Tercera posición */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('dashboard')}
              className={`flex flex-col items-center gap-1 ${
                currentView === 'dashboard'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Avatar className="w-6 h-6 ring-1 ring-primary/30">
                <AvatarImage src={safeOwnerData.avatar} alt={safeOwnerData.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(safeOwnerData.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">Perfil</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}