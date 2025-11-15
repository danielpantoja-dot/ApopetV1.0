/**
 * PublicPetProfile Component
 * 
 * Vista pública del perfil de mascota accesible vía QR
 * No requiere autenticación, permite dar likes a visitantes anónimos
 * 
 * Features:
 * - Carga datos públicos de la mascota
 * - Sistema de likes para visitantes
 * - Información de contacto del dueño
 * - Diseño optimizado para móvil
 * - Compartir perfil en redes sociales
 * 
 * @component
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { 
  Heart, 
  MapPin, 
  Phone, 
  Mail, 
  Share2, 
  Download,
  Loader2,
  PawPrint,
  CheckCircle,
  AlertCircle,
  LogIn,
  UserPlus,
  ArrowLeft,
  Home
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../utils/supabase/client";
import { usePetLikes } from "../hooks/use-pet-likes";
import { PET_SPECIES_EMOJIS, PetSpecies } from "../lib/types";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../hooks/use-auth";
import { AuthModal } from "./auth-modal";

interface PublicPetProfileProps {
  petId: string;
}

interface PetData {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  age: string;
  weight: string;
  color: string;
  personality: string[];
  favorite_food: string;
  favorite_toys: string[];
  vaccinated: boolean;
  microchip: string;
  image_url: string | null;
  owner_name: string;
  owner_location: string;
  owner_phone: string;
  owner_email: string;
  owner_avatar: string | null;
}

export function PublicPetProfile({ petId }: PublicPetProfileProps) {
  const [petData, setPetData] = useState<PetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { likesCount, isLiked, processing, toggleLike } = usePetLikes(petId);
  const { user, isAuthenticated } = useAuth();
  
  /**
   * Guardar la ruta actual para volver después del login
   */
  useEffect(() => {
    // Guardar la ruta actual en sessionStorage (más seguro que localStorage)
    const currentPath = window.location.pathname;
    sessionStorage.setItem('auth_redirect_path', currentPath);
    
    return () => {
      // Limpiar solo si el usuario se va a otra página que NO es el modal de auth
      if (!showAuthModal) {
        sessionStorage.removeItem('auth_redirect_path');
      }
    };
  }, [showAuthModal]);

  /**
   * Carga los datos públicos de la mascota
   */
  const fetchPetData = async () => {
    if (!petId) {
      setError('ID de mascota no válido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Cargar datos de la mascota con información del dueño
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .select(`
          *,
          profiles!pets_owner_id_fkey (
            name,
            location,
            phone,
            email,
            avatar_url
          )
        `)
        .eq('id', petId)
        .single();

      if (petError) throw petError;

      if (!pet) {
        setError('Mascota no encontrada');
        return;
      }

      // Transformar datos
      const owner = Array.isArray(pet.profiles) ? pet.profiles[0] : pet.profiles;
      
      setPetData({
        id: pet.id,
        name: pet.name,
        species: pet.species || 'perro',
        breed: pet.breed,
        age: pet.age,
        weight: pet.weight,
        color: pet.color,
        personality: pet.personality || [],
        favorite_food: pet.favorite_food,
        favorite_toys: pet.favorite_toys || [],
        vaccinated: pet.vaccinated,
        microchip: pet.microchip,
        image_url: pet.image_url,
        owner_name: owner?.name || 'Dueño',
        owner_location: owner?.location || '',
        owner_phone: owner?.phone || '',
        owner_email: owner?.email || '',
        owner_avatar: owner?.avatar_url || null
      });

    } catch (err: any) {
      console.error('Error fetching pet data:', err);
      setError('Error al cargar información de la mascota');
      toast.error('No se pudo cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetData();
  }, [petId]);

  /**
   * Compartir perfil en redes sociales
   */
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `¡Mira el perfil de ${petData?.name}! 🐾`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${petData?.name}`,
          text: shareText,
          url: shareUrl
        });
        toast.success('¡Compartido exitosamente!');
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('¡Enlace copiado al portapapeles!');
      } catch (err) {
        toast.error('No se pudo copiar el enlace');
      }
    }
  };

  /**
   * Descargar QR (placeholder - se implementará en QR Options)
   */
  const handleDownloadQR = () => {
    toast.info('Función disponible para dueños de mascota');
  };

  /**
   * Manejar like con prompt de autenticación opcional
   */
  const handleLikeClick = async () => {
    await toggleLike();
    
    // Si es la primera vez que da like y no está autenticado, sugerir registro
    if (!isAuthenticated && !isLiked) {
      setTimeout(() => {
        setShowAuthPrompt(true);
      }, 1500);
    }
  };

  /**
   * Volver a Community Feed - Navegar a la página principal
   */
  const handleGoToCommunity = () => {
    // Solución simple y robusta: Navegar a la raíz del sitio
    window.location.href = window.location.origin + '/';
  };

  /**
   * Abrir modal de autenticación
   */
  const handleOpenAuthModal = () => {
    setShowAuthModal(true);
  };

  /**
   * Cerrar modal de autenticación - Usuario permanece en el perfil QR
   */
  const handleAuthSuccess = (userData: any) => {
    setShowAuthModal(false);
    toast.success('¡Bienvenido! Ya puedes disfrutar de todas las funcionalidades.');
    // El usuario permanece en el perfil QR después de autenticarse
    // No redirigimos automáticamente - puede usar el botón "Volver a Community" si lo desea
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#6C63FF] mx-auto" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error || !petData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg text-gray-700 mb-2">Mascota no encontrada</h3>
            <p className="text-sm text-gray-500 mb-4">
              {error || 'No se pudo cargar la información del perfil'}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="mt-2"
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-yellow-50">
      {/* FIXED HEADER - Botones siempre visibles con z-index alto */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg z-[9999] border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Botón 1: Volver a Community Feed - SIEMPRE VISIBLE */}
            <Button
              onClick={handleGoToCommunity}
              variant="outline"
              size="sm"
              className="flex-1 border-2 border-[#6C63FF] text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white transition-all shadow-sm font-medium"
            >
              <Home className="w-4 h-4 mr-1.5" />
              Community
            </Button>
            
            {/* Botón 2: Condicional según autenticación */}
            {!isAuthenticated ? (
              <Button
                onClick={handleOpenAuthModal}
                size="sm"
                className="flex-1 bg-gradient-to-r from-[#6C63FF] to-[#FF6F61] hover:from-[#6C63FF]/90 hover:to-[#FF6F61]/90 text-white shadow-md font-medium"
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                Ingresar
              </Button>
            ) : (
              <Badge className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2.5 text-xs justify-center border-0 shadow-md font-medium">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Sesión Activa
              </Badge>
            )}
            
            {/* Botón Share - Compacto */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleShare}
              className="text-[#FF6F61] hover:bg-[#FF6F61]/10 border border-[#FF6F61]/20 px-2"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Espaciador extra si se necesita más espacio visual */}
        </div>
      </div>

      {/* Espaciador para compensar el header fixed */}
      <div className="h-24"></div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        
        {/* Pet Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
            {/* Pet Image Header */}
            <div className="relative h-64 bg-gradient-to-br from-[#6C63FF]/20 to-[#FF6F61]/20">
              {petData.image_url ? (
                <img 
                  src={petData.image_url} 
                  alt={petData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PawPrint className="w-24 h-24 text-gray-300" />
                </div>
              )}
              
              {/* Pet emoji badge */}
              <div className="absolute bottom-4 right-4 w-16 h-16 bg-[#FFD166] rounded-full flex items-center justify-center shadow-xl ring-4 ring-white">
                <span className="text-3xl">
                  {PET_SPECIES_EMOJIS[petData.species]}
                </span>
              </div>
            </div>

            <CardContent className="pt-6 pb-6 space-y-6">
              {/* Pet Name and Breed */}
              <div className="text-center">
                <h1 className="text-3xl text-[#6C63FF] mb-2">
                  {petData.name} 💖
                </h1>
                <p className="text-gray-600 text-lg mb-4">{petData.breed}</p>
                
                {/* Personality badges */}
                {petData.personality.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {petData.personality.map((trait, index) => (
                      <Badge 
                        key={index}
                        variant="outline"
                        className={`${
                          index === 0 ? 'border-[#FF6F61] text-[#FF6F61] bg-[#FF6F61]/5' :
                          index === 1 ? 'border-[#6C63FF] text-[#6C63FF] bg-[#6C63FF]/5' :
                          'border-[#FFD166] text-gray-700 bg-[#FFD166]/10'
                        }`}
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Like Section */}
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Heart className="w-6 h-6 text-[#FF6F61]" />
                  <span className="text-xl font-medium">{likesCount} corazones</span>
                </div>
                
                <Button
                  size="lg"
                  onClick={handleLikeClick}
                  disabled={processing}
                  className={`w-full max-w-xs transition-all duration-300 text-lg px-8 py-6 shadow-lg ${
                    isLiked 
                      ? "bg-gradient-to-r from-[#FF6F61] to-[#FF6F61]/80 hover:from-[#FF6F61]/90 hover:to-[#FF6F61]/70 text-white scale-105" 
                      : "bg-white border-2 border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white"
                  }`}
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  ) : (
                    <Heart className={`w-5 h-5 mr-3 transition-all ${isLiked ? "fill-current animate-pulse" : ""}`} />
                  )}
                  {isLiked ? "💕 ¡Me gusta!" : "💖 Dar amor"}
                </Button>
                
                {/* Mensaje contextual según autenticación */}
                {!isAuthenticated ? (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    👋 Estás visitando como invitado
                  </p>
                ) : (
                  <p className="text-xs text-green-600 text-center mt-2 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Conectado como usuario registrado
                  </p>
                )}
              </div>

              <Separator />

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                {petData.age && (
                  <div className="text-center p-4 bg-[#FF6F61]/5 rounded-lg">
                    <span className="text-[#6C63FF] block mb-1 text-sm font-medium">Edad</span>
                    <p className="text-gray-700">{petData.age}</p>
                  </div>
                )}
                {petData.weight && (
                  <div className="text-center p-4 bg-[#6C63FF]/5 rounded-lg">
                    <span className="text-[#6C63FF] block mb-1 text-sm font-medium">Peso</span>
                    <p className="text-gray-700">{petData.weight}</p>
                  </div>
                )}
                {petData.color && (
                  <div className="text-center p-4 bg-[#FFD166]/10 rounded-lg">
                    <span className="text-[#6C63FF] block mb-1 text-sm font-medium">Color</span>
                    <p className="text-gray-700">{petData.color}</p>
                  </div>
                )}
                {petData.microchip && (
                  <div className="text-center p-4 bg-[#FF6F61]/5 rounded-lg">
                    <span className="text-[#6C63FF] block mb-1 text-sm font-medium">Microchip</span>
                    <p className="text-xs text-gray-700 break-all">{petData.microchip}</p>
                  </div>
                )}
              </div>

              {petData.vaccinated && (
                <div className="text-center">
                  <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Vacunado al día
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferences Card */}
        {(petData.favorite_food || petData.favorite_toys.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <h3 className="text-[#6C63FF] flex items-center gap-2 justify-center">
                  <span className="text-[#FFD166]">🎯</span>
                  Preferencias
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {petData.favorite_food && (
                  <div className="bg-[#FFD166]/10 p-4 rounded-xl border border-[#FFD166]/20">
                    <div className="text-center">
                      <span className="text-[#6C63FF] flex items-center justify-center gap-2 mb-2">
                        🍖 Comida favorita
                      </span>
                      <p className="text-gray-700">{petData.favorite_food}</p>
                    </div>
                  </div>
                )}
                {petData.favorite_toys.length > 0 && (
                  <div className="bg-[#FF6F61]/10 p-4 rounded-xl border border-[#FF6F61]/20">
                    <div className="text-center">
                      <span className="text-[#6C63FF] flex items-center justify-center gap-2 mb-2">
                        🎾 Juguetes favoritos
                      </span>
                      <p className="text-gray-700">{petData.favorite_toys.join(", ")}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Owner Contact Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-[#6C63FF]/5 to-[#FF6F61]/5">
              <h3 className="text-[#6C63FF] flex items-center gap-2 justify-center">
                <span className="text-[#FFD166]">👤</span>
                Contacto del Dueño
              </h3>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col items-center">
                <Avatar className="w-20 h-20 ring-4 ring-[#6C63FF]/30 mb-4">
                  <AvatarImage src={petData.owner_avatar || ''} alt={petData.owner_name} />
                  <AvatarFallback className="bg-[#6C63FF] text-white text-xl">
                    {petData.owner_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <p className="text-[#6C63FF] text-lg mb-4">{petData.owner_name}</p>
                
                <div className="space-y-3 w-full">
                  {petData.owner_location && (
                    <div className="flex items-center gap-3 text-gray-600 justify-center">
                      <MapPin className="w-4 h-4 text-[#FFD166]" />
                      <span>{petData.owner_location}</span>
                    </div>
                  )}
                  
                  {petData.owner_phone && (
                    <div className="flex items-center gap-3 justify-center">
                      <Phone className="w-4 h-4 text-[#FF6F61]" />
                      <a 
                        href={`tel:${petData.owner_phone}`} 
                        className="text-[#FF6F61] hover:underline"
                      >
                        {petData.owner_phone}
                      </a>
                    </div>
                  )}
                  
                  {petData.owner_email && (
                    <div className="flex items-center gap-3 justify-center">
                      <Mail className="w-4 h-4 text-[#6C63FF]" />
                      <a 
                        href={`mailto:${petData.owner_email}`} 
                        className="text-[#6C63FF] hover:underline"
                      >
                        {petData.owner_email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Emergency Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-[#FF6F61]/5 to-[#6C63FF]/5 border-[#FFD166]/30 border-2">
            <CardContent className="pt-6 pb-6 text-center">
              <p className="text-gray-600 mb-3">
                🚨 Si has encontrado a {petData.name}, por favor contacta con su dueño
              </p>
              <div className="flex justify-center gap-2 mb-4">
                <span className="inline-block w-3 h-3 bg-[#FF6F61] rounded-full animate-pulse"></span>
                <span className="inline-block w-3 h-3 bg-[#6C63FF] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                <span className="inline-block w-3 h-3 bg-[#FFD166] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
              </div>
              <p className="text-xs text-gray-500">
                Perfil generado con código QR del collar
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Auth Prompt Modal para invitados */}
        <AnimatePresence>
          {showAuthPrompt && !isAuthenticated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAuthPrompt(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-md w-full"
              >
                <Card className="shadow-2xl border-0 bg-white">
                  <CardHeader className="bg-gradient-to-r from-[#6C63FF]/10 to-[#FF6F61]/10 text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#6C63FF] to-[#FF6F61] rounded-full flex items-center justify-center mx-auto mb-4">
                      <PawPrint className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl text-[#6C63FF]">
                      ¡Únete a la Comunidad!
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-6 pb-6 space-y-4">
                    <p className="text-gray-600 text-center">
                      Crea una cuenta para acceder a funcionalidades exclusivas:
                    </p>
                    <div className="space-y-3 bg-gradient-to-br from-[#FFD166]/10 to-[#FF6F61]/5 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">Crea el perfil de tu mascota con código QR</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">Conecta con otros dueños de mascotas</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">Publica fotos y recibe notificaciones</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">Reporta mascotas perdidas/encontradas</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 pt-2">
                      <Button
                        size="lg"
                        onClick={handleOpenAuthModal}
                        className="w-full bg-gradient-to-r from-[#6C63FF] to-[#FF6F61] hover:from-[#6C63FF]/90 hover:to-[#FF6F61]/90 text-white"
                      >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Crear Cuenta Gratis
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleOpenAuthModal}
                        className="w-full border-[#6C63FF] text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white"
                      >
                        <LogIn className="w-5 h-5 mr-2" />
                        Ya tengo cuenta
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAuthPrompt(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Continuar como invitado
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Autenticación Principal */}
        {showAuthModal && (
          <AuthModal 
            onLogin={handleAuthSuccess}
            onClose={() => setShowAuthModal(false)}
          />
        )}

      </div>
    </div>
  );
}