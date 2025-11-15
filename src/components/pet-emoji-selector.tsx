/**
 * PetEmojiSelector Component
 * 
 * Componente selector de tipo de animal con emojis visuales
 * Permite al usuario seleccionar el tipo de mascota (perro, gato, loro, etc.)
 * y muestra el emoji correspondiente
 * 
 * @component
 * @example
 * <PetEmojiSelector 
 *   value="perro" 
 *   onChange={(species) => setSpecies(species)} 
 * />
 */

import { PetSpecies, PET_SPECIES_EMOJIS, PET_SPECIES_LABELS } from "../lib/types";
import { Label } from "./ui/label";

interface PetEmojiSelectorProps {
  value: PetSpecies;
  onChange: (species: PetSpecies) => void;
  disabled?: boolean;
}

export function PetEmojiSelector({ value, onChange, disabled = false }: PetEmojiSelectorProps) {
  // Array de todas las especies disponibles
  const species: PetSpecies[] = ['perro', 'gato', 'loro', 'erizo', 'conejo', 'hamster', 'pez', 'tortuga', 'otro'];

  return (
    <div className="space-y-3">
      <Label className="text-[#6C63FF] font-medium">
        Tipo de Animal *
      </Label>
      <p className="text-xs text-gray-600 mb-2">
        Selecciona el tipo de mascota
      </p>
      
      {/* Grid de emojis seleccionables */}
      <div className="grid grid-cols-5 gap-3">
        {species.map((speciesType) => (
          <button
            key={speciesType}
            type="button"
            onClick={() => !disabled && onChange(speciesType)}
            disabled={disabled}
            className={`
              relative p-3 rounded-xl border-2 transition-all duration-200
              flex flex-col items-center justify-center gap-1
              ${value === speciesType 
                ? 'border-[#FF6F61] bg-[#FF6F61]/10 shadow-md scale-105' 
                : 'border-gray-200 bg-white hover:border-[#FFD166] hover:bg-[#FFD166]/5 hover:scale-102'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            aria-label={`Seleccionar ${PET_SPECIES_LABELS[speciesType]}`}
          >
            {/* Emoji */}
            <span className="text-2xl" role="img" aria-label={PET_SPECIES_LABELS[speciesType]}>
              {PET_SPECIES_EMOJIS[speciesType]}
            </span>
            
            {/* Label */}
            <span className={`text-xs ${value === speciesType ? 'text-[#FF6F61]' : 'text-gray-600'}`}>
              {PET_SPECIES_LABELS[speciesType]}
            </span>

            {/* Checkmark cuando está seleccionado */}
            {value === speciesType && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6F61] rounded-full flex items-center justify-center shadow-sm">
                <svg 
                  className="w-3 h-3 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={3} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Información adicional */}
      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-2xl">{PET_SPECIES_EMOJIS[value]}</div>
        <p className="text-xs text-gray-700">
          Seleccionado: <span className="font-medium text-[#6C63FF]">{PET_SPECIES_LABELS[value]}</span>
        </p>
      </div>
    </div>
  );
}
