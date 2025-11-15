import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Heart, MapPin, Phone, Mail, Calendar, Award, ChevronDown, Users, Settings } from "lucide-react";
import { PET_SPECIES_EMOJIS, PetSpecies } from "../lib/types";
import { usePetLikes } from "../hooks/use-pet-likes";

interface PetProfileProps {
  petData: {
    id: string;
    name: string;
    species?: PetSpecies;
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
  };
  userData: {
    name: string;
    phone: string;
    email: string;
    location: string;
    avatar: string;
  };
  onNavigate?: (view: string) => void;
}

export function PetProfile({ petData, userData, onNavigate }: PetProfileProps) {
  // ✅ USAR HOOK DE LIKES REAL vinculado con la base de datos
  const { likesCount, isLiked, processing, toggleLike } = usePetLikes(petData?.id || '');

  // Default values in case data is undefined
  const safePetData = {
    name: 'Mascota',
    breed: 'Raza desconocida',
    age: 'Edad desconocida',
    weight: 'Peso desconocido',
    color: 'Color desconocido',
    personality: ['Amigable'],
    favoriteFood: 'Comida favorita desconocida',
    favoriteToys: ['Juguetes desconocidos'],
    vaccinated: false,
    microchip: 'Sin microchip',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop',
    ...petData
  };

  const safeUserData = {
    name: 'Usuario',
    phone: 'No disponible',
    email: 'No disponible',
    location: 'No disponible',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    ...userData
  };

  // ✅ FUNCIÓN DE LIKE QUE USA EL HOOK REAL
  const handleLike = async () => {
    await toggleLike();
  };

  return (
    <div className="min-h-screen">
      {/* Fixed Navigation Buttons */}
      {onNavigate && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-between">
          <Button
            onClick={() => onNavigate('community')}
            className="bg-white/90 backdrop-blur-sm border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground shadow-lg rounded-full w-12 h-12 p-0"
          >
            <Users className="w-5 h-5" />
          </Button>
          
          <Button
            onClick={() => onNavigate('dashboard')}
            className="bg-white/90 backdrop-blur-sm border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-lg rounded-full w-12 h-12 p-0"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={safeUserData.avatar} alt={safeUserData.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {safeUserData.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      )}

      {/* Hero Section - Imagen grande de la mascota */}
      <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background image with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${safePetData.image})`,
            filter: 'blur(20px)',
            transform: 'scale(1.1)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />
        
        {/* Main pet image */}
        <div className="relative z-10 mb-8">
          <div className="relative">
            <div className="w-72 h-72 rounded-full overflow-hidden border-8 border-white shadow-2xl ring-4 ring-primary/30">
              <img 
                src={safePetData.image} 
                alt={safePetData.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-[#FFD166] rounded-full flex items-center justify-center shadow-xl ring-4 ring-white">
              <span className="text-2xl">{PET_SPECIES_EMOJIS[safePetData.species || 'perro']}</span>
            </div>
          </div>
        </div>

        {/* Pet name and basic info */}
        <div className="relative z-10 text-center text-white mb-8">
          <h1 className="text-4xl mb-2 drop-shadow-lg">
            {safePetData.name} 💖
          </h1>
          <p className="text-xl text-white/90 mb-4 drop-shadow-md">{safePetData.breed}</p>
          
          {/* Personality badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {safePetData.personality.map((trait, index) => (
              <Badge 
                key={trait} 
                className={`text-sm text-white backdrop-blur-sm ${
                  index === 0 ? 'bg-[#FF6F61]/80 border-[#FF6F61]' :
                  index === 1 ? 'bg-[#6C63FF]/80 border-[#6C63FF]' :
                  'bg-[#FFD166]/80 text-gray-800 border-[#FFD166]'
                } border-2`}
              >
                {trait}
              </Badge>
            ))}
          </div>
        </div>

        {/* Like section - ✅ VINCULADO CON BASE DE DATOS */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 text-white">
            <Heart className="w-6 h-6 text-[#FF6F61] drop-shadow-lg" />
            <span className="text-lg drop-shadow-md">{likesCount} corazones</span>
          </div>
          
          <Button
            size="lg"
            onClick={handleLike}
            disabled={processing}
            className={`transition-all duration-300 text-lg px-8 py-4 shadow-2xl ${
              isLiked 
                ? "bg-gradient-to-r from-[#FF6F61] to-[#FF6F61]/80 hover:from-[#FF6F61]/90 hover:to-[#FF6F61]/70 text-white scale-105" 
                : "bg-white/90 backdrop-blur-sm border-2 border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white"
            }`}
          >
            {processing ? (
              <div className="w-5 h-5 mr-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Heart className={`w-5 h-5 mr-3 transition-all ${isLiked ? "fill-current animate-pulse" : ""}`} />
            )}
            {isLiked ? "💕 ¡Te gusta!" : "💖 Dar amor"}
          </Button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/80 animate-bounce">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm drop-shadow-md">Desliza para más información</span>
            <ChevronDown className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Information Sections */}
      <div className="bg-white">
        {/* Basic Information Section */}
        <section className="py-12 px-4">
          <div className="max-w-md mx-auto">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-[#FF6F61]/10 to-[#6C63FF]/10">
                <h3 className="flex items-center gap-2 text-[#6C63FF] text-center justify-center">
                  <Award className="w-5 h-5 text-[#FFD166]" />
                  Información Básica
                </h3>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-4 bg-[#FF6F61]/5 rounded-lg">
                    <span className="text-[#6C63FF] block mb-1">Edad</span>
                    <p className="text-gray-700">{safePetData.age}</p>
                  </div>
                  <div className="text-center p-4 bg-[#6C63FF]/5 rounded-lg">
                    <span className="text-[#6C63FF] block mb-1">Peso</span>
                    <p className="text-gray-700">{safePetData.weight}</p>
                  </div>
                  <div className="text-center p-4 bg-[#FFD166]/10 rounded-lg">
                    <span className="text-[#6C63FF] block mb-1">Color</span>
                    <p className="text-gray-700">{safePetData.color}</p>
                  </div>
                  <div className="text-center p-4 bg-[#FF6F61]/5 rounded-lg">
                    <span className="text-[#6C63FF] block mb-1">Microchip</span>
                    <p className="text-xs text-gray-700 break-all">{safePetData.microchip}</p>
                  </div>
                </div>
                {safePetData.vaccinated && (
                  <div className="text-center mt-6">
                    <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2">
                      ✨ Vacunado al día
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="py-12 px-4 bg-gradient-to-br from-[#FFD166]/5 to-[#FF6F61]/5">
          <div className="max-w-md mx-auto">
            <Card className="shadow-xl border-0">
              <CardHeader>
                <h3 className="text-[#6C63FF] flex items-center gap-2 justify-center">
                  <span className="text-[#FFD166]">🎯</span>
                  Preferencias de {safePetData.name}
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-[#FFD166]/10 p-4 rounded-xl border border-[#FFD166]/20">
                  <div className="text-center">
                    <span className="text-[#6C63FF] flex items-center justify-center gap-2 mb-2 text-lg">
                      🍖 Comida favorita
                    </span>
                    <p className="text-gray-700">{safePetData.favoriteFood}</p>
                  </div>
                </div>
                <div className="bg-[#FF6F61]/10 p-4 rounded-xl border border-[#FF6F61]/20">
                  <div className="text-center">
                    <span className="text-[#6C63FF] flex items-center justify-center gap-2 mb-2 text-lg">
                      🎾 Juguetes favoritos
                    </span>
                    <p className="text-gray-700">{safePetData.favoriteToys.join(", ")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Owner Contact Section */}
        <section className="py-12 px-4">
          <div className="max-w-md mx-auto">
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-[#6C63FF]/5 to-[#FF6F61]/5">
                <h3 className="text-[#6C63FF] flex items-center gap-2 justify-center">
                  <span className="text-[#FFD166]">👤</span>
                  Contacto del Dueño
                </h3>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-20 h-20 ring-4 ring-[#6C63FF]/30">
                    <AvatarImage src={safeUserData.avatar} alt={safeUserData.name} />
                    <AvatarFallback className="bg-[#6C63FF] text-white text-xl">{safeUserData.name?.split(' ').map(n => n[0]).join('') || 'U'}</AvatarFallback>
                  </Avatar>
                  
                  <div className="text-center space-y-3">
                    <p className="text-[#6C63FF] text-lg">{safeUserData.name}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-[#FFD166]" />
                        <span>{safeUserData.location}</span>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 text-[#FF6F61]" />
                        <a href={`tel:${safeUserData.phone}`} className="hover:text-[#FF6F61] transition-colors">
                          {safeUserData.phone}
                        </a>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4 text-[#6C63FF]" />
                        <a href={`mailto:${safeUserData.email}`} className="hover:text-[#6C63FF] transition-colors">
                          {safeUserData.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Emergency Footer */}
        <section className="py-12 px-4 bg-gradient-to-r from-[#FF6F61]/5 to-[#6C63FF]/5">
          <div className="max-w-md mx-auto text-center">
            <Card className="bg-white/80 backdrop-blur-sm border-[#FFD166]/30 border-2">
              <CardContent className="pt-6">
                <p className="text-gray-600 mb-4">
                  🚨 Si has encontrado a {safePetData.name}, por favor contacta con su dueño
                </p>
                <div className="flex justify-center gap-2">
                  <span className="inline-block w-3 h-3 bg-[#FF6F61] rounded-full animate-pulse"></span>
                  <span className="inline-block w-3 h-3 bg-[#6C63FF] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                  <span className="inline-block w-3 h-3 bg-[#FFD166] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}