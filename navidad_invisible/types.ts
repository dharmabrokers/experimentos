export interface User {
  id: string;
  name: string;
  wishlist: string;
  assignedTo?: string; // The ID of the person they have to give a gift to
  password?: string; // Optional password for account protection
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AppState {
  users: User[];
  isDrawDone: boolean;
}

export const FAMILY_MEMBERS = [
  'Erik',
  'Adrián',
  'Corinne',
  'Luis',
  'Blanca',
  'Alan',
  'Begoña',
  'Scott',
  'Aaron',
  'Nerea'
];