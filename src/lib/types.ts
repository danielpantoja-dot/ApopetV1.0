// User and Profile Types
export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  location: string
  avatar_url: string | null
  created_at?: string
  updated_at?: string
}

// Pet Species Type
export type PetSpecies = 'perro' | 'gato' | 'loro' | 'erizo' | 'conejo' | 'hamster' | 'pez' | 'tortuga' | 'otro'

// Emoji mapping for pet species
export const PET_SPECIES_EMOJIS: Record<PetSpecies, string> = {
  perro: '🐕',
  gato: '🐈',
  loro: '🦜',
  erizo: '🦔',
  conejo: '🐰',
  hamster: '🐹',
  pez: '🐠',
  tortuga: '🐢',
  otro: '🐾'
}

// Pet Species Labels (for UI)
export const PET_SPECIES_LABELS: Record<PetSpecies, string> = {
  perro: 'Perro',
  gato: 'Gato',
  loro: 'Loro',
  erizo: 'Erizo',
  conejo: 'Conejo',
  hamster: 'Hámster',
  pez: 'Pez',
  tortuga: 'Tortuga',
  otro: 'Otro'
}

// Pet Types
export interface Pet {
  id: string
  owner_id: string
  name: string
  species: PetSpecies
  breed: string
  age: string
  weight: string
  color: string
  personality: string[]
  favorite_food: string
  favorite_toys: string[]
  vaccinated: boolean
  microchip: string
  image_url: string | null
  likes: number
  created_at?: string
  updated_at?: string
}

// Post Types
export type PostType = 'normal' | 'lost' | 'found'

export interface PetInfo {
  name: string
  species?: PetSpecies
  breed: string
  color: string
  size: string
  lastSeenLocation?: string
  contactPhone?: string
  reward?: string
}

export interface Post {
  id: string
  author_id: string
  pet_id: string | null
  content: string
  image_url: string | null
  video_url: string | null
  location: string | null
  type: PostType
  pet_info: PetInfo | null
  likes: number
  created_at: string
  updated_at?: string
}

export interface PostWithDetails extends Post {
  author: {
    id: string
    name: string
    avatar_url: string | null
  }
  pet: {
    id: string
    name: string
    species?: PetSpecies
    image_url: string | null
  } | null
  comments: Comment[]
  likes_count: number
  is_liked: boolean
}

// Comment Types
export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  likes: number
  created_at: string
  author?: {
    id: string
    name: string
    avatar_url: string | null
  }
}

// Like Types
export interface Like {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

// Notification Types
export type NotificationType = 'like' | 'comment' | 'follow' | 'mention'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  content: string
  read: boolean
  created_at: string
  sender_id?: string
  post_id?: string
}

// Follow Types
export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

// 🆕 PET LIKES TYPES (para sistema QR)
export interface PetLike {
  id: string
  pet_id: string
  visitor_id: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface PetWithLikes extends Pet {
  likes_count: number
  is_liked_by_visitor: boolean
  owner_name: string
  owner_location: string
  owner_phone: string
  owner_email: string
  owner_avatar: string | null
}

// Auth Types
export interface AuthUser {
  id: string
  email: string
  accessToken: string
}

export interface SignUpData {
  email: string
  password: string
  name: string
  phone: string
  location: string
}

export interface LoginData {
  email: string
  password: string
}

// 🆕 TIPOS PARA PERFILES DE USUARIO
export interface UserProfileWithStats {
  profile: UserProfile
  pets: Pet[]
  followers: number
  following: number
  isFollowing: boolean
}