/**
 * PublicPetProfile Component
 * * Vista pública del perfil de mascota accesible vía QR
 * No requiere autenticación, permite dar likes a visitantes anónimos
 * * Features:
 * - Carga datos públicos de la mascota
 * - Sistema de likes para visitantes
 * - Información de contacto del dueño
 * - Diseño optimizado para móvil
 * - Compartir perfil en redes sociales
 * * @component
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

interface PetProfileData {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  age: string;
  weight: string;
  color: string;
  personality: string[];
  favoriteFood: string;
  favoriteToys: string[];
  vaccinated: boolean;
  microchip: string;
  image: string;
  likes: number;
  owner_id: string;
}

interface OwnerProfileData {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  avatar: string;
}

export function PublicPetProfile({ petId }: PublicPetProfileProps) {
  const [pet, setPet] = useState<PetProfileData | null>(null);
  const [owner, setOwner] = useState<OwnerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  
  const { 
    currentLikes, 
    userLiked, 
    handleLikeToggle, 
    sessionID 
  } = usePetLikes(petId, pet?.likes || 0);

  const REPO_NAME = 'ApopetV1.0';
  const HOME_URL = window.location.origin + '/' + REPO_NAME + '/';

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // 1. Obtener mascota
        const { data: petData, error: petError } = await supabase
          .from('pets')
          .select('*')
          .eq('id', petId)
          .single();
        
        if (petError || !petData) throw new Error("Mascota no encontrada");

        // 2. Obtener dueño por separado
        const { data: ownerData, error: ownerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', petData.owner_id)
          .single();

        if (ownerError || !ownerData) {
          throw new Error("Dueño no encontrado");
        }

        // Mapear datos
        const petDetails: PetProfileData = {
          id: petData.id,
          name: petData.name,
          species: petData.species as PetSpecies,
          breed: petData.breed,
          age: petData.age,
          weight: petData.weight,
          color: petData.color,
          personality: petData.personality || [],
          favoriteFood: petData.favorite_food,
          favoriteToys: petData.favorite_toys || [],
          vaccinated: petData.vaccinated,
          microchip: petData.microchip,
          image: petData.image_url,
          likes: petData.likes_count || 0,
          owner_id: petData.owner_id
        };

        const ownerDetails: OwnerProfileData = {
          id: ownerData.id,
          name: ownerData.name,
          phone: ownerData.phone,
          email: ownerData.email,
          location: ownerData.location,
          avatar: ownerData.avatar_url
        };

        setPet(petDetails);
        setOwner(ownerDetails);
        
      } catch (err: any) {
        console.error("Error fetching pet profile:", err);
        setError("Error al cargar el perfil de la mascota. Podría no existir o ser privado.");
        toast.error("Error al cargar el perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [petId]);

  const handleLikeClick = () => {
    if (user.isGuest) {
      setShowAuthPrompt(true);
    } else {
      handleLikeToggle();
    }
  };

  const handleOpenAuthModal = () => {
    setShowAuthPrompt(false);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    window.location.href = HOME_URL;
  };

  const shareProfile = async () => {
    if (!pet) return;

    const shareUrl = window.location.href;
    const shareData = {
      title: `Perfil de ${pet.name}`,
      text: `¡Mira el perfil de ${pet.name} en Apopet! 🐾`,
      url: shareUrl
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Perfil compartido exitosamente');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Enlace copiado al portapapeles');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast.error('Error al compartir');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#6C63FF] animate-spin mb-4" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !pet || !owner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-rose-50 p-4 text-center">
        <div className="flex items-center justify-between p-4 bg-transparent fixed top-0 left-0 right-0 z-20">
            <a 
                href={HOME_URL} 
                className="bg-white/70 backdrop-blur-sm rounded-full text-gray-800 hover:bg-white p-2 transition-colors z-30 shadow-md flex items-center justify-center w-8 h-8"
                title="Volver a la Comunidad"
            >
                <Home className="w-5 h-5" />
            </a>
            <div className="w-8 h-8" />
        </div>
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Error al cargar el perfil</h1>
        <p className="text-gray-600 mb-6">{error || "La mascota no existe o el perfil no está disponible."}</p>
        <a 
          href={HOME_URL} 
          className="bg-[#6C63FF] text-white px-6 py-3 rounded-full hover:bg-[#6C63FF]/90 transition-colors"
        >
          Volver a la Aplicación Principal
        </a>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      <div className="relative h-[40vh] overflow-hidden">
        <img 
          src={pet.image || '/placeholder-pet.png'} 
          alt={pet.name} 
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="flex items-center justify-between p-4 bg-transparent fixed top-0 left-0 right-0 z-20">
            <a 
                href={HOME_URL} 
                className="bg-white/50 backdrop-blur-sm rounded-full text-gray-800 hover:bg-white p-2 transition-colors z-30 shadow-md flex items-center justify-center w-8 h-8"
                title="Volver a la Comunidad"
            >
                <Home className="w-5 h-5" />
            </a>
            
            <Button
                onClick={shareProfile}
                variant="ghost"
                size="icon"
                className="bg-white/50 backdrop-blur-sm rounded-full text-gray-800 hover:bg-white p-2 transition-colors z-30 shadow-md flex items-center justify-center w-8 h-8"
                title="Compartir Perfil"
            >
                <Share2 className="w-5 h-5" />
            </Button>
        </div>
      </div>

      <div className="relative -top-10 px-4">
        
        <Card className="bg-white rounded-3xl shadow-2xl p-6 relative">
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 leading-tight flex items-center">
                {pet.name}
                <span className="ml-2 text-2xl">
                    {PET_SPECIES_EMOJIS[pet.species]}
                </span>
              </h1>
              <p className="text-sm text-gray-500">{pet.breed} • {pet.age}</p>
            </div>
            
            <div className="flex flex-col items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handleLikeClick}
                className={`w-12 h-12 rounded-full shadow-lg transition-all ${
                  userLiked ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' : 'bg-white hover:bg-red-50 text-red-500 border-gray-200'
                }`}
              >
                <Heart className={`w-6 h-6 ${userLiked ? 'fill-white' : 'fill-none'}`} />
              </Button>
              <p className="text-sm font-semibold text-gray-600 mt-1">{currentLikes} Likes</p>
            </div>
          </div>

          <Separator className="my-4" />

          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-[#6C63FF]" /> Dueño Responsable
            </h2>
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <Avatar className="w-12 h-12 shadow-md">
                    <AvatarImage src={owner.avatar || '/placeholder-user.png'} alt={owner.name} />
                    <AvatarFallback className="bg-[#6C63FF]/20 text-[#6C63FF] font-semibold">{owner.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-gray-800">{owner.name}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" /> {owner.location || 'Ubicación no especificada'}
                    </p>
                </div>
            </div>
          </section>

          <Separator className="my-4" />

          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center">
                <PawPrint className="w-5 h-5 mr-2 text-[#FF6F61]" /> Acerca de {pet.name}
            </h2>
            <div className="space-y-3">
                <p className="text-gray-700">
                    <span className="font-semibold">Personalidad:</span> {pet.personality.join(', ') || 'No especificada'}
                </p>
                <p className="text-gray-700">
                    <span className="font-semibold">Comida Favorita:</span> {pet.favoriteFood || 'Cualquier cosa comestible'}
                </p>
                <p className="text-gray-700">
                    <span className="font-semibold">Juguetes:</span> {pet.favoriteToys.join(', ') || 'No especificados'}
                </p>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Vacunado:</span>
                    <Badge variant={pet.vaccinated ? "default" : "secondary"} className={`text-xs ${pet.vaccinated ? 'bg-green-500' : 'bg-red-500'}`}>
                        {pet.vaccinated ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Sí</>
                        ) : (
                            <><AlertCircle className="w-3 h-3 mr-1" /> No</>
                        )}
                    </Badge>
                </div>
            </div>
          </section>

          <Separator className="my-4" />

          <section className="mb-4">
            <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-[#FFD166]" /> Contacto
            </h2>
            <div className="space-y-3">
              <a href={`tel:${owner.phone}`} className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                <Phone className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-800">{owner.phone || 'No disponible'}</span>
              </a>
              <a href={`mailto:${owner.email}`} className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
                <Mail className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-800">{owner.email || 'No disponible'}</span>
              </a>
            </div>
          </section>
          
        </Card>

        <Card className="fixed bottom-0 left-0 right-0 p-4 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] bg-white/95 backdrop-blur-md z-10">
          <Button
            onClick={handleLikeClick}
            className={`w-full py-3 text-lg font-bold transition-all ${
                userLiked ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-primary hover:bg-primary/90 text-white'
            }`}
          >
            <Heart className={`w-5 h-5 mr-2 transition-all ${userLiked ? 'fill-white' : 'fill-none'}`} />
            {userLiked ? '¡Me Gusta!' : 'Dar Me Gusta'}
          </Button>
          <p className="text-xs text-center text-gray-500 mt-2">
            Puedes dar Me Gusta sin tener una cuenta.
          </p>
        </Card>

        <AnimatePresence>
          {showAuthPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowAuthPrompt(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="rounded-xl shadow-2xl">
                  <CardHeader className="text-center pb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      ¿Quieres seguir ayudando a {pet.name}?
                    </h2>
                    <p className="text-sm text-gray-500">
                      Crea una cuenta para guardar el perfil en tus favoritos y acceder a la comunidad.
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <Button
                        variant="default"
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