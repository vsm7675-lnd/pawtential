'use client';

import { useAppStore, ViewType } from '@/hooks/use-app-store';
import { Home, HelpCircle, Heart, GitCompare, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems: { id: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'compare', label: 'Compare', icon: GitCompare },
  { id: 'explore', label: 'Explore', icon: Search },
];

export function BottomNavigation() {
  const { currentView, setCurrentView, favorites, compareList } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const showBadge = item.id === 'favorites' && favorites.length > 0;
          const compareCount = item.id === 'compare' && compareList.length > 0 ? compareList.length : 0;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                'flex flex-col items-center justify-center min-w-[64px] min-h-[48px] rounded-xl transition-all duration-200',
                'active:scale-95 touch-manipulation',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={cn(
                  'w-6 h-6 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center px-1">
                    {favorites.length > 9 ? '9+' : favorites.length}
                  </span>
                )}
                {compareCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center px-1">
                    {compareCount}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-xs mt-1 font-medium transition-opacity',
                isActive ? 'opacity-100' : 'opacity-70'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
