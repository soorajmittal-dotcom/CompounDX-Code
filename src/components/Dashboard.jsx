import { useState, useEffect } from 'react';
import { MENU_DATABASE, DRINKS } from '../data/menuItems';
import { RECIPES } from '../data/recipes';
import { getTopRecipes, getTopByCategory, toggleCheer, isCheeredLocally } from '../utils/cheersDb';
import RecipeModal from './RecipeModal';

const DASHBOARD_CATEGORIES = [
  { key: 'all', label: 'Top Overall', icon: '🏆' },
  { key: 'starters', label: 'Best Appetizers', icon: '🥗' },
  { key: 'mains', label: 'Best Mains', icon: '🍛' },
  { key: 'desserts', label: 'Best Desserts', icon: '🍰' },
  { key: 'veg', label: 'Top Veg', icon: '🥬' },
  { key: 'nonveg', label: 'Top Non-Veg', icon: '🍗' },
];

function getAllMenuItems() {
  const items = {};
  for (const [cuisineId, cuisine] of Object.entries(MENU_DATABASE)) {
    for (const [cat, catItems] of Object.entries(cuisine)) {
      for (const item of catItems) {
        if (!items[item.name]) {
          items[item.name] = { ...item, cuisine: cuisineId, menuCategory: cat };
        }
      }
    }
  }
  return items;
}

const ALL_ITEMS = getAllMenuItems();

export default function Dashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState('all');
  const [topRecipes, setTopRecipes] = useState([]);
  const [categoryTop, setCategoryTop] = useState({});
  const [cheeredItems, setCheeredItems] = useState({});
  const [recipeItem, setRecipeItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const top = await getTopRecipes(20);
    setTopRecipes(top);

    const cats = {};
    for (const cat of ['starters', 'mains', 'desserts']) {
      cats[cat] = await getTopByCategory(cat, 8);
    }
    setCategoryTop(cats);

    const cheered = {};
    for (const item of top) {
      cheered[item.recipe_name] = isCheeredLocally(item.recipe_name);
    }
    setCheeredItems(cheered);

    setLoading(false);
  };

  const handleCheer = async (name, category) => {
    const result = await toggleCheer(name, category);
    setCheeredItems((prev) => ({ ...prev, [name]: result }));
  };

  const getDisplayItems = () => {
    if (activeTab === 'all') {
      if (topRecipes.length > 0) return topRecipes;
      return getDefaultTopItems();
    }

    if (activeTab === 'veg') {
      return getDefaultTopItems().filter((i) => {
        const item = ALL_ITEMS[i.recipe_name];
        return item?.veg;
      });
    }

    if (activeTab === 'nonveg') {
      return getDefaultTopItems().filter((i) => {
        const item = ALL_ITEMS[i.recipe_name];
        return item && !item.veg;
      });
    }

    const catItems = categoryTop[activeTab];
    if (catItems && catItems.length > 0) return catItems;

    return getDefaultTopItems().filter((i) => {
      const item = ALL_ITEMS[i.recipe_name];
      return item?.menuCategory === activeTab;
    });
  };

  const getDefaultTopItems = () => {
    const hasRecipe = Object.keys(RECIPES);
    return hasRecipe.map((name) => ({
      recipe_name: name,
      category: ALL_ITEMS[name]?.menuCategory || 'other',
      cheers: 0,
    }));
  };

  const displayItems = getDisplayItems();

  return (
    <div className="dashboard-overlay">
      <div className="dashboard-panel">
        <div className="dashboard-header">
          <h2>Community Dashboard</h2>
          <button className="modal-close" onClick={onClose}>x</button>
        </div>
        <p className="dashboard-subtitle">
          Discover popular dishes and give your favorites a cheer
        </p>

        <div className="dashboard-tabs">
          {DASHBOARD_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`dashboard-tab ${activeTab === cat.key ? 'active' : ''}`}
              onClick={() => setActiveTab(cat.key)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="dashboard-loading">Loading trending dishes...</div>
        ) : (
          <div className="dashboard-list">
            {displayItems.map((item, idx) => {
              const menuItem = ALL_ITEMS[item.recipe_name];
              const hasRecipe = !!RECIPES[item.recipe_name];
              const isCheered = cheeredItems[item.recipe_name] ?? isCheeredLocally(item.recipe_name);

              return (
                <div key={item.recipe_name} className="dashboard-item">
                  <span className="dashboard-rank">#{idx + 1}</span>
                  <div className="dashboard-item-info">
                    <div className="dashboard-item-name">
                      {item.recipe_name}
                      {menuItem?.veg && <span className="veg-badge-sm">V</span>}
                    </div>
                    <div className="dashboard-item-meta">
                      {menuItem?.cuisine && (
                        <span className="meta-tag">{menuItem.cuisine}</span>
                      )}
                      {menuItem?.difficulty && (
                        <span className="meta-tag">{menuItem.difficulty}</span>
                      )}
                      {menuItem?.prepTime && (
                        <span className="meta-tag">{menuItem.prepTime}m</span>
                      )}
                    </div>
                  </div>
                  <div className="dashboard-item-actions">
                    {hasRecipe && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => setRecipeItem(menuItem || { name: item.recipe_name })}
                      >
                        Recipe
                      </button>
                    )}
                    <button
                      className={`cheer-btn ${isCheered ? 'cheered' : ''}`}
                      onClick={() => handleCheer(item.recipe_name, item.category)}
                    >
                      {isCheered ? '🎉' : '👏'} {item.cheers > 0 ? item.cheers : ''}
                    </button>
                  </div>
                </div>
              );
            })}

            {displayItems.length === 0 && (
              <p className="dashboard-empty">
                No items in this category yet. Start planning parties and cheering dishes!
              </p>
            )}
          </div>
        )}

        {recipeItem && (
          <RecipeModal item={recipeItem} onClose={() => setRecipeItem(null)} />
        )}
      </div>
    </div>
  );
}
