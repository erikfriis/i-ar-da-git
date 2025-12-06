/**
 * Category definitions for the trivia game
 * Each category has a unique ID, display color, and label
 */

export interface Category {
  id: string;
  color: string;
  label: string;
}

export const categories: Category[] = [
  {
    id: "prylar",
    color: "#F7D358",
    label: "Prylar, nyheter och uppfinningar",
  },
  {
    id: "personer",
    color: "#8BC6FF",
    label: "Kända personer och händelser",
  },
  {
    id: "underhallning",
    color: "#B57EDC",
    label: "Underhållning",
  },
  {
    id: "blandat",
    color: "#7AD17A",
    label: "Sport, fritid och blandat",
  },
];

/**
 * Get a category by its ID
 */
export const getCategoryById = (id: string): Category | undefined => {
  return categories.find((cat) => cat.id === id);
};

/**
 * Get a random category
 */
export const getRandomCategory = (): Category => {
  const randomIndex = Math.floor(Math.random() * categories.length);
  return categories[randomIndex];
};

