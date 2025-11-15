import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Camera, Video, MapPin, X, AlertTriangle, Search, Heart, ChevronLeft, Image as ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner@2.0.3";
import { useStorage } from "../hooks/use-storage";
import { useAuth } from "../hooks/use-auth";
import { PetInfo, PostType, PetSpecies } from "../lib/types";
import { PetEmojiSelector } from "./pet-emoji-selector";

interface CreatePostProps {
  userData: {
    id?: string;
    name: string;
    avatar: string;
  };
  petData: {
    id?: string;
    name: string;
  };
  onCreatePost: (post: {
    content: string;
    image?: string;
    video?: string;
    location?: string;
    type: 'normal' | 'lost' | 'found';
    petInfo?: PetInfo;
  }) => Promise<void>;
}

type PostTypeStep = 'select' | 'normal' | 'lost' | 'found';

export function CreatePost({ userData, petData, onCreatePost }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [postTypeStep, setPostTypeStep] = useState<PostTypeStep>('select');
  const [currentStep, setCurrentStep] = useState<'type' | 'content' | 'petInfo'>('type');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useStorage();
  const { user } = useAuth();
  
  // Pet info for lost/found posts (con especie)
  const [petInfo, setPetInfo] = useState<PetInfo & { species?: PetSpecies }>({
    name: '',
    species: 'perro',
    breed: '',
    color: '',
    size: '',
    lastSeenLocation: '',
    contactPhone: '',
    reward: ''
  });

  // Reset form completely
  const resetForm = () => {
    setContent("");
    setSelectedImage(null);
    setImageFile(null);
    setIsExpanded(false);
    setPostTypeStep('select');
    setCurrentStep('type');
    setPetInfo({
      name: '',
      species: 'perro',
      breed: '',
      color: '',
      size: '',
      lastSeenLocation: '',
      contactPhone: '',
      reward: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle post type selection
  const handlePostTypeSelect = (type: PostTypeStep) => {
    setPostTypeStep(type);
    if (type === 'select') {
      setCurrentStep('type');
    } else if (type === 'normal') {
      setCurrentStep('content');
    } else {
      setCurrentStep('petInfo');
    }
  };

  // Handle image selection and validation
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("❌ Por favor selecciona solo imágenes (JPEG, PNG, etc.)");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("❌ La imagen debe ser menor a 5MB");
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle video selection (placeholder for future implementation)
  const handleVideoSelect = () => {
    toast.info("🎥 La función de video estará disponible próximamente");
  };

  // Handle location selection (placeholder for future implementation)
  const handleLocationSelect = () => {
    toast.info("📍 La función de ubicación estará disponible próximamente");
  };

  // Validate form based on post type
  const validateForm = (): boolean => {
    if (!content.trim()) {
      toast.error("❌ Escribe algo antes de publicar");
      return false;
    }

    // Additional validation for lost/found posts
    if ((postTypeStep === 'lost' || postTypeStep === 'found')) {
      if (!petInfo.name?.trim()) {
        toast.error("❌ El nombre de la mascota es requerido");
        return false;
      }
      if (!petInfo.breed?.trim()) {
        toast.error("❌ La raza de la mascota es requerida");
        return false;
      }
      if (!petInfo.lastSeenLocation?.trim()) {
        toast.error("❌ La ubicación es requerida");
        return false;
      }
    }

    return true;
  };

  // Main submit handler
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      let imageUrl: string | undefined;

      // Upload image if selected
      if (imageFile && user?.id) {
        const uploadedUrl = await upload(
          imageFile, 
          'post-images', 
          `post-${user.id}-${Date.now()}`
        );
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Prepare post data
      const postData = {
        content: content.trim(),
        image: imageUrl,
        type: postTypeStep === 'select' ? 'normal' : postTypeStep,
        petInfo: (postTypeStep === 'lost' || postTypeStep === 'found') ? petInfo : undefined,
      };

      // Call parent handler
      await onCreatePost(postData);

      // Reset form on success
      resetForm();
      
      // Show success message based on post type
      const successMessage = 
        postTypeStep === 'lost' ? '🚨 ¡Reporte de mascota extraviada publicado!' 
        : postTypeStep === 'found' ? '💝 ¡Reporte de mascota encontrada publicado!' 
        : '🎉 ¡Publicación creada exitosamente!';
      
      toast.success(successMessage);

    } catch (error: any) {
      console.error("Error creating post:", error);
      // Error is handled by parent component, no need to show toast here
    } finally {
      setIsLoading(false);
    }
  };

  // Update pet info field
  const updatePetInfo = (field: keyof (PetInfo & { species?: PetSpecies }), value: string | PetSpecies) => {
    setPetInfo(prev => ({ ...prev, [field]: value }));
  };

  // Post type selection view
  if (currentStep === 'type') {
    return (
      <Card className="shadow-lg border-0 bg-card backdrop-blur-sm mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h3 className="text-foreground font-medium">¿Qué quieres compartir?</h3>
              <p className="text-sm text-muted-foreground">Selecciona el tipo de publicación</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Normal Post */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePostTypeSelect('normal')}
              className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/50 transition-colors group bg-white/80"
            >
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2.5 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground mb-1">Publicación Normal</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Comparte momentos especiales con {petData.name || 'tu mascota'}
                  </p>
                </div>
              </div>
            </motion.button>

            {/* Lost Pet */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePostTypeSelect('lost')}
              className="w-full p-4 text-left rounded-lg border border-destructive/20 hover:bg-destructive/5 transition-colors group bg-white/80"
            >
              <div className="flex items-start gap-4">
                <div className="bg-destructive/10 p-2.5 rounded-full group-hover:bg-destructive/20 transition-colors">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground mb-1">Mascota Extraviada</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Reporta una mascota perdida para recibir ayuda de la comunidad
                  </p>
                </div>
              </div>
            </motion.button>

            {/* Found Pet */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePostTypeSelect('found')}
              className="w-full p-4 text-left rounded-lg border border-accent/20 hover:bg-accent/5 transition-colors group bg-white/80"
            >
              <div className="flex items-start gap-4">
                <div className="bg-accent/10 p-2.5 rounded-full group-hover:bg-accent/20 transition-colors">
                  <Search className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground mb-1">Mascota Encontrada</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Ayuda a reunir una mascota encontrada con su familia
                  </p>
                </div>
              </div>
            </motion.button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pet information form for lost/found posts
  if (currentStep === 'petInfo') {
    return (
      <Card className="shadow-lg border-0 bg-card backdrop-blur-sm mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep('type')}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h3 className="text-foreground font-medium">
                {postTypeStep === 'lost' ? 'Información de la Mascota Extraviada' : 'Información de la Mascota Encontrada'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {postTypeStep === 'lost' 
                  ? 'Completa los datos para que la comunidad pueda ayudarte' 
                  : 'Ayuda a identificar a la mascota para encontrar a sus dueños'
                }
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de Especies - NUEVO */}
          <div>
            <PetEmojiSelector
              value={petInfo.species || 'perro'}
              onChange={(species) => updatePetInfo('species', species)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pet-name" className="text-sm font-medium">Nombre *</Label>
              <Input
                id="pet-name"
                placeholder="Nombre de la mascota"
                value={petInfo.name}
                onChange={(e) => updatePetInfo('name', e.target.value)}
                className="mt-1 border-border focus:border-ring"
              />
            </div>
            <div>
              <Label htmlFor="pet-breed" className="text-sm font-medium">Raza *</Label>
              <Input
                id="pet-breed"
                placeholder="Ej: Golden Retriever, Mestizo"
                value={petInfo.breed}
                onChange={(e) => updatePetInfo('breed', e.target.value)}
                className="mt-1 border-border focus:border-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pet-color" className="text-sm">Color</Label>
              <Input
                id="pet-color"
                placeholder="Color principal"
                value={petInfo.color}
                onChange={(e) => updatePetInfo('color', e.target.value)}
                className="mt-1 border-border focus:border-ring"
              />
            </div>
            <div>
              <Label htmlFor="pet-size" className="text-sm">Tamaño</Label>
              <Input
                id="pet-size"
                placeholder="Pequeño/Mediano/Grande"
                value={petInfo.size}
                onChange={(e) => updatePetInfo('size', e.target.value)}
                className="mt-1 border-border focus:border-ring"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="last-location" className="text-sm font-medium">
              {postTypeStep === 'lost' ? 'Última ubicación vista *' : 'Ubicación donde se encontró *'}
            </Label>
            <Input
              id="last-location"
              placeholder="Dirección, parque, punto de referencia..."
              value={petInfo.lastSeenLocation}
              onChange={(e) => updatePetInfo('lastSeenLocation', e.target.value)}
              className="mt-1 border-border focus:border-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="contact-phone" className="text-sm">Teléfono de contacto</Label>
              <Input
                id="contact-phone"
                placeholder="+56 9 XXXX XXXX"
                value={petInfo.contactPhone}
                onChange={(e) => updatePetInfo('contactPhone', e.target.value)}
                className="mt-1 border-border focus:border-ring"
              />
            </div>
            {postTypeStep === 'lost' && (
              <div>
                <Label htmlFor="reward" className="text-sm">Recompensa (opcional)</Label>
                <Input
                  id="reward"
                  placeholder="Ej: $50.000"
                  value={petInfo.reward}
                  onChange={(e) => updatePetInfo('reward', e.target.value)}
                  className="mt-1 border-border focus:border-ring"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('type')}
              className="flex-1"
            >
              Atrás
            </Button>
            <Button
              onClick={() => setCurrentStep('content')}
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={!petInfo.name || !petInfo.breed || !petInfo.lastSeenLocation}
            >
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main content creation view
  const getPostTypeInfo = () => {
    switch (postTypeStep) {
      case 'lost':
        return {
          title: 'Reportar Mascota Extraviada',
          subtitle: 'Comparte información detallada para que la comunidad pueda ayudarte',
          bgColor: 'bg-destructive/5',
          borderColor: 'border-destructive/20',
          textColor: 'text-destructive',
          icon: <AlertTriangle className="w-5 h-5" />,
          badgeColor: 'bg-destructive/10 text-destructive border-destructive/20'
        };
      case 'found':
        return {
          title: 'Reportar Mascota Encontrada', 
          subtitle: 'Ayuda a reunir esta mascota con su familia',
          bgColor: 'bg-accent/5',
          borderColor: 'border-accent/20', 
          textColor: 'text-accent',
          icon: <Search className="w-5 h-5" />,
          badgeColor: 'bg-accent/10 text-accent border-accent/20'
        };
      default:
        return {
          title: 'Crear Publicación',
          subtitle: `Comparte un momento con ${petData.name || 'tu mascota'} 🐕`,
          bgColor: 'bg-primary/5',
          borderColor: 'border-primary/20',
          textColor: 'text-primary',
          icon: <Heart className="w-5 h-5" />,
          badgeColor: 'bg-primary/10 text-primary border-primary/20'
        };
    }
  };

  const typeInfo = getPostTypeInfo();

  return (
    <Card className="shadow-lg border-0 bg-card backdrop-blur-sm mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (postTypeStep === 'normal') {
                setCurrentStep('type');
              } else if (currentStep === 'content') {
                setCurrentStep('petInfo');
              }
            }}
            className="text-secondary hover:text-primary"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Avatar className="w-12 h-12 ring-2 ring-primary/30">
            <AvatarImage src={userData.avatar} alt={userData.name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userData.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-foreground">{userData.name}</p>
              <Badge className={typeInfo.badgeColor}>
                {typeInfo.icon}
                {postTypeStep === 'lost' ? 'Extraviada' : 
                 postTypeStep === 'found' ? 'Encontrada' : 'Normal'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{typeInfo.subtitle}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Content Textarea */}
          <Textarea
            placeholder={
              postTypeStep === 'lost' 
                ? `Describe las circunstancias de la pérdida de ${petInfo.name}, comportamiento, señas particulares...`
                : postTypeStep === 'found'
                ? `Describe dónde y cómo encontraste a ${petInfo.name}, su estado actual, comportamiento...`
                : `¿Qué está haciendo ${petData.name || 'tu mascota'} hoy? Comparte un momento especial...`
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="border-border focus:border-ring resize-none min-h-[100px] text-sm"
            rows={4}
          />

          {/* Image Preview */}
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-lg overflow-hidden border border-border"
            >
              <img 
                src={selectedImage} 
                alt="Preview" 
                className="w-full h-48 object-cover"
              />
              <Button
                size="sm"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* Media Actions */}
          <div className="space-y-3">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Media buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 border border-[#FF6F61]/20 hover:bg-[#FF6F61]/5 text-[#FF6F61]"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#FF6F61]/30 border-t-[#FF6F61] rounded-full animate-spin mr-2" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Foto
                  </>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVideoSelect}
                className="flex-1 border border-[#6C63FF]/20 hover:bg-[#6C63FF]/5 text-[#6C63FF]"
              >
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLocationSelect}
                className="flex-1 border border-[#FFD166]/20 hover:bg-[#FFD166]/5 text-[#FFD166]"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Ubicación
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={isLoading}
                className="flex-1 text-muted-foreground hover:bg-muted"
              >
                Cancelar
              </Button>
              
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !content.trim()}
                className={`flex-1 text-white ${
                  postTypeStep === 'lost' 
                    ? 'bg-destructive hover:bg-destructive/90' 
                    : postTypeStep === 'found'
                    ? 'bg-accent hover:bg-accent/90'
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Publicando...
                  </div>
                ) : postTypeStep === 'lost' ? (
                  "🚨 Publicar Alerta"
                ) : postTypeStep === 'found' ? (
                  "💝 Publicar Hallazgo"  
                ) : (
                  "Publicar"
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}