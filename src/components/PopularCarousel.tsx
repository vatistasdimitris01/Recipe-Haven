import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

const SEASONS: { [key: number]: { name: string, category: string } } = {
    0: { name: 'Winter', category: 'Soup' },
    1: { name: 'Winter', category: 'Soup' },
    2: { name: 'Spring', category: 'Veggie' },
    3: { name: 'Spring', category: 'Veggie' },
    4: { name: 'Spring', category: 'Veggie' },
    5: { name: 'Summer', category: 'Salad' },
    6: { name: 'Summer', category: 'Salad' },
    7: { name: 'Summer', category: 'Salad' },
    8: { name: 'Fall', category: 'Beef' },
    9: { name: 'Fall', category: 'Beef' },
    10: { name: 'Fall', category: 'Beef' },
    11: { name: 'Winter', category: 'Soup' },
};

export default function PopularCarousel({ onSelect, title, category }: { onSelect: (recipe: any) => void, title?: string, category?: string }) {
    const [recipes, setRecipes] = useState<any[]>([]);
    const month = new Date().getMonth();
    const season = SEASONS[month];
    const displayCategory = category || season.category;
    const displayTitle = title || `Popular for ${season.name}`;

    useEffect(() => {
        fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${displayCategory}`)
            .then(res => res.json())
            .then(data => {
                if (data.meals) {
                    Promise.all(data.meals.slice(0, 10).map(async (m: any) => {
                        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`);
                        const d = await res.json();
                        return d.meals[0];
                    })).then(setRecipes);
                }
            });
    }, [displayCategory]);

    if (recipes.length === 0) return null;

    return (
        <div className="px-4 py-8">
            <h2 className="font-serif text-2xl italic mb-6">{displayTitle}</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                {recipes.map((recipe) => (
                    <motion.div
                        key={recipe.idMeal}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => onSelect(recipe)}
                        className="min-w-[160px] sm:min-w-[200px] md:min-w-[250px] bg-white rounded-2xl p-3 shadow-sm border border-editorial-border cursor-pointer hover:shadow-md transition flex flex-col gap-2"
                    >
                        <div className="aspect-square w-full overflow-hidden rounded-xl">
                            <img src={recipe.strMealThumb} alt={recipe.strMeal} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="font-serif text-sm italic truncate">{recipe.strMeal}</h3>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
