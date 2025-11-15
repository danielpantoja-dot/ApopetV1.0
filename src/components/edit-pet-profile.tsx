import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Camera, Save, PawPrint, X, Upload, Heart } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useStorage } from "../hooks/use-storage";
import { useAuth } from "../hooks/use-auth";
import { Pet, PetSpecies, PET_SPECIES_EMOJIS } from "../lib/types";
import { PetEmojiSelector } from "./pet-emoji-selector";

interface EditPetProfileProps {
  petData: {
    id?: string;
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
  onSave: (data: Partial<Pet>) => Promise<void>;
  onNavigate: (view: string) => void;
}

export function EditPetProfile({ petData, onSave, onNavigate }: EditPetProfileProps) {
  const { user } = useAuth();
  const { upload, uploading } = useStorage();

  const [formData, setFormData] = useState({
    name: petData.name || '',
    species: petData.species || ('perro' as PetSpecies),
    breed: petData.breed || '',
    age: petData.age || '',
    weight: petData.weight || '',
    color: petData.color || '',
    personality: petData.personality || [],
    favorite_food: petData.favoriteFood || '',
    favorite_toys: petData.favoriteToys || [],
    vaccinated: petData.vaccinated || false,
    microchip: petData.microchip || '',
    image_url: petData.image || ''
  });

  const [newPersonality, setNewPersonality] = useState("");
  const [newToy, setNewToy] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPersonality = () => {
    if (newPersonality.trim() && formData.personality.length < 10) {
      setFormData(prev => ({
        ...prev,
        personality: [...prev.personality, newPersonality.trim()]
      }));
      setNewPersonality("");
    } else if (formData.personality.length >= 10) {
      toast.error("Máximo 10 rasgos de personalidad");
    }
  };

  const removePersonality = (index: number) => {
    setFormData(prev => ({
      ...prev,
      personality: prev.personality.filter((_, i) => i !== index)
    }));
  };

  const addToy = () => {
    if (newToy.trim() && formData.favorite_toys.length < 10) {
      setFormData(prev => ({
        ...prev,
        favorite_toys: [...prev.favorite_toys, newToy.trim()]
      }));
      setNewToy("");
    } else if (formData.favorite_toys.length >= 10) {
      toast.error("Máximo 10 juguetes favoritos");
    }
  };

  const removeToy = (index: number) => {
    setFormData(prev => ({
      ...prev,
      favorite_toys: prev.favorite_toys.filter((_, i) => i !== index)
    }));
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("❌ Por favor selecciona solo imágenes");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("❌ La imagen debe ser menor a 5MB");
      return;
    }

    setImageFile(file);
    
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
      toast.error("❌ El nombre de la mascota es requerido");
      return false;
    }

