// components/post-card.tsx - VERSION COMPLETA
import { useState } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Input } from "./ui/input";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Send, 
  AlertTriangle, 
  Search, 
  Phone, 
  MapPin, 
  Award, 
  Clock, 
  User,
  Trash2,
  Edit
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../hooks/use-auth";
import { Comment, PetInfo, PET_SPECIES_EMOJIS, PetSpecies } from "../lib/types";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// Interfaces
interface PostAuthor {
  id: string;
  name: string;
  avatar: string;
  petName?: string;
  petSpecies?: PetSpecies;
}

interface Post {
  id: string;
  author: PostAuthor;
  content: string;
  image?: string;
  video?: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  type?: 'normal' | 'lost' | 'found';
  petInfo?: PetInfo;
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
  onDeleteComment?: (commentId: string, postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onUserClick: (userId: string) => void;
  onShare?: (postId: string) => void;
}

// Helper Functions
const formatTime = (timestamp: string): string => {
  const now = new Date();
  const postDate = new Date(timestamp);
  const diffInMs = now.getTime() - postDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMinutes < 1) return "Hace un momento";
  if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
  if (diffInHours < 24) return `Hace ${diffInHours}h`;
  if (diffInDays < 7) return `Hace ${diffInDays}d`;
  
  return postDate.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short' 
  });
};

interface TypeInfo {
  label: string;
  icon: JSX.Element;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeColor: string;
}

const getTypeInfo = (type?: 'normal' | 'lost' | 'found'): TypeInfo | null => {
  if (!type || type === 'normal') return null;
  
  const typeMap: Record<'lost' | 'found', TypeInfo> = {
    lost: {
      label: 'MASCOTA PERDIDA',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      bgColor: 'bg-red-50/90',
      borderColor: 'border-red-300',
      textColor: 'text-red-700',
      badgeColor: 'bg-red-500 text-white border-0'
    },
    found: {
      label: 'MASCOTA ENCONTRADA',
      icon: <Search className="w-5 h-5 text-green-600" />,
      bgColor: 'bg-green-50/90',
      borderColor: 'border-green-300',
      textColor: 'text-green-700',
      badgeColor: 'bg-green-500 text-white border-0'
    }
  };
  
  return typeMap[type];
};

