/**
 * QROptions Component
 * * Sistema completo de generación y escaneo de códigos QR para mascotas
 * * Features:
 * - Generación de QR con URL única por mascota
 * - Descarga del QR en alta calidad (PNG)
 * - Compartir QR por redes sociales
 * - Escaneo de QR con cámara
 * - Vista previa del perfil público
 * * @component
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { QrCode, Camera, X, Eye, Download, Share2, ExternalLink, Copy, Check } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner@2.0.3";

interface QROptionsProps {
  petData: {
    id: string;
    name: string;
    species?: string;
    breed: string;
    age: string;
    image?: string;
  };
  onNavigate: (view: string) => void;
}

export function QROptions({ petData, onNavigate }: QROptionsProps) {
  const [activeOption, setActiveOption] = useState<'select' | 'show' | 'scan'>('select');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Generar URL pública del perfil QR
   * * IMPORTANTE: Esta URL debe coincidir con tu dominio de producción
   * * CONFIGURACIÓN:
   * - Producción (GitHub Pages): https://danielpantoja-dot.github.io/ApopetV1.0/
   * - Desarrollo local: window.location.origin
   */
  const generatePublicURL = () => {
    // URL de producción en GitHub Pages
    const PRODUCTION_URL = 'https://danielpantoja-dot.github.io/ApopetV1.0';
    
    // Detectar si estamos en producción o desarrollo
    const isProduction = window.location.hostname.includes('github.io');
    
    const baseURL = isProduction ? PRODUCTION_URL : window.location.origin;
    return `${baseURL}/pet/${petData.id}`;
  };

  /**
   * Verifica soporte de cámara al montar
   */
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraSupported(false);
    }
  }, []);

  /**
   * Limpia recursos al desmontar
   */
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  /**
   * Inicia el escaneo con cámara
   */
  const startScanning = async () => {
    if (!cameraSupported) {
      toast.error('Tu dispositivo no soporta cámara');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        toast.success('Cámara iniciada');
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setCameraSupported(false);
      toast.error('No se pudo acceder a la cámara');
    }
  };

  /**
   * Detiene el escaneo y libera la cámara
   */
  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setScanResult(null);
  };

  /**
   * Descarga el código QR como imagen PNG en alta calidad
   * Optimizado para impresión (1000x1000px)
   */
  const downloadQR = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (!canvas) {
      toast.error('Error al generar QR. Por favor, intenta de nuevo.');
      return;
    }

    try {
      // Crear canvas temporal con mayor resolución para impresión
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) {
        toast.error('Error al procesar el QR');
        return;
      }

      // Tamaño de alta calidad para impresión (1000x1000px)
      const size = 1000;
      tempCanvas.width = size;
      tempCanvas.height = size;

      // Fondo blanco para mejor contraste
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // Dibujar QR escalado manteniendo calidad
      ctx.imageSmoothingEnabled = false; // Evitar suavizado para mantener nitidez
      ctx.drawImage(canvas, 0, 0, size, size);

      // Generar y descargar
      tempCanvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Error al generar el archivo');
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-${petData.name.toLowerCase().replace(/\s/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('✅ QR descargado exitosamente (1000x1000px)');
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Error downloading QR:', error);
      toast.error('Error al descargar el QR. Por favor, intenta de nuevo.');
    }
  };

  /**
   * Comparte el enlace del perfil
   */
  const shareProfile = async () => {
    const shareUrl = generatePublicURL();
    const shareData = {
      title: `Perfil de ${petData.name}`,
      text: `¡Mira el perfil de ${petData.name}! 🐾`,
      url: shareUrl
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Compartido exitosamente');
      } else {
        // Fallback: copiar al portapapeles
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

  /**
   * Copia el enlace al portapapeles
   */
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatePublicURL());
      setCopied(true);
      toast.success('Enlace copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar enlace');
    }
  };

  /**
   * Abre el perfil público en nueva pestaña
   */
  const openPublicProfile = () => {
    const url = generatePublicURL();
    window.open(url, '_blank');
  };

  /**
   * Renderiza el código QR
   */
  const renderQRCode = () => {
    const qrData = generatePublicURL();
    
    return (
      <div className="relative">
        <div className="w-72 h-72 bg-white p-6 rounded-2xl shadow-2xl">
          <QRCodeCanvas 
            id="qr-code-canvas"
            value={qrData} 
            size={256} 
            bgColor="#ffffff" 
            fgColor="#000000"
            level="H"
            includeMargin={false}
            imageSettings={{
              src: petData.image || '',
              excavate: true,
              width: 50,
              height: 50
            }}
          />
        </div>
        
        {/* Pet info badge */}
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-[#6C63FF] text-white px-4 py-2 rounded-full shadow-lg">
          <p className="text-sm font-medium">{petData.name}</p>
        </div>
      </div>
    );
  };

  // ============================================
  // VISTA: SELECTOR DE OPCIONES
  // ============================================
  if (activeOption === 'select') {
    return (
      <div className="flex-1 bg-gradient-to-br from-rose-50 via-purple-50 to-yellow-50 px-4 py-6 mt-16 mb-20">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#6C63FF]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-[#6C63FF]" />
            </div>
            <h2 className="text-[#6C63FF]">Código QR</h2>
            <p className="text-gray-600">Elige una opción para continuar</p>
          </div>

          <div className="space-y-4">
            {/* Mostrar QR */}
            <Card 
              className="cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] border-0 bg-white/80 backdrop-blur-sm"
              onClick={() => setActiveOption('show')}
            >
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="bg-[#6C63FF]/10 p-4 rounded-xl">
                  <Eye className="w-6 h-6 text-[#6C63FF]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#6C63FF] mb-1">Mostrar mi QR</h3>
                  <p className="text-gray-600 text-sm">
                    Muestra el código QR de {petData.name} para compartir
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Escanear QR */}
            <Card 
              className="cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] border-0 bg-white/80 backdrop-blur-sm"
              onClick={() => setActiveOption('scan')}
            >
              <CardContent className="p-6 flex items-center space-x-4">
                <div className="bg-[#FF6F61]/10 p-4 rounded-xl">
                  <Camera className="w-6 h-6 text-[#FF6F61]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#FF6F61] mb-1">Escanear QR</h3>
                  <p className="text-gray-600 text-sm">
                    Usa la cámara para escanear el QR de otra mascota
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // VISTA: MOSTRAR QR CODE
  // ============================================
  if (activeOption === 'show') {
    return (
      <div className="flex-1 bg-gradient-to-br from-rose-50 via-purple-50 to-yellow-50 px-4 py-6 mt-16 mb-20">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => setActiveOption('select')} 
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
            <h2 className="text-[#6C63FF]">QR de {petData.name}</h2>
            <div className="w-10" />
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center space-y-6">
            {renderQRCode()}

            {/* Info card */}
            <Card className="w-full border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Comparte este código para que otros puedan ver el perfil de {petData.name}
                  </p>
                  
                  {/* Public URL */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center gap-2 mb-4">
                    <code className="text-xs text-gray-600 flex-1 truncate">
                      {generatePublicURL()}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={copyLink}
                      className="h-8 w-8 p-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={downloadQR}
                    className="bg-[#6C63FF] text-white hover:bg-[#6C63FF]/90"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                  
                  <Button
                    onClick={shareProfile}
                    variant="outline"
                    className="border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartir
                  </Button>
                </div>

                <Button
                  onClick={openPublicProfile}
                  variant="outline"
                  className="w-full border-[#FFD166] text-gray-700 hover:bg-[#FFD166]"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ver Perfil Público
                </Button>
              </CardContent>
            </Card>

            {/* Tips card */}
            <Card className="w-full border-[#FFD166]/30 bg-[#FFD166]/5">
              <CardContent className="pt-4 pb-4 space-y-2">
                <p className="text-sm text-gray-600 text-center">
                  💡 <strong>Tip:</strong> Descarga el QR e imprímelo para el collar de {petData.name}
                </p>
                <p className="text-xs text-gray-500 text-center">
                  El QR se descarga en alta calidad (1000x1000px) listo para imprimir
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // VISTA: ESCANEAR QR
  // ============================================
  if (activeOption === 'scan') {
    return (
      <div className="flex-1 bg-gradient-to-br from-rose-50 via-purple-50 to-yellow-50 px-4 py-6 mt-16 mb-20">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                stopScanning();
                setActiveOption('select');
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
            <h2 className="text-[#FF6F61]">Escanear QR</h2>
            <div className="w-10" />
          </div>

          {!cameraSupported ? (
            // Cámara no soportada
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-64 h-64 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Cámara no disponible</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Tu dispositivo no soporta acceso a la cámara o no tienes permisos habilitados
                </p>
              </CardContent>
            </Card>
          ) : (
            // Vista de escaneo
            <div className="flex flex-col items-center space-y-6">
              
              {/* Camera view */}
              <div className="relative w-full max-w-sm">
                <div className="aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay frame */}
                  <div className="absolute inset-0 border-4 border-[#FF6F61] rounded-2xl pointer-events-none">
                    <div className="absolute inset-8 border-2 border-white/50 border-dashed rounded-xl flex items-center justify-center">
                      {!isScanning && (
                        <QrCode className="w-16 h-16 text-white/70" />
                      )}
                      {isScanning && (
                        <div className="text-white text-center">
                          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                          <p className="text-sm">Escaneando...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Corner markers */}
                  <div className="absolute top-8 left-8 w-6 h-6 border-t-4 border-l-4 border-[#FFD166]"></div>
                  <div className="absolute top-8 right-8 w-6 h-6 border-t-4 border-r-4 border-[#FFD166]"></div>
                  <div className="absolute bottom-8 left-8 w-6 h-6 border-b-4 border-l-4 border-[#FFD166]"></div>
                  <div className="absolute bottom-8 right-8 w-6 h-6 border-b-4 border-r-4 border-[#FFD166]"></div>
                </div>
              </div>

              {/* Controls */}
              <Card className="w-full border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="pt-6 pb-6">
                  {!isScanning ? (
                    <div className="text-center space-y-4">
                      <Button 
                        onClick={startScanning} 
                        className="w-full bg-[#FF6F61] text-white hover:bg-[#FF6F61]/90 py-6"
                      >
                        <Camera className="w-5 h-5 mr-2" /> 
                        Iniciar Cámara
                      </Button>
                      <p className="text-gray-600 text-sm">
                        Posiciona el código QR dentro del marco para escanearlo
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <Button 
                        onClick={stopScanning}
                        variant="outline"
                        className="w-full border-[#FF6F61] text-[#FF6F61] hover:bg-[#FF6F61] hover:text-white py-6"
                      >
                        Detener Cámara
                      </Button>
                      <p className="text-[#FF6F61] text-sm font-medium">
                        📸 Apunta hacia un código QR
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Info */}
              <Card className="w-full border-[#6C63FF]/30 bg-[#6C63FF]/5">
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm text-gray-600 text-center">
                    💡 <strong>Nota:</strong> Para escaneo completo, usa la aplicación de cámara nativa de tu dispositivo
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}