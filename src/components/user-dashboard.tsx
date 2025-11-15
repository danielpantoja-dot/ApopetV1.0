import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Heart, Edit, User, Settings, PawPrint, MapPin, Phone, Mail, Users, Bell, LogOut } from "lucide-react";
import { PET_SPECIES_EMOJIS, PetSpecies } from "../lib/types";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase/client";

interface UserDashboardProps {
  userData: {
    name: string;
    phone: string;
    email: string;
    location: string;
    avatar: string;
  };
  petData: {
    id?: string;
    name: string;
    species?: PetSpecies;
    breed: string;
    image: string;
    likes: number;
    age: string;
    weight: string;
  };
  onNavigate: (view: string) => void;
  onLogout?: () => void;
}

export function UserDashboard({ userData, petData, onNavigate, onLogout }: UserDashboardProps) {
  const [actualLikes, setActualLikes] = useState(petData.likes);

  // Obtener los likes reales desde la base de datos
  useEffect(() => {
    const fetchPetLikes = async () => {
      if (!petData.id) return;

      try {
        const { data, error } = await supabase
          .from('pets')
          .select('likes_count')
          .eq('id', petData.id)
          .single();

        if (error) throw error;

        if (data) {
          setActualLikes(data.likes_count || 0);
        }
      } catch (error) {
        console.error('Error fetching pet likes:', error);
        // Mantener el valor inicial en caso de error
        setActualLikes(petData.likes);
      }
    };

    fetchPetLikes();

    // Suscribirse a cambios en tiempo real
    if (petData.id) {
      const channel = supabase
        .channel(`pet-likes:${petData.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pets',
            filter: `id=eq.${petData.id}`
          },
          (payload) => {
            if (payload.new && 'likes_count' in payload.new) {
              setActualLikes(payload.new.likes_count as number);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [petData.id, petData.likes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-25 to-orange-50 pt-20 pb-8">
      <div className="max-w-md mx-auto px-4 space-y-6">
        
        {/* User Profile Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 ring-4 ring-primary/30">
                  <AvatarImage src={userData.avatar} alt={userData.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userData.name ? userData.name.split(' ').map(n => n[0]).join('') : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-foreground mb-1">¡Hola, {userData.name ? userData.name.split(' ')[0] : 'Usuario'}!</h2>
                  <p className="text-muted-foreground text-sm">Dueño de mascota</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('edit-user')}
                className="text-accent hover:text-accent/80"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-accent" />
                <span>{userData.location || 'No especificado'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <span>{userData.phone || 'No especificado'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-secondary" />
                <span>{userData.email || 'No especificado'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pet Profile Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-accent" />
                Mi Mascota
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('edit-pet')}
                className="text-accent hover:text-accent/80"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <Avatar className="w-16 h-16 ring-4 ring-accent/30">
                  <AvatarImage src={petData.image} alt={petData.name} />
                  <AvatarFallback className="bg-accent text-accent-foreground">
                    {petData.name ? petData.name[0] : 'M'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs">{PET_SPECIES_EMOJIS[petData.species || 'perro']}</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-foreground mb-1">{petData.name}</h4>
                <p className="text-muted-foreground text-sm mb-2">{petData.breed}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-primary text-primary">
                    {petData.age}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-accent text-accent">
                    {petData.weight}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 rounded-xl">
              <div className="flex items-center justify-center gap-3">
                <Heart className="w-5 h-5 text-accent" />
                <div className="text-center">
                  <div className="text-2xl text-accent mb-1">{actualLikes}</div>
                  <div className="text-xs text-muted-foreground">Corazones recibidos</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent" />
              Acciones Rápidas
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => onNavigate('pet-profile')}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
            >
              <PawPrint className="w-4 h-4 mr-2" />
{petData.name ? `Ver Perfil Público de ${petData.name}` : 'Agrega tu mascota primero'}
            </Button>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Button
                variant="outline"
                onClick={() => onNavigate('community')}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Users className="w-4 h-4 mr-2" />
                Comunidad
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onNavigate('notifications')}
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notificaciones
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => onNavigate('edit-user')}
                className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
              >
                <User className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onNavigate('edit-pet')}
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Mascota
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Management */}
        {onLogout && (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <Button
                onClick={onLogout}
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </CardContent>
          </Card>
        )}

        {/* App Info */}
        <div className="text-center py-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-primary/30">
            <p className="text-sm text-muted-foreground mb-2">
              💫 Tu perfil QR está activo y listo para ser escaneado
            </p>
            <div className="flex justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              <span className="inline-block w-2 h-2 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
              <span className="inline-block w-2 h-2 bg-secondary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}