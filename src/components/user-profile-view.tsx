/**
 * UserProfileView Component
 * 
 * Componente para visualizar el perfil completo de un usuario
 * Muestra información personal, mascotas, estadísticas y publicaciones
 * Permite seguir/dejar de seguir al usuario
 * 
 * @component
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Heart, MessageCircle, MapPin, Phone, Mail, UserPlus, UserCheck, Grid, List, PawPrint, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useUserProfile } from "../hooks/use-user-profile";
import { useFollows } from "../hooks/use-follows";
import { PET_SPECIES_EMOJIS, PetSpecies } from "../lib/types";

interface UserProfileViewProps {
  userId: string;
  currentUserId: string;
  onBack: () => void;
  onFollow: (userId: string) => void;
}

export function UserProfileView({ userId, currentUserId, onBack, onFollow }: UserProfileViewProps) {
  const { profile, pets, posts, postsCount, loading: profileLoading } = useUserProfile(userId);
  const { followers, following, isFollowing, loading: followsLoading, toggleFollow } = useFollows(userId, currentUserId);
  
  const [activeTab, setActiveTab] = useState<'posts' | 'pets'>('posts');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isOwnProfile = userId === currentUserId;
  const loading = profileLoading || followsLoading;

  /**
   * Maneja el seguimiento/dejar de seguir
   */
  const handleFollow = async () => {
    const success = await toggleFollow(userId);
    if (success) {
      onFollow(userId);
    }
  };

  /**
   * Formatea el timestamp relativo
   */
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInDays = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Hoy";
    if (diffInDays === 1) return "Ayer";
    if (diffInDays < 7) return `${diffInDays}d`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}sem`;
    return `${Math.floor(diffInDays / 30)}m`;
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-yellow-50 pt-20 pb-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#6C63FF] mx-auto" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Usuario no encontrado
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-yellow-50 pt-20 pb-8">
        <div className="max-w-md mx-auto px-4">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6 pb-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PawPrint className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg text-gray-700 mb-2">Usuario no encontrado</h3>
              <p className="text-sm text-gray-500 mb-4">
                No se pudo cargar la información del perfil
              </p>
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-yellow-50 pt-20 pb-8">
      <div className="max-w-md mx-auto px-4">
        
        {/* Botón volver */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        {/* Profile Header */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mb-6">
          <CardHeader className="bg-gradient-to-r from-[#6C63FF]/10 to-[#FF6F61]/10">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 ring-4 ring-[#6C63FF]/30">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.name} />
                <AvatarFallback className="bg-[#6C63FF] text-white text-xl">
                  {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-[#6C63FF] mb-2">{profile.name}</h2>
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-[#FF6F61]">{postsCount}</div>
                    <div className="text-gray-500">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#FF6F61]">{followers}</div>
                    <div className="text-gray-500">Seguidores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#FF6F61]">{following}</div>
                    <div className="text-gray-500">Siguiendo</div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4 space-y-4">
            {/* Location */}
            {profile.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-[#FFD166]" />
                <span>{profile.location}</span>
              </div>
            )}

            {/* Contact info for own profile */}
            {isOwnProfile && profile.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-[#FF6F61]" />
                <span>{profile.phone}</span>
              </div>
            )}

            {isOwnProfile && profile.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-[#6C63FF]" />
                <span>{profile.email}</span>
              </div>
            )}

            {/* Action buttons */}
            {!isOwnProfile && (
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleFollow}
                  className={`flex-1 ${
                    isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      : 'bg-gradient-to-r from-[#6C63FF] to-[#6C63FF]/80 hover:from-[#6C63FF]/90 hover:to-[#6C63FF]/70 text-white'
                  }`}
                >
                  {isFollowing ? (
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Siguiendo
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Seguir
                    </div>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Mensaje
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pets Section */}
        {pets.length > 0 && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-6">
            <CardHeader>
              <h3 className="text-[#6C63FF] flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-[#FF6F61]" />
                {isOwnProfile ? 'Mis Mascotas' : 'Sus Mascotas'}
              </h3>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {pets.map((pet, index) => (
                  <motion.div
                    key={pet.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center flex-shrink-0"
                  >
                    <div className="relative mb-2">
                      <Avatar className="w-16 h-16 ring-4 ring-[#FF6F61]/30">
                        <AvatarImage src={pet.image_url || ''} alt={pet.name} />
                        <AvatarFallback className="bg-[#FF6F61] text-white">
                          {pet.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FFD166] rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-xs">
                          {PET_SPECIES_EMOJIS[pet.species as PetSpecies] || '🐾'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-[#FF6F61]">{pet.name}</p>
                    <p className="text-xs text-gray-600">{pet.breed}</p>
                    {pet.age && (
                      <Badge variant="outline" className="text-xs border-[#6C63FF] text-[#6C63FF] mt-1">
                        {pet.age}
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full grid-cols-2 bg-white/70 backdrop-blur-sm">
              <TabsTrigger 
                value="posts" 
                className="data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white"
              >
                Publicaciones ({postsCount})
              </TabsTrigger>
              <TabsTrigger 
                value="pets" 
                className="data-[state=active]:bg-[#FF6F61] data-[state=active]:text-white"
              >
                Mascotas ({pets.length})
              </TabsTrigger>
            </TabsList>

            {activeTab === 'posts' && (
              <div className="flex gap-1 bg-white/70 backdrop-blur-sm rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`w-8 h-8 p-0 ${viewMode === 'grid' ? 'bg-[#6C63FF] text-white' : 'text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`w-8 h-8 p-0 ${viewMode === 'list' ? 'bg-[#6C63FF] text-white' : 'text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="posts" className="space-y-4">
            {posts.length === 0 ? (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6 pb-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Grid className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">No hay publicaciones aún</p>
                  <p className="text-sm text-gray-500">
                    {isOwnProfile ? "¡Comparte tu primera foto!" : "Aún no ha compartido nada"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-3 gap-2">
                    {posts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer"
                      >
                        {post.image_url ? (
                          <img 
                            src={post.image_url} 
                            alt="Post" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#6C63FF]/10 to-[#FF6F61]/10">
                            <p className="text-xs text-gray-500 text-center p-2 line-clamp-3">
                              {post.content}
                            </p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex items-center gap-4 text-white text-sm">
                            <div className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {post.likes || 0}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={profile.avatar_url || ''} alt={profile.name} />
                                <AvatarFallback className="bg-[#6C63FF] text-white">
                                  {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm text-[#6C63FF]">{profile.name}</p>
                                <p className="text-xs text-gray-500">{formatTime(post.created_at)}</p>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-3">{post.content}</p>
                            
                            {post.image_url && (
                              <div className="rounded-lg overflow-hidden mb-3">
                                <img 
                                  src={post.image_url} 
                                  alt="Post" 
                                  className="w-full h-48 object-cover"
                                />
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-gray-500">
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                <span className="text-sm">{post.likes || 0}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="pets">
            <div className="space-y-4">
              {pets.length === 0 ? (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="pt-6 pb-6 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <PawPrint className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-2">No hay mascotas registradas</p>
                    <p className="text-sm text-gray-500">
                      {isOwnProfile ? "Agrega tu primera mascota" : "Aún no ha agregado mascotas"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {pets.map((pet, index) => (
                    <motion.div
                      key={pet.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Avatar className="w-16 h-16 ring-4 ring-[#FF6F61]/30">
                                <AvatarImage src={pet.image_url || ''} alt={pet.name} />
                                <AvatarFallback className="bg-[#FF6F61] text-white">
                                  {pet.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#FFD166] rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-xs">
                                  {PET_SPECIES_EMOJIS[pet.species as PetSpecies] || '🐾'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-[#FF6F61] mb-1">{pet.name}</h3>
                              <p className="text-gray-600 text-sm mb-2">{pet.breed}</p>
                              <div className="flex flex-wrap gap-2">
                                {pet.age && (
                                  <Badge variant="outline" className="border-[#6C63FF] text-[#6C63FF] text-xs">
                                    {pet.age}
                                  </Badge>
                                )}
                                {pet.color && (
                                  <Badge variant="outline" className="border-[#FFD166] text-gray-700 text-xs">
                                    {pet.color}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Pet personality */}
                          {pet.personality && pet.personality.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-2">Personalidad:</p>
                              <div className="flex flex-wrap gap-1">
                                {pet.personality.slice(0, 3).map((trait, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {trait}
                                  </Badge>
                                ))}
                                {pet.personality.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{pet.personality.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
