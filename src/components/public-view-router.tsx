/**
 * PublicViewRouter Component
 * * Router para vistas públicas (sin autenticación).
 * Detecta rutas del tipo /pet/:id y muestra el perfil público
 * * @component
 */

import { useEffect, useState } from 'react';
import { PublicPetProfile } from './public-pet-profile';

interface PublicViewRouterProps {
  children: React.ReactNode;
}

const REPO_NAME = 'ApopetV1.0';

export function PublicViewRouter({ children }: PublicViewRouterProps) {
  const [publicPetId, setPublicPetId] = useState<string | null>(null);

  useEffect(() => {
    // Detectar si estamos en una ruta pública /pet/:id
    const detectPublicRoute = () => {
      const path = window.location.pathname;
      
      // La expresión regular busca:
      // 1. (?:\\/${REPO_NAME})?: Hace que '/Apopet' sea opcional para que funcione en desarrollo local o en el entorno de GitHub Pages.
      // 2. \\/pet\\/: Busca la parte '/pet/'.
      // 3. ([a-f0-9-]{36})$: Captura el ID (UUID de 36 caracteres) al final de la ruta.
      const regex = new RegExp(`(?:\\/${REPO_NAME})?\\/pet\\/([a-f0-9-]{36})$`, 'i');
      
      const petMatch = path.match(regex);
      
      if (petMatch && petMatch[1]) {
        // petMatch[1] contendrá el ID de la mascota capturado por el Regex.
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