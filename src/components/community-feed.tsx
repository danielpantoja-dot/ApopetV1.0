// community-feed.tsx - VERSION COMPLETA ACTUALIZADA
import { useState, useEffect } from "react";
import { CreatePost } from "./create-post";
import { PostCard } from "./post-card";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { RefreshCw, Users, TrendingUp, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { usePosts } from "../hooks/use-posts";
import { PostWithDetails } from "../lib/types";

interface CommunityFeedProps {
  userData: {
    id?: string;
    name: string;
    avatar: string;
  };
  petData: {
    id?: string;
    name: string;
  };
  onUserClick: (userId: string) => void;
  onCreatePost?: (postData: any) => void;
  onToggleLike?: (postId: string) => void;
  onAddComment?: (postId: string, comment: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;
  onDeletePost?: (postId: string) => void;
  posts?: PostWithDetails[];
  loading?: boolean;
}

type FilterType = 'all' | 'lost' | 'found' | 'normal';

export function CommunityFeed({ 
  userData, 
  petData, 
  onUserClick, 
  onCreatePost,
  onToggleLike,
  onAddComment,
  onDeleteComment,
  onDeletePost,
  posts: externalPosts,
  loading: externalLoading 
}: CommunityFeedProps) {
  // Si no se proveen posts externos, usar el hook interno
  const internalPosts = usePosts(userData.id);
  const { 
    posts: internalPostsData, 
    loading: internalLoading, 
    createPost, 
    toggleLike, 
    addComment, 
    deleteComment,
    deletePost,
    refreshPosts 
  } = internalPosts;

  // Usar posts externos si se proveen, de lo contrario usar los internos
  const posts = externalPosts || internalPostsData;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Estadísticas del feed
  const stats = {
    totalPosts: posts.length,
    lostPets: posts.filter(post => post.type === 'lost').length,
    foundPets: posts.filter(post => post.type === 'found').length,
    normalPosts: posts.filter(post => post.type === 'normal').length,
  };

  // Filtrar posts según el filtro activo
  const filteredPosts = activeFilter === 'all' 
    ? posts 
    : posts.filter(post => post.type === activeFilter);

  // Handlers para las acciones de posts
  const handleCreatePost = async (postData: any) => {
    if (onCreatePost) {
      await onCreatePost(postData);
    } else {
      await createPost(postData);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (onToggleLike) {
      onToggleLike(postId);
    } else {
      await toggleLike(postId);
    }
  };

  const handleAddComment = async (postId: string, comment: string) => {
    if (onAddComment) {
      onAddComment(postId, comment);
    } else {
      await addComment(postId, comment);
    }
  };

  // 🆕 HANDLER PARA BORRAR COMENTARIOS
  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (onDeleteComment) {
      await onDeleteComment(commentId, postId);
    } else {
      await deleteComment(commentId, postId);
    }
  };

  // 🆕 HANDLER PARA BORRAR POSTS
  const handleDeletePost = async (postId: string) => {
    if (onDeletePost) {
      await onDeletePost(postId);
    } else {
      await deletePost(postId);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshPosts();
      // Simular un pequeño delay para mejor UX
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      // Simular carga de más posts (en una implementación real, esto sería paginación)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En una implementación real, aquí cargaríamos más posts desde la API
      // Por ahora, simulamos que no hay más posts después de 20
      if (posts.length >= 20) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const getFilterIcon = (filter: FilterType) => {
    switch (filter) {
      case 'lost': return '🚨';
      case 'found': return '💝';
      case 'normal': return '💬';
      default: return '📝';
    }
  };

  const getFilterColor = (filter: FilterType) => {
    switch (filter) {
      case 'lost': return 'from-red-500/10 to-red-600/20 text-red-600 border-red-200';
      case 'found': return 'from-green-500/10 to-green-600/20 text-green-600 border-green-200';
      case 'normal': return 'from-blue-500/10 to-blue-600/20 text-blue-600 border-blue-200';
      default: return 'from-purple-500/10 to-purple-600/20 text-purple-600 border-purple-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-25 to-orange-50 pt-20 pb-8">
      <div className="max-w-md mx-auto px-4 space-y-6">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-0"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-foreground text-lg font-semibold">Comunidad de Mascotas</h1>
                <p className="text-sm text-muted-foreground">Conectando amantes de mascotas</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="text-accent hover:text-accent/80"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-primary/5 rounded-lg p-2">
              <div className="text-primary font-semibold">{stats.totalPosts}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="bg-red-500/5 rounded-lg p-2">
              <div className="text-red-600 font-semibold">{stats.lostPets}</div>
              <div className="text-xs text-muted-foreground">Perdidas</div>
            </div>
            <div className="bg-green-500/5 rounded-lg p-2">
              <div className="text-green-600 font-semibold">{stats.foundPets}</div>
              <div className="text-xs text-muted-foreground">Encontradas</div>
            </div>
            <div className="bg-blue-500/5 rounded-lg p-2">
              <div className="text-blue-600 font-semibold">{stats.normalPosts}</div>
              <div className="text-xs text-muted-foreground">Normales</div>
            </div>
          </div>
        </motion.div>

        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        >
          {(['all', 'normal', 'lost', 'found'] as FilterType[]).map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={`
                whitespace-nowrap transition-all duration-200
                ${activeFilter === filter 
                  ? getFilterColor(filter).replace('from-', 'bg-gradient-to-r ').replace('/10', '').replace('/20', '') 
                  : 'bg-white/80 border-gray-200 text-gray-600 hover:bg-gray-50'
                }
                ${activeFilter === filter ? 'shadow-md scale-105' : ''}
              `}
            >
              <span className="mr-1">{getFilterIcon(filter)}</span>
              {filter === 'all' ? 'Todos' : 
               filter === 'lost' ? 'Perdidas' :
               filter === 'found' ? 'Encontradas' : 'Normales'}
            </Button>
          ))}
        </motion.div>

        {/* Create Post Section - Solo para usuarios autenticados */}
        {userData.id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CreatePost
              userData={userData}
              petData={petData}
              onCreatePost={handleCreatePost}
            />
          </motion.div>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {loading ? (
            // Loading State
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="h-48 bg-gray-200 rounded-lg mt-3"></div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : filteredPosts.length === 0 ? (
            // Empty State
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-foreground mb-2">
                    {activeFilter === 'all' 
                      ? "¡Bienvenido a la comunidad!" 
                      : `No hay publicaciones ${activeFilter === 'lost' ? 'de mascotas perdidas' : activeFilter === 'found' ? 'de mascotas encontradas' : 'normales'}`
                    }
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {activeFilter === 'all' 
                      ? "Sé el primero en compartir una historia sobre tu mascota"
                      : `Cuando alguien publique ${activeFilter === 'lost' ? 'sobre una mascota perdida' : activeFilter === 'found' ? 'sobre una mascota encontrada' : 'una publicación normal'}, aparecerá aquí`
                    }
                  </p>
                  {userData.id && activeFilter !== 'all' && (
                    <Button
                      onClick={() => setActiveFilter('all')}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Ver todas las publicaciones
                    </Button>
                  )}
                  <div className="flex justify-center gap-2 mt-4">
                    <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                    <span className="inline-block w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                    <span className="inline-block w-2 h-2 bg-secondary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            // Posts List
            <AnimatePresence>
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PostCard
                    post={{
                      id: post.id,
                      author: {
                        id: post.author.id,
                        name: post.author.name,
                        avatar: post.author.avatar_url || '/default-avatar.png',
                        petName: post.pet?.name,
                        petSpecies: post.pet?.species
                      },
                      content: post.content,
                      image: post.image_url || undefined,
                      timestamp: post.created_at,
                      likes: post.likes_count,
                      comments: post.comments,
                      isLiked: post.is_liked,
                      type: post.type,
                      petInfo: post.pet_info as any
                    }}
                    onUserClick={onUserClick}
                    onLike={handleToggleLike}
                    onComment={handleAddComment}
                    onDeleteComment={handleDeleteComment} // 🆕 Nueva prop
                    onDeletePost={handleDeletePost}       // 🆕 Nueva prop
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Load More Button */}
        {filteredPosts.length > 0 && hasMore && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center pt-4"
          >
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Cargando...
                </>
              ) : (
                'Cargar más publicaciones'
              )}
            </Button>
          </motion.div>
        )}

        {/* End of Feed Message */}
        {!hasMore && filteredPosts.length > 0 && (
          <div className="text-center py-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-primary/30">
              <p className="text-muted-foreground text-sm">
                {activeFilter === 'all' 
                  ? "¡Has visto todas las publicaciones recientes! 🎉" 
                  : `¡Has visto todas las publicaciones ${activeFilter === 'lost' ? 'de mascotas perdidas' : activeFilter === 'found' ? 'de mascotas encontradas' : 'normales'}!`
                }
              </p>
              {activeFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveFilter('all')}
                  className="mt-2 text-primary hover:text-primary/80"
                >
                  Ver todas las publicaciones
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Bottom spacer for mobile navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}