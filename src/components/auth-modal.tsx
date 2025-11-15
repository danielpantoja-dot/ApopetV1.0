import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { PawPrint, Mail, Lock, User, Phone, MapPin, Eye, EyeOff, Camera, X } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { supabase } from "../utils/supabase/client";
import { useStorage } from "../hooks/use-storage";

interface AuthModalProps {
  onLogin: (userData: any) => void;
  onClose?: () => void;
}

export function AuthModal({ onLogin, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useStorage();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona solo imágenes");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 5MB");
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Por favor, completa todos los campos requeridos");
      return;
    }

    if (!isLogin && (!formData.name || !formData.phone)) {
      toast.error("Por favor, completa todos los campos para registrarte");
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Login with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          toast.error(`Error al iniciar sesión: ${error.message}`);
          setIsLoading(false);
          return;
        }

        if (!data.session?.access_token || !data.user) {
          toast.error("Error: No se pudo obtener el token de acceso");
          setIsLoading(false);
          return;
        }

        // El hook useAuth manejará la autenticación automáticamente
        onLogin(data.user);
        toast.success("¡Bienvenido de vuelta!");

      } else {
        // Registrar usuario con Supabase Auth
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              phone: formData.phone,
            }
          }
        });

        if (signUpError) {
          toast.error(`Error al registrarse: ${signUpError.message}`);
          setIsLoading(false);
          return;
        }

        if (!authData.user) {
          toast.error("Error al crear el usuario");
          setIsLoading(false);
          return;
        }

        // Upload avatar if selected
        let avatarUrl = null;
        if (avatarFile) {
          avatarUrl = await upload(avatarFile, 'avatars', `avatar-${authData.user.id}-${Date.now()}`);
        }

        // Crear perfil en la tabla profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            location: formData.location || "Santiago, Chile",
            avatar_url: avatarUrl
          }]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // No lanzar error aquí, el perfil se puede crear después
        }

        // Sign in automáticamente después del registro
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          toast.error(`Error al iniciar sesión después del registro: ${signInError.message}`);
          setIsLoading(false);
          return;
        }

        onLogin(signInData.user);
        toast.success("¡Cuenta creada exitosamente!");
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error(`Error de conexión: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="text-center pb-4 bg-gradient-to-r from-primary/10 to-accent/10 relative">
          {/* Botón cerrar */}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-2 right-2 w-8 h-8 p-0 text-muted-foreground hover:text-foreground rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <PawPrint className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-foreground text-2xl">
            {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {isLogin 
              ? "Accede a tu perfil de mascota" 
              : "Únete a la comunidad de mascotas"
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isLogin && (
            <>
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar className="w-20 h-20 ring-2 ring-primary/30">
                    <AvatarImage src={avatarPreview || ""} alt="Avatar" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {formData.name ? formData.name[0].toUpperCase() : <User className="w-8 h-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0 bg-accent hover:bg-accent/90 text-white shadow-lg"
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {uploading ? 'Subiendo imagen...' : 'Foto de perfil (opcional)'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Nombre completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Tu nombre completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="pl-10 border-border bg-input-background focus:ring-ring"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="pl-10 border-border bg-input-background focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Tu contraseña"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="pl-10 pr-10 border-border bg-input-background focus:ring-ring"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+34 612 345 678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="pl-10 border-border bg-input-background focus:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-foreground">Ubicación (opcional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Santiago, Chile"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="pl-10 border-border bg-input-background focus:ring-ring"
                  />
                </div>
              </div>
            </>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isLogin ? "Iniciando sesión..." : "Creando cuenta..."}
              </div>
            ) : (
              isLogin ? "Iniciar Sesión" : "Crear Cuenta"
            )}
          </Button>

          <div className="relative">
            <Separator className="my-4" />
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-muted-foreground">
              o
            </span>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full border-border text-foreground hover:bg-muted"
          >
            {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
          </Button>

          {isLogin && (
            <div className="text-center">
              <Button
                variant="ghost"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ¿Olvidaste tu contraseña?
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}