import { useState, useEffect } from "react";
import { PetProfile } from "./components/pet-profile";
import { NavigationHeader } from "./components/navigation-header";
import { UserDashboard } from "./components/user-dashboard";
import { EditUserProfile } from "./components/edit-user-profile";
import { EditPetProfile } from "./components/edit-pet-profile";
import { CommunityFeed } from "./components/community-feed";
import { Notifications } from "./components/notifications";
import { UserProfileView } from "./components/user-profile-view";
import { QROptions } from "./components/qr-options";
import { AuthModal } from "./components/auth-modal";
import { PublicViewRouter } from "./components/public-view-router";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { useAuth } from "./hooks/use-auth";
import { useProfile } from "./hooks/use-profile";
import { usePosts } from "./hooks/use-posts";
import { useNotifications } from "./hooks/use-notifications";
import { PawPrint, Loader2 } from "lucide-react";

// Tipos mejorados para el estado de la aplicación
type ViewType = 
  | 'pet-profile' 
  | 'dashboard' 
  | 'edit-user' 
  | 'edit-pet' 
  | 'community' 
  | 'notifications' 
  | 'user-profile' 
  | 'qr-options';

interface AppState {
  currentView: ViewType;
  selectedUserId: string | null;
  notificationCount: number;
  isInitialized: boolean;
}