    if (!formData.breed.trim()) {
      toast.error("❌ La raza de la mascota es requerida");
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
      let imageUrl = formData.image_url;

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await upload(
          imageFile, 
          'pet-images', 
          `pet-${user.id}-${Date.now()}`
        );
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const updateData: Partial<Pet> = {
        name: formData.name.trim(),
        species: formData.species,
        breed: formData.breed.trim(),
        age: formData.age.trim(),
        weight: formData.weight.trim(),
        color: formData.color.trim(),
        personality: formData.personality,
        favorite_food: formData.favorite_food.trim(),
        favorite_toys: formData.favorite_toys,
        vaccinated: formData.vaccinated,
        microchip: formData.microchip.trim(),
        image_url: imageUrl
      };

      await onSave(updateData);
      
    } catch (error: any) {
      console.error("Error saving pet profile:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isFormDirty = () => {
    const originalData = {
      name: petData.name || '',
      species: petData.species || ('perro' as PetSpecies),
      breed: petData.breed || '',
      age: petData.age || '',
      weight: petData.weight || '',
      color: petData.color || '',
      personality: petData.personality || [],
      favorite_food: petData.favoriteFood || '',
      favorite_toys: petData.favoriteToys || [],
      vaccinated: petData.vaccinated || false,
      microchip: petData.microchip || '',
      image_url: petData.image || ''
    };

    return JSON.stringify(formData) !== JSON.stringify(originalData) || imageFile !== null;
  };

  const isLoadingState = isLoading || uploading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-yellow-50 pt-20 pb-8">
      <div className="max-w-md mx-auto px-4">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-[#FF6F61]/10 to-[#FFD166]/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF6F61]/10 rounded-full flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-[#FF6F61]" />
              </div>
              <div>
                <h2 className="text-[#FF6F61] font-semibold">
                  {petData.id ? `Editar ${petData.name}` : 'Agregar Mascota'}
                </h2>
                <p className="text-sm text-gray-600">
                  {petData.id ? 'Actualiza la información de tu mascota' : 'Completa el perfil de tu mascota'}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 ring-4 ring-[#FF6F61]/30">
                  <AvatarImage src={imagePreview || formData.image_url} alt={formData.name} />
                  <AvatarFallback className="bg-[#FF6F61] text-white text-xl font-semibold">
                    {formData.name ? formData.name[0] : 'P'}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-[#FFD166] hover:bg-[#FFD166]/90 text-gray-700 shadow-lg"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-gray-700/30 border-t-gray-700 rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
                {(imagePreview || formData.image_url) && (
                  <Button
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={uploading}
                    className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0 bg-destructive hover:bg-destructive/90 text-white shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
                <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-[#6C63FF] rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-xs text-white">{PET_SPECIES_EMOJIS[formData.species]}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  {uploading ? 'Subiendo imagen...' : 'Haz clic en la cámara para cambiar la foto'}
                </p>
                {petData.likes > 0 && (
                  <div className="flex items-center gap-2 mt-2 justify-center">
                    <Heart className="w-4 h-4 text-[#FF6F61] fill-current" />
                    <span className="text-sm text-[#FF6F61]">{petData.likes} corazones</span>
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              {/* Pet Species Selector */}
              <PetEmojiSelector
                value={formData.species}
                onChange={(species) => handleInputChange('species', species)}
                disabled={isLoadingState}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name" className="text-[#6C63FF] font-medium">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1 border-gray-300 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
                    placeholder="Nombre de tu mascota"
                  />
                </div>
                <div>
                  <Label htmlFor="breed" className="text-[#6C63FF] font-medium">Raza *</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => handleInputChange('breed', e.target.value)}
                    className="mt-1 border-gray-300 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
                    placeholder="Raza o mezcla"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="age" className="text-[#6C63FF]">Edad</Label>
                  <Input
                    id="age"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="mt-1 border-gray-300 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
                    placeholder="Ej: 2 años"
                  />
                </div>
                <div>
                  <Label htmlFor="weight" className="text-[#6C63FF]">Peso</Label>
                  <Input
                    id="weight"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="mt-1 border-gray-300 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
                    placeholder="Ej: 15 kg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="color" className="text-[#6C63FF]">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="mt-1 border-gray-300 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
                    placeholder="Color principal"
                  />
                </div>
                <div>
                  <Label htmlFor="microchip" className="text-[#6C63FF]">Microchip</Label>
                  <Input
                    id="microchip"
                    value={formData.microchip}
                    onChange={(e) => handleInputChange('microchip', e.target.value)}
                    className="mt-1 border-gray-300 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
                    placeholder="Número de microchip"
                  />
                </div>
              </div>

              {/* Vaccination Status */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <Label className="text-[#6C63FF] font-medium">Estado de Vacunación</Label>
                  <p className="text-xs text-gray-600">¿Está al día con sus vacunas?</p>
                </div>
                <Switch
                  checked={formData.vaccinated}
                  onCheckedChange={(value) => handleInputChange('vaccinated', value)}
                />
              </div>
            </div>

            {/* Personality Traits */}
            <div>
              <Label className="text-[#6C63FF] font-medium">Personalidad</Label>
              <p className="text-xs text-gray-600 mb-2">Agrega rasgos de personalidad (máx. 10)</p>
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {formData.personality.map((trait, index) => (
                  <Badge
                    key={index}
                    className={`${
                      index === 0 ? 'bg-[#FF6F61] hover:bg-[#FF6F61]/90' :
                      index === 1 ? 'bg-[#6C63FF] hover:bg-[#6C63FF]/90' :
                      index === 2 ? 'bg-[#FFD166] text-gray-700 hover:bg-[#FFD166]/90' :
                      'bg-gray-600 hover:bg-gray-700'
                    } text-white transition-colors`}
                  >
                    {trait}
                    <button
                      onClick={() => removePersonality(index)}
                      className="ml-2 hover:opacity-70 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {formData.personality.length < 10 && (
                <div className="flex gap-2">
                  <Input
                    value={newPersonality}
                    onChange={(e) => setNewPersonality(e.target.value)}
                    placeholder="Ej: Juguetón, Cariñoso, Tranquilo..."
                    className="border-gray-300 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
                    onKeyPress={(e) => e.key === 'Enter' && addPersonality()}
                  />
                  <Button
                    type="button"
                    onClick={addPersonality}
                    size="sm"
                    disabled={!newPersonality.trim()}
                    className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white disabled:opacity-50"
                  >
                    Agregar
                  </Button>
                </div>
              )}
            </div>

            {/* Favorite Food */}
            <div>
              <Label htmlFor="favorite_food" className="text-[#6C63FF] font-medium">Comida Favorita</Label>
              <Input
                id="favorite_food"
                value={formData.favorite_food}
                onChange={(e) => handleInputChange('favorite_food', e.target.value)}
                className="mt-1 border-gray-300 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
                placeholder="Ej: Pollo con arroz, croquetas de salmón..."
              />
            </div>

            {/* Favorite Toys */}
            <div>
              <Label className="text-[#6C63FF] font-medium">Juguetes Favoritos</Label>
              <p className="text-xs text-gray-600 mb-2">Agrega los juguetes favoritos (máx. 10)</p>
              <div className="flex flex-wrap gap-2 mt-2 mb-3">
                {formData.favorite_toys.map((toy, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="border-[#FF6F61] text-[#FF6F61] bg-[#FF6F61]/5 hover:bg-[#FF6F61]/10 transition-colors"
                  >
                    {toy}
                    <button
                      onClick={() => removeToy(index)}
                      className="ml-2 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {formData.favorite_toys.length < 10 && (
                <div className="flex gap-2">
                  <Input
                    value={newToy}
                    onChange={(e) => setNewToy(e.target.value)}
                    placeholder="Ej: Pelota, Hueso de goma, Rascador..."
                    className="border-gray-300 focus:border-[#FF6F61] focus:ring-[#FF6F61]"
                    onKeyPress={(e) => e.key === 'Enter' && addToy()}
                  />
                  <Button
                    type="button"
                    onClick={addToy}
                    size="sm"
                    disabled={!newToy.trim()}
                    className="bg-[#FF6F61] hover:bg-[#FF6F61]/90 text-white disabled:opacity-50"
                  >
                    Agregar
                  </Button>
                </div>
              )}
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
                className="flex-1 bg-gradient-to-r from-[#FF6F61] to-[#FF6F61]/80 hover:from-[#FF6F61]/90 hover:to-[#FF6F61]/70 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingState ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Guardando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {petData.id ? 'Guardar Cambios' : 'Crear Mascota'}
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