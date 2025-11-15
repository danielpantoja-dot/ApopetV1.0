/**
 * PublicViewRouter Component
 * 
 * Router para vistas públicas (sin autenticación)
 * Detecta rutas del tipo /pet/:id y muestra el perfil público
 * 
 * @component
 */

import { useEffect, useState } from 'react';
import { PublicPetProfile } from './public-pet-profile';

interface PublicViewRouterProps {
  children: React.ReactNode;
}

export function PublicViewRouter({ children }: PublicViewRouterProps) {
  const [publicPetId, setPublicPetId] = useState<string | null>(null);

  useEffect(() => {
    // Detectar si estamos en una ruta pública /pet/:id
    const detectPublicRoute = () => {
      const path = window.location.pathname;
      const petMatch = path.match(/^\/pet\/([a-f0-9-]{36})$/i);
      
      if (petMatch && petMatch[1]) {
        setPublicPetId(petMatch[1]);
      } else {
        setPublicPetId(null);
      }
    };

    // Ejecutar al montar
    detectPublicRoute();

    // Escuchar cambios de URL (para SPA routing)
    window.addEventListener('popstate', detectPublicRoute);
    
    return () => {
      window.removeEventListener('popstate', detectPublicRoute);
    };
  }, []);

  // Si hay un ID de mascota público, mostrar el perfil público
  if (publicPetId) {
    return <PublicPetProfile petId={publicPetId} />;
  }

  // Si no, renderizar la app normal
  return <>{children}</>;
}
