/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, KeyboardEvent, useMemo, useRef, useEffect, MouseEvent } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import PopularCarousel from './components/PopularCarousel';

export default function App() {
  const [input, setInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Resize state
  const [leftWidth, setLeftWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const allKnownIngredients = useMemo(() => ['tomato', 'basil', 'chicken', 'pasta', 'beef', 'garlic', 'onion', 'pepper', 'rice'], []);
  
  const suggestions = useMemo(() => {
    if (!input) return [];
    return allKnownIngredients.filter(ing => ing.toLowerCase().includes(input.toLowerCase()));
  }, [input, allKnownIngredients]);

  const addIngredient = (ing: string) => {
    if (ing && !ingredients.includes(ing.toLowerCase())) {
        setIngredients([...ingredients, ing.toLowerCase()]);
        setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        addIngredient(input.trim());
    }
    if (e.key === 'Backspace' && !input && ingredients.length > 0) {
        setIngredients(ingredients.slice(0, -1));
    }
  };

  const searchRecipes = async () => {
    setLoading(true);
    try {
      let results: any[] = [];
      
      // If we have ingredients, fetch via first ingredient endpoint
      if (ingredients.length > 0) {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredients[0]}`);
        const data = await response.json();
        
        if (data.meals) {
          // Fetch full details for potential candidates to allow client-side filtering
          const allCandidates = await Promise.all(data.meals.map(async (m: any) => {
            const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`);
            const d = await res.json();
            return d.meals[0];
          }));
          
          // Client-side filter: keep only recipes that contain ALL selected ingredients
          results = allCandidates.filter((recipe: any) => {
            const recipeIngredients = [];
            for (let i = 1; i <= 20; i++) {
              if (recipe[`strIngredient${i}`]) {
                recipeIngredients.push(recipe[`strIngredient${i}`].toLowerCase());
              }
            }
            return ingredients.every(ing => recipeIngredients.includes(ing.toLowerCase()));
          });
        }
      } else if (input) {
        // Name search
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${input}`);
        const data = await response.json();
        results = data.meals || [];
      }
      
      setRecipes(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Dragging logic
  const handleMouseDown = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | globalThis.MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidthPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Constraints: 20% to 80%
      if (newWidthPercent > 20 && newWidthPercent < 80) {
        setLeftWidth(newWidthPercent);
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex h-screen bg-editorial-bg text-editorial-text font-sans overflow-hidden" ref={containerRef}>
      {/* Main Content Area (Discover) */}
      <div 
        style={{ width: (selectedRecipe && !isMobile) ? `${leftWidth}%` : '100%' }}
        className={`flex flex-col h-full transition-all duration-75 overflow-y-auto ${selectedRecipe && isMobile ? 'hidden' : 'flex'}`}
      >
        <header className="px-8 pt-12 pb-8 text-center">
            <h1 
                className="text-4xl font-serif italic mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedRecipe(null)}
            >Recipe Haven</h1>
            <p className="text-sm opacity-60">Find delicious recipes.</p>
        </header>

        {/* Search Bar - Hidden when recipe selected */}
        {!selectedRecipe && (
        <div className="px-4 pb-8 z-20">
            <div className="max-w-2xl mx-auto flex bg-white rounded-[32px] shadow-sm border border-editorial-border items-center p-2">
            <div className="flex flex-wrap gap-2 px-2">
                {ingredients.map(ing => (
                    <span key={ing} className="bg-gray-200 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                        {ing}
                        <button onClick={() => setIngredients(ingredients.filter(i => i !== ing))}><X className="w-3 h-3"/></button>
                    </span>
                ))}
            </div>
            {/* Search Input with suggestions */}
            <div className="relative flex-grow">
              <input
                  type="text"
                  className="w-full p-3 outline-none text-sm bg-transparent"
                  placeholder={ingredients.length === 0 ? "Type ingredient and space..." : ""}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
              />
              {suggestions.length > 0 && !selectedRecipe && (
                  <ul className="absolute top-full left-0 w-full bg-white border border-editorial-border rounded-b-2xl shadow-lg mt-1 z-50 overflow-hidden">
                      {suggestions.map(s => (
                          <li 
                            key={s} 
                            onClick={() => addIngredient(s)}
                            className="px-4 py-2 hover:bg-editorial-bg cursor-pointer text-sm"
                          >
                            {s}
                          </li>
                      ))}
                  </ul>
              )}
            </div>
            <button onClick={searchRecipes} className="p-3 opacity-40 hover:opacity-100"><Search className="w-5 h-5" /></button>
            </div>
        </div>
        )}

        {!selectedRecipe && (
            <>
                <PopularCarousel title="Seasonal Favorites" onSelect={(recipe) => { setSelectedRecipe(recipe); setLeftWidth(50); }} />
                <PopularCarousel title="Popular Dishes" category="Beef" onSelect={(recipe) => { setSelectedRecipe(recipe); setLeftWidth(50); }} />
            </>
        )}

        {/* Discover List - Responsive grid */}
        <div className={`px-4 pb-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-4 gap-4 ${isDragging ? 'select-none' : ''}`}>
            {loading ? <div className="text-center py-10 col-span-full">Loading...</div> : recipes.map((recipe: any) => (
                <div 
                    key={recipe.idMeal} 
                    onClick={() => { setSelectedRecipe(recipe); setLeftWidth(50); }}
                    className="bg-white rounded-2xl p-3 shadow-sm border border-editorial-border cursor-pointer hover:shadow-md transition flex flex-col gap-3"
                >
                    <div className="aspect-square w-full overflow-hidden rounded-xl">
                        <img src={recipe.strMealThumb} alt={recipe.strMeal} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-serif text-sm italic">{recipe.strMeal}</h3>
                        <p className="text-[10px] opacity-60 uppercase">{recipe.strCategory}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Resize Handle - Only shows if a recipe is selected and not on mobile */}
      {selectedRecipe && !isMobile && (
        <div 
            className="w-1 cursor-col-resize hover:bg-editorial-accent transition-colors"
            onMouseDown={handleMouseDown}
        />
      )}

      {/* Side Guide Area */}
      <div 
        style={{ width: (selectedRecipe && !isMobile) ? `${100 - leftWidth}%` : '100%' }}
        className={`bg-white border-l border-editorial-border shadow-2xl transition-all duration-75 overflow-y-auto 
          ${selectedRecipe ? 'block' : 'hidden'} 
          ${isMobile ? 'fixed inset-0 z-50' : 'relative'}`}
      >
        {selectedRecipe && (
            <div className="p-8">
                <button onClick={() => setSelectedRecipe(null)} className="mb-6 flex items-center gap-2 text-sm uppercase tracking-wider font-semibold opacity-60"><ArrowLeft className="w-4 h-4"/> Back to Discover</button>
                <img src={selectedRecipe.strMealThumb} alt={selectedRecipe.strMeal} className="w-full h-80 object-cover rounded-2xl mb-8" />
                <h2 className="font-serif text-3xl italic mb-6">{selectedRecipe.strMeal}</h2>
                <div className="font-semibold text-xs uppercase tracking-wider mb-2 underline">Instructions:</div>
                <p className="text-sm text-gray-600 leading-relaxed mb-8">{selectedRecipe.strInstructions}</p>
                
                <div className="font-semibold text-xs uppercase tracking-wider mb-2 underline">Ingredients:</div>
                <ul className="text-sm text-gray-600 space-y-1">
                    {Array.from({length: 20}).map((_, i) => selectedRecipe[`strIngredient${i+1}`] && (
                        <li key={i} className="border-b border-gray-100 py-1">{selectedRecipe[`strIngredient${i+1}`]} - {selectedRecipe[`strMeasure${i+1}`]}</li>
                    ))}
                </ul>
            </div>
        )}
      </div>
    </div>
  );
}
