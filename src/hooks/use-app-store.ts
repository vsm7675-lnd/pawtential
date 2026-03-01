import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Breed } from '@/lib/breeds';

export type ViewType = 'home' | 'quiz' | 'favorites' | 'compare' | 'explore' | 'profile';

interface FavoriteCollection {
  id: string;
  name: string;
  breedIds: string[];
  notes: Record<string, string>;
  createdAt: number;
}

interface AppState {
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  
  // Favorites
  favorites: string[];
  collections: FavoriteCollection[];
  addFavorite: (breedId: string) => void;
  removeFavorite: (breedId: string) => void;
  isFavorite: (breedId: string) => boolean;
  toggleFavorite: (breedId: string) => void;
  createCollection: (name: string) => string;
  addToCollection: (collectionId: string, breedId: string) => void;
  removeFromCollection: (collectionId: string, breedId: string) => void;
  updateNote: (collectionId: string, breedId: string, note: string) => void;
  
  // Swipe History
  swipedBreeds: { breedId: string; direction: 'left' | 'right'; timestamp: number }[];
  addSwipe: (breedId: string, direction: 'left' | 'right') => void;
  undoLastSwipe: () => { breedId: string; direction: 'left' | 'right' } | null;
  clearSwipeHistory: () => void;
  
  // Compare
  compareList: string[];
  addToCompare: (breedId: string) => void;
  removeFromCompare: (breedId: string) => void;
  clearCompareList: () => void;
  
  // Profile
  selectedBreed: Breed | null;
  setSelectedBreed: (breed: Breed | null) => void;
  
  // Quiz
  quizResults: { breed: Breed; score: number; matchLabel: string }[];
  setQuizResults: (results: { breed: Breed; score: number; matchLabel: string }[]) => void;
  
  // Species Filter
  speciesFilter: 'Dog' | 'Cat' | 'Both';
  setSpeciesFilter: (filter: 'Dog' | 'Cat' | 'Both') => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Navigation
      currentView: 'home',
      setCurrentView: (view) => set({ currentView: view }),
      
      // Favorites
      favorites: [],
      collections: [
        { id: 'default-favorites', name: 'Favorites', breedIds: [], notes: {}, createdAt: Date.now() },
        { id: 'considering', name: 'Considering', breedIds: [], notes: {}, createdAt: Date.now() },
      ],
      
      addFavorite: (breedId) => set((state) => {
        if (state.favorites.includes(breedId)) return state;
        const collections = [...state.collections];
        const defaultCollection = collections.find(c => c.id === 'default-favorites');
        if (defaultCollection && !defaultCollection.breedIds.includes(breedId)) {
          defaultCollection.breedIds.push(breedId);
        }
        return { 
          favorites: [...state.favorites, breedId],
          collections
        };
      }),
      
      removeFavorite: (breedId) => set((state) => {
        const collections = state.collections.map(c => ({
          ...c,
          breedIds: c.breedIds.filter(id => id !== breedId)
        }));
        return { 
          favorites: state.favorites.filter(id => id !== breedId),
          collections
        };
      }),
      
      isFavorite: (breedId) => get().favorites.includes(breedId),
      
      toggleFavorite: (breedId) => {
        if (get().isFavorite(breedId)) {
          get().removeFavorite(breedId);
        } else {
          get().addFavorite(breedId);
        }
      },
      
      createCollection: (name) => {
        const id = `collection-${Date.now()}`;
        set((state) => ({
          collections: [...state.collections, {
            id,
            name,
            breedIds: [],
            notes: {},
            createdAt: Date.now()
          }]
        }));
        return id;
      },
      
      addToCollection: (collectionId, breedId) => set((state) => ({
        collections: state.collections.map(c => 
          c.id === collectionId && !c.breedIds.includes(breedId)
            ? { ...c, breedIds: [...c.breedIds, breedId] }
            : c
        )
      })),
      
      removeFromCollection: (collectionId, breedId) => set((state) => ({
        collections: state.collections.map(c => 
          c.id === collectionId
            ? { ...c, breedIds: c.breedIds.filter(id => id !== breedId) }
            : c
        )
      })),
      
      updateNote: (collectionId, breedId, note) => set((state) => ({
        collections: state.collections.map(c => 
          c.id === collectionId
            ? { ...c, notes: { ...c.notes, [breedId]: note } }
            : c
        )
      })),
      
      // Swipe History
      swipedBreeds: [],
      
      addSwipe: (breedId, direction) => set((state) => ({
        swipedBreeds: [...state.swipedBreeds.slice(-49), { breedId, direction, timestamp: Date.now() }]
      })),
      
      undoLastSwipe: () => {
        const state = get();
        if (state.swipedBreeds.length === 0) return null;
        
        const lastSwipe = state.swipedBreeds[state.swipedBreeds.length - 1];
        set({ swipedBreeds: state.swipedBreeds.slice(0, -1) });
        
        if (lastSwipe.direction === 'right') {
          get().removeFavorite(lastSwipe.breedId);
        }
        
        return lastSwipe;
      },
      
      clearSwipeHistory: () => set({ swipedBreeds: [] }),
      
      // Compare
      compareList: [],
      
      addToCompare: (breedId) => set((state) => {
        if (state.compareList.length >= 4 || state.compareList.includes(breedId)) {
          return state;
        }
        return { compareList: [...state.compareList, breedId] };
      }),
      
      removeFromCompare: (breedId) => set((state) => ({
        compareList: state.compareList.filter(id => id !== breedId)
      })),
      
      clearCompareList: () => set({ compareList: [] }),
      
      // Profile
      selectedBreed: null,
      setSelectedBreed: (breed) => set({ selectedBreed: breed }),
      
      // Quiz
      quizResults: [],
      setQuizResults: (results) => set({ quizResults: results }),
      
      // Species Filter
      speciesFilter: 'Dog',
      setSpeciesFilter: (filter) => set({ speciesFilter: filter }),
      
      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'pet-breed-finder-storage',
      partialize: (state) => ({
        favorites: state.favorites,
        collections: state.collections,
        swipedBreeds: state.swipedBreeds,
        compareList: state.compareList,
        quizResults: state.quizResults,
        speciesFilter: state.speciesFilter,
      }),
    }
  )
);