export default function App() {
  // Hooks personalizados para gestión de estado
  const { user, session, loading: authLoading, signOut, isAuthenticated } = useAuth();
  const { 
    profile: userProfile, 
    pet, 
    loading: profileLoading, 
    updateProfile, 
    updatePet, 
    createPet,
    refreshProfile 
  } = useProfile(user?.id);
  
  const { posts, loading: postsLoading, createPost, toggleLike, addComment, deleteComment, deletePost } = usePosts(user?.id);

  // Hook de notificaciones para contador en tiempo real
  const { unreadCount } = useNotifications(user?.id);

  // Estado local de la aplicación
  const [appState, setAppState] = useState<AppState>({
    currentView: 'community',
    selectedUserId: null,
    notificationCount: 0,
    isInitialized: false
  });

  // Efecto para inicialización de la aplicación
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (!authLoading) {
          if (isAuthenticated && user) {
            console.log('🔐 Usuario autenticado:', user.id);
            
            // Si el usuario no tiene perfil o mascota, redirigir a creación
            if (!userProfile && !profileLoading) {
              setAppState(prev => ({ ...prev, currentView: 'edit-user' }));
              toast.info("Completa tu perfil para comenzar");
            } else if (userProfile && !pet && !profileLoading) {
              setAppState(prev => ({ ...prev, currentView: 'edit-pet' }));
              toast.info("Agrega tu mascota para comenzar");
            } else if (userProfile && pet) {
              setAppState(prev => ({ ...prev, currentView: 'dashboard' }));
            }
          } else {
            setAppState(prev => ({ ...prev, currentView: 'community' }));
          }
          
          setAppState(prev => ({ ...prev, isInitialized: true }));
        }
      } catch (error) {
        console.error('Error inicializando aplicación:', error);
        toast.error("Error al inicializar la aplicación");
        setAppState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    initializeApp();
  }, [authLoading, isAuthenticated, user, userProfile, pet, profileLoading]);

  // Handlers para navegación y acciones
  const handleNavigate = (view: ViewType) => {
    setAppState(prev => ({ 
      ...prev, 
      currentView: view,
      // Reset user selection when navigating away from user profile
      ...(view !== 'user-profile' && { selectedUserId: null })
    }));
  };

  const handleUserClick = (userId: string) => {
    setAppState(prev => ({ 
      ...prev, 
      selectedUserId: userId, 
      currentView: 'user-profile' 
    }));
  };

  const handlePostClick = (postId: string) => {
    // Para futura implementación: vista detallada de publicación
    setAppState(prev => ({ ...prev, currentView: 'community' }));
    toast.info("Funcionalidad de vista detallada en desarrollo");
  };

  const handleFollow = async (userId: string) => {
    if (!user) {
      toast.error("Debes iniciar sesión para seguir usuarios");
      return;
    }

    try {
      // Implementar lógica de follow/unfollow aquí
      console.log(`Following/unfollowing user: ${userId}`);
      toast.success("Función de seguir usuario ejecutada");
    } catch (error) {
      console.error('Error following user:', error);
      toast.error("Error al seguir usuario");
    }
  };

  const handleSaveUser = async (userData: any) => {
    if (!user?.id) {
      toast.error("Usuario no autenticado");
      return;
    }

    try {
      await updateProfile(userData);
      toast.success("✅ Perfil actualizado correctamente");
      handleNavigate('dashboard');
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error; // Re-lanzar para manejo en el componente
    }
  };

  const handleSavePet = async (petData: any) => {
    if (!user?.id) {
      toast.error("Usuario no autenticado");
      return;
    }

    try {
      if (pet) {
        await updatePet(petData);
      } else {
        await createPet(petData);
      }
      toast.success("Perfil de mascota actualizado correctamente");
      handleNavigate('dashboard');
    } catch (error) {
      console.error('Error saving pet profile:', error);
      throw error;
    }
  };

  const handleCreatePost = async (postData: any) => {
    if (!user?.id) {
      toast.error("Debes iniciar sesión para crear publicaciones");
      return;
    }

    try {
      const postToCreate = {
        author_id: user.id,
        pet_id: pet?.id || null,
        content: postData.content,
        image_url: postData.image || null,
        type: postData.type || 'normal',
        pet_info: postData.petInfo || null,
        created_at: new Date().toISOString()
      };

      await createPost(postToCreate);
      // El hook usePosts ya maneja la actualización del estado y los toasts
    } catch (error) {
      console.error('Error creating post:', error);
      // El error ya es manejado por el hook, no need to re-throw
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setAppState({
        currentView: 'community',
        selectedUserId: null,
        notificationCount: 0,
        isInitialized: true
      });
      toast.success("👋 Sesión cerrada correctamente");
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error("Error al cerrar sesión");
    }
  };

  // Renderizado condicional basado en estado de autenticación y carga
  const renderContent = () => {
    // Loading state durante inicialización
    if (!appState.isInitialized || authLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-25 to-orange-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <p className="text-muted-foreground">Cargando aplicación...</p>
          </div>
        </div>
      );
    }

    // Usuario no autenticado - mostrar comunidad sin funcionalidades premium
    if (!isAuthenticated) {
      return (
        <CommunityFeed
          userData={{
            name: "Invitado",
            avatar: ""
          }}
          petData={{
            name: "Mascota"
          }}
          onUserClick={handleUserClick}
        />
      );
    }

    // Usuario autenticado - renderizar vista según estado
    switch (appState.currentView) {
      case 'pet-profile':
        return (
          <PetProfile 
            petData={transformPetData(pet)} 
            userData={transformUserData(userProfile)} 
            onNavigate={handleNavigate} 
          />
        );

      case 'dashboard':
        return (
          <UserDashboard
            userData={transformUserData(userProfile)}
            petData={transformPetData(pet)}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );

      case 'community':
        return (
          <CommunityFeed
            userData={transformUserData(userProfile)}
            petData={transformPetData(pet)}
            onUserClick={handleUserClick}
            onCreatePost={handleCreatePost}
            onToggleLike={toggleLike}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onDeletePost={deletePost}
            posts={posts}
            loading={postsLoading}
          />
        );

      case 'notifications':
        return (
          <Notifications
            onUserClick={handleUserClick}
            onPostClick={handlePostClick}
          />
        );

      case 'user-profile':
        return appState.selectedUserId ? (
          <UserProfileView
            userId={appState.selectedUserId}
            currentUserId={user?.id || ''}
            onBack={() => handleNavigate('community')}
            onFollow={handleFollow}
          />
        ) : (
          <UserDashboard
            userData={transformUserData(userProfile)}
            petData={transformPetData(pet)}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        );

      case 'qr-options':
        return (
          <QROptions
            petData={transformPetData(pet)}
            onNavigate={handleNavigate}
          />
        );

      case 'edit-user':
        return (
          <EditUserProfile
            userData={transformUserData(userProfile)}
            onSave={handleSaveUser}
            onNavigate={handleNavigate}
          />
        );

      case 'edit-pet':
        return (
          <EditPetProfile
            petData={transformPetData(pet)}
            onSave={handleSavePet}
            onNavigate={handleNavigate}
          />
        );

      default:
        return (
          <CommunityFeed
            userData={transformUserData(userProfile)}
            petData={transformPetData(pet)}
            onUserClick={handleUserClick}
            onCreatePost={handleCreatePost}
            onToggleLike={toggleLike}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onDeletePost={deletePost}
            posts={posts}
            loading={postsLoading}
          />
        );
    }
  };

  // Helper functions para transformar datos entre diferentes formatos
  const transformUserData = (profile: any) => ({
    name: profile?.name || 'Usuario',
    phone: profile?.phone || '',
    email: profile?.email || user?.email || '',
    location: profile?.location || 'Ubicación no especificada',
    avatar: profile?.avatar_url || '/default-avatar.png',
    id: profile?.id || user?.id
  });

  const transformPetData = (petData: any) => ({
    id: petData?.id || '',
    name: petData?.name || 'Mi Mascota',
    species: petData?.species || 'perro',
    breed: petData?.breed || 'Raza no especificada',
    age: petData?.age || '',
    weight: petData?.weight || '',
    color: petData?.color || '',
    personality: petData?.personality || [],
    favoriteFood: petData?.favorite_food || '',
    favoriteToys: petData?.favorite_toys || [],
    vaccinated: petData?.vaccinated || false,
    microchip: petData?.microchip || '',
    image: petData?.image_url || '/default-pet.png',
    likes: petData?.likes || 0
  });

  return (
    <PublicViewRouter>
      <div className="bg-gradient-to-br from-stone-50 via-amber-25 to-orange-50 min-h-screen">
        {/* Header de navegación - solo mostrar si está inicializado y autenticado */}
        {appState.isInitialized && isAuthenticated && (
          <NavigationHeader
            currentView={appState.currentView}
            onNavigate={handleNavigate}
            ownerData={transformUserData(userProfile)}
            notificationCount={unreadCount}
          />
        )}

        {/* Contenido principal */}
        {renderContent()}

        {/* Modal de autenticación - mostrar solo si no está autenticado */}
        {!isAuthenticated && appState.isInitialized && (
          <AuthModal 
            onLogin={() => {
              // El hook useAuth ya maneja el estado de autenticación
              // Forzar recarga del perfil después del login
              if (user?.id) {
                refreshProfile(user.id);
              }
            }}
          />
        )}

        {/* Sistema de notificaciones */}
        <Toaster 
          position="top-center" 
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </div>
    </PublicViewRouter>
  );
}