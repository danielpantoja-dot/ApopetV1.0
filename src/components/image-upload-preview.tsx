import { useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface ImageUploadPreviewProps {
  currentImage?: string;
  onImageSelect: (file: File, preview: string) => void;
  onImageRemove?: () => void;
  uploading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  fallbackIcon?: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32'
};

export function ImageUploadPreview({
  currentImage,
  onImageSelect,
  onImageRemove,
  uploading = false,
  size = 'lg',
  label = 'Cambiar foto',
  fallbackIcon,
  className = ''
}: ImageUploadPreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona solo imágenes");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setPreview(previewUrl);
      onImageSelect(file, previewUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageRemove) {
      onImageRemove();
    }
  };

  const displayImage = preview || currentImage;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative">
        <Avatar className={`${sizeClasses[size]} ring-2 ring-primary/30`}>
          <AvatarImage src={displayImage} alt="Preview" />
          <AvatarFallback className="bg-primary/10 text-primary">
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : fallbackIcon ? (
              fallbackIcon
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </AvatarFallback>
        </Avatar>

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
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
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </Button>

        {/* Remove Button (only show if has preview or currentImage) */}
        {(preview || currentImage) && onImageRemove && !uploading && (
          <Button
            size="sm"
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 rounded-full w-6 h-6 p-0 bg-destructive hover:bg-destructive/90 text-white shadow-lg"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {uploading ? 'Subiendo imagen...' : label}
      </p>
    </div>
  );
}
