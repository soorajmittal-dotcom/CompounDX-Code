import { RECIPES } from '../data/recipes';

export default function RecipeModal({ item, onClose }) {
  const recipe = RECIPES[item.name];

  if (!recipe) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>x</button>
          <h2>{item.name}</h2>
          <p className="recipe-desc">{item.description}</p>
          <div className="recipe-meta-bar">
            <span>Prep: {item.prepTime}m</span>
            <span>Difficulty: {item.difficulty}</span>
            {item.veg && <span className="veg-badge">VEG</span>}
          </div>
          <p className="recipe-no-detail">Detailed recipe coming soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>x</button>
        <h2>{item.name}</h2>
        <p className="recipe-desc">{item.description}</p>
        <div className="recipe-meta-bar">
          <span>Prep: {item.prepTime}m</span>
          <span>Difficulty: {item.difficulty}</span>
          <span>Serves: {recipe.servings}</span>
          {item.veg && <span className="veg-badge">VEG</span>}
        </div>

        <div className="recipe-section">
          <h3>Ingredients</h3>
          <ul className="recipe-ingredients">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
        </div>

        <div className="recipe-section">
          <h3>Instructions</h3>
          <ol className="recipe-steps">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        {recipe.tips && (
          <div className="recipe-tips">
            <strong>Pro Tip:</strong> {recipe.tips}
          </div>
        )}
      </div>
    </div>
  );
}