export function PostCard({ post, onLike, onComment, onDeleteComment, onDeletePost, onUserClick, onShare }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const { user } = useAuth();

  const isPostAuthor = user?.id === post.author.id;
  const typeInfo = getTypeInfo(post.type);

  const handleLike = async () => {
    try {
      await onLike(post.id);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await onComment(post.id, newComment.trim());
      setNewComment("");
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (onDeleteComment) {
      await onDeleteComment(commentId, post.id);
    }
  };

  const handleDeletePost = async () => {
    if (onDeletePost && window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      await onDeletePost(post.id);
    }
    setShowOptions(false);
  };

  const handleShare = () => {
    if (onShare) {
      onShare(post.id);
    } else {
      // Fallback: copiar enlace al portapapeles
      if (navigator.share) {
        navigator.share({
          title: `Publicación de ${post.author.name}`,
          text: post.content,
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
      }
    }
  };

  return (
    <Card className={`shadow-lg border-0 backdrop-blur-sm mb-4 overflow-hidden ${
      typeInfo ? `${typeInfo.bgColor} border ${typeInfo.borderColor}` : 'bg-white/90'
    }`}>
      
      {/* Urgent Header for Lost/Found Posts */}
      {typeInfo && (
        <div className={`p-3 ${typeInfo.bgColor} border-b ${typeInfo.borderColor}`}>
          <div className="flex items-center justify-center gap-2">
            {typeInfo.icon}
            <span className={`font-semibold text-sm ${typeInfo.textColor}`}>
              🚨 {typeInfo.label} - AYUDA NECESARIA 🚨
            </span>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Author Info */}
          <div 
            className="flex items-start gap-3 cursor-pointer group"
            onClick={() => onUserClick(post.author.id)}
          >
            <Avatar className="w-12 h-12 ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all">
              <AvatarImage src={post.author.avatar} alt={post.author.name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {post.author.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-foreground font-medium group-hover:text-primary transition-colors">
                  {post.author.name}
                </p>
                {typeInfo && (
                  <Badge className={typeInfo.badgeColor}>
                    {typeInfo.icon}
                    <span className="ml-1">
                      {post.type === 'lost' ? 'Extraviada' : 'Encontrada'}
                    </span>
                  </Badge>
                )}
                {post.author.petName && !typeInfo && (
                  <Badge variant="outline" className="text-xs border-accent text-accent bg-accent/10">
                    {PET_SPECIES_EMOJIS[post.author.petSpecies || 'perro']} {post.author.petName}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatTime(post.timestamp)}</span>
              </div>
            </div>
          </div>

          {/* Options Menu */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground -mt-1 -mr-2"
              onClick={() => setShowOptions(!showOptions)}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                >
                  <div className="p-1">
                    {isPostAuthor && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={handleDeletePost}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar publicación
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowOptions(false)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar publicación
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-700 hover:bg-gray-50"
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Post Content */}
        <div className="text-foreground whitespace-pre-wrap">
          {post.content}
        </div>

        {/* Pet Info Card for Lost/Found Posts */}
        {post.petInfo && typeInfo && (
          <Card className={`${typeInfo.bgColor} border ${typeInfo.borderColor}`}>
            <CardContent className="p-4 space-y-3">
              {/* Emoji de especie si existe */}
              {post.petInfo.species && (
                <div className="flex items-center justify-center mb-3">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                    <span className="text-4xl">
                      {(() => {
                        return PET_SPECIES_EMOJIS[post.petInfo.species || 'perro'] || '🐾';
                      })()}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Nombre</p>
                  <p className={`font-medium ${typeInfo.textColor}`}>{post.petInfo.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Raza</p>
                  <p className={`font-medium ${typeInfo.textColor}`}>{post.petInfo.breed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Color</p>
                  <p className={`font-medium ${typeInfo.textColor}`}>{post.petInfo.color}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Tamaño</p>
                  <p className={`font-medium ${typeInfo.textColor}`}>{post.petInfo.size}</p>
                </div>
              </div>
              
              {post.petInfo.lastSeenLocation && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${typeInfo.textColor}`} />
                  <div>
                    <p className="text-muted-foreground text-xs">Última ubicación vista</p>
                    <p className={`font-medium ${typeInfo.textColor}`}>{post.petInfo.lastSeenLocation}</p>
                  </div>
                </div>
              )}
              
              {post.petInfo.contactPhone && (
                <div className="flex items-start gap-2 text-sm">
                  <Phone className={`w-4 h-4 mt-0.5 flex-shrink-0 ${typeInfo.textColor}`} />
                  <div>
                    <p className="text-muted-foreground text-xs">Teléfono de contacto</p>
                    <p className={`font-medium ${typeInfo.textColor}`}>{post.petInfo.contactPhone}</p>
                  </div>
                </div>
              )}
              
              {post.petInfo.reward && (
                <div className="flex items-start gap-2 text-sm">
                  <Award className={`w-4 h-4 mt-0.5 flex-shrink-0 ${typeInfo.textColor}`} />
                  <div>
                    <p className="text-muted-foreground text-xs">Recompensa</p>
                    <p className={`font-medium ${typeInfo.textColor}`}>{post.petInfo.reward}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Post Image */}
        {post.image && (
          <div className="relative rounded-lg overflow-hidden bg-muted">
            <ImageWithFallback
              src={post.image}
              alt="Post image"
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Post Video */}
        {post.video && (
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              src={post.video}
              controls
              className="w-full h-auto"
            >
              Tu navegador no soporta el elemento de video.
            </video>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`gap-2 ${post.isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}`}
            >
              <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
              <span>{post.likes}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-2 text-muted-foreground hover:text-blue-500"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments.length}</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-muted-foreground hover:text-green-500"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-3 border-t border-border"
            >
              {/* Add Comment Form */}
              {user && (
                <div className="flex gap-2">
                  <Avatar className="w-8 h-8 ring-1 ring-border flex-shrink-0">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt="Tu avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder="Escribe un comentario..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      className="border-border focus:border-ring focus:ring-ring"
                      disabled={isSubmittingComment}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground whitespace-nowrap"
                    >
                      {isSubmittingComment ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              {post.comments.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {post.comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-2 group"
                    >
                      <Avatar className="w-8 h-8 ring-1 ring-border flex-shrink-0">
                        <AvatarImage 
                          src={comment.author?.avatar_url || ''} 
                          alt={comment.author?.name || 'Usuario'} 
                        />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                          {comment.author?.name ? comment.author.name.split(' ').map(n => n[0]).join('') : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 relative">
                        <div className="bg-muted rounded-lg p-3 group-hover:bg-muted/80 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-foreground">
                              {comment.author?.name || 'Usuario'}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{comment.content}</p>
                        </div>
                        
                        {/* Delete Comment Button (only for author) */}
                        {user?.id === comment.author_id && onDeleteComment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                        
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <button className="hover:text-red-500 transition-colors">
                            Me gusta
                          </button>
                          <button className="hover:text-blue-500 transition-colors">
                            Responder
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No hay comentarios aún</p>
                  <p className="text-xs">Sé el primero en comentar</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}