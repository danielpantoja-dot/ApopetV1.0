import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Camera, Save, User, MapPin, Phone, Mail } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useStorage } from "../hooks/use-storage";
import { useAuth } from "../hooks/use-auth";
import { UserProfile } from "../lib/types";

interface EditUserProfileProps {
  userData: {
    id?: string;
    name: string;
    phone: string;
    email: string;
    location: string;
    avatar: string;
  };
  onSave: (data: Partial<UserProfile>) => Promise<void>;
  onNavigate: (view: string) => void;
}

export function EditUserProfile({ userData, onSave, onNavigate }: EditUserProfileProps) {
  const { user } = useAuth();
  const { upload, uploading } = useStorage();
  
  const [formData, setFormData] = useState({
    name: userData.name || '',
    phone: userData.phone || '',
    email: userData.email || '',
    location: userData.location || '',
    avatar: userData.avatar || ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validaciones de archivo
    if (!file.type.startsWith('image/')) {
      toast.error("❌ Por favor selecciona solo imágenes (JPEG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("❌ La imagen debe ser menor a 5MB");
      return;
    }

    setImageFile(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("❌ El nombre es requerido");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("❌ El correo electrónico es requerido");
      return false;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("❌ Por favor ingresa un correo electrónico válido");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (!user?.id) {
      toast.error("❌ Usuario no autenticado");
      return;
    }

    setIsLoading(true);
    
    try {
      let avatarUrl = formData.avatar;

      // Subir nueva imagen si se seleccionó
      if (imageFile) {
        const uploadedUrl = await upload(
          imageFile, 
          'avatars', 
          `user-avatar-${user.id}-${Date.now()}`
        );
        
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Preparar datos para actualizar
      const updateData: Partial<UserProfile> = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        location: formData.location.trim(),
        avatar_url: avatarUrl
      };

      await onSave(updateData);
      
    } catch (error: any) {
      console.error("Error saving profile:", error);
      throw error; // Re-lanzar para manejo en el componente padre
    } finally {
      setIsLoading(false);
    }
  };

  const isFormDirty = () => {
    const originalData = {
      name: userData.name || '',
      phone: userData.phone || '',
      email: userData.email || '',
      location: userData.location || '',
      avatar: userData.avatar || ''
    };

    return JSON.stringify(formData) !== JSON.stringify(originalData) || imageFile !== null;
  };

  const isLoadingState = isLoading || uploading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-yellow-50 pt-20 pb-8">
      <div className="max-w-md mx-auto px-4">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-[#6C63FF]/10 to-[#FF6F61]/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6C63FF]/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-[#6C63FF]" />
              </div>
              <div>
                <h2 className="text-[#6C63FF] font-semibold">Editar Mi Perfil</h2>
                <p className="text-sm text-gray-600">Actualiza tu información personal</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 ring-4 ring-[#6C63FF]/30">
                  <AvatarImage 
                    src={imagePreview || formData.avatar} 
                    alt={formData.name} 
                  />
                  <AvatarFallback className="bg-[#6C63FF] text-white text-xl font-semibold">
                    {formData.name ? formData.name.split(' ').map(n => n[0]).join('') : 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="avatar-upload"
                  ref={fileInputRef}
                />
                
                <Button
                  size="sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white shadow-lg"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>

                {(imagePreview || formData.avatar) && (
                  <Button
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={uploading}
                    className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0 bg-destructive hover:bg-destructive/90 text-white shadow-lg"
                  >
                    ×
                  </Button>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  {uploading ? 'Subiendo imagen...' : 'Haz clic en la cámara para cambiar tu foto'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPEG, PNG • Máx. 5MB
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <Label htmlFor="name" className="text-[#6C63FF] font-medium">
                  Nombre Completo *
                </Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
                    placeholder="Tu nombre completo"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <Label htmlFor="phone" className="text-[#6C63FF] font-medium">Teléfono</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <Label htmlFor="email" className="text-[#6C63FF] font-medium">
                  Correo Electrónico *
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {/* Location Field */}
              <div>
                <Label htmlFor="location" className="text-[#6C63FF] font-medium">Ubicación</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="pl-10 border-gray-300 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
                    placeholder="Ciudad, Región"
                  />
                </div>
              </div>
            </div>

            {/* Form Status */}
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Estado del formulario:</span>
                <span className={isFormDirty() ? "text-[#FF6F61] font-medium" : "text-green-600 font-medium"}>
                  {isFormDirty() ? "Cambios sin guardar" : "Sin cambios"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onNavigate('dashboard')}
                disabled={isLoadingState}
                className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoadingState || !isFormDirty()}
                className="flex-1 bg-gradient-to-r from-[#6C63FF] to-[#6C63FF]/80 hover:from-[#6C63FF]/90 hover:to-[#6C63FF]/70 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingState ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Guardando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </div>
                )}
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Los campos marcados con * son obligatorios
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}