export const MENU_DATABASE = {
  indian: {
    starters: [
      { name: 'Samosa', costPerServing: 1.5, prepTime: 45, difficulty: 'medium', veg: true, description: 'Crispy pastry filled with spiced potatoes' },
      { name: 'Paneer Tikka', costPerServing: 2.5, prepTime: 30, difficulty: 'easy', veg: true, description: 'Grilled cottage cheese with spices' },
      { name: 'Chicken Tikka', costPerServing: 3, prepTime: 40, difficulty: 'medium', veg: false, description: 'Marinated grilled chicken pieces' },
      { name: 'Onion Bhaji', costPerServing: 1, prepTime: 20, difficulty: 'easy', veg: true, description: 'Crispy onion fritters' },
      { name: 'Spring Rolls', costPerServing: 1.5, prepTime: 35, difficulty: 'medium', veg: true, description: 'Vegetable filled crispy rolls' },
      { name: 'Seekh Kebab', costPerServing: 3.5, prepTime: 50, difficulty: 'hard', veg: false, description: 'Minced meat skewers' },
    ],
    mains: [
      { name: 'Butter Chicken', costPerServing: 4, prepTime: 60, difficulty: 'medium', veg: false, description: 'Creamy tomato-based chicken curry' },
      { name: 'Dal Makhani', costPerServing: 2, prepTime: 90, difficulty: 'medium', veg: true, description: 'Rich black lentil curry' },
      { name: 'Biryani', costPerServing: 3.5, prepTime: 75, difficulty: 'hard', veg: false, description: 'Fragrant layered rice and meat dish' },
      { name: 'Palak Paneer', costPerServing: 2.5, prepTime: 40, difficulty: 'easy', veg: true, description: 'Spinach and cottage cheese curry' },
      { name: 'Chole Bhature', costPerServing: 2, prepTime: 50, difficulty: 'medium', veg: true, description: 'Spicy chickpeas with fried bread' },
      { name: 'Rogan Josh', costPerServing: 4.5, prepTime: 80, difficulty: 'hard', veg: false, description: 'Kashmiri-style lamb curry' },
    ],
    sides: [
      { name: 'Naan Bread', costPerServing: 0.5, prepTime: 20, difficulty: 'medium', veg: true, description: 'Tandoor-baked flatbread' },
      { name: 'Jeera Rice', costPerServing: 0.8, prepTime: 25, difficulty: 'easy', veg: true, description: 'Cumin-flavored basmati rice' },
      { name: 'Raita', costPerServing: 0.5, prepTime: 10, difficulty: 'easy', veg: true, description: 'Yogurt with cucumber and spices' },
      { name: 'Papad', costPerServing: 0.3, prepTime: 5, difficulty: 'easy', veg: true, description: 'Crispy lentil wafers' },
    ],
    desserts: [
      { name: 'Gulab Jamun', costPerServing: 1.5, prepTime: 45, difficulty: 'medium', veg: true, description: 'Fried milk dumplings in syrup' },
      { name: 'Kheer', costPerServing: 1, prepTime: 40, difficulty: 'easy', veg: true, description: 'Rice pudding with cardamom' },
      { name: 'Jalebi', costPerServing: 1, prepTime: 30, difficulty: 'hard', veg: true, description: 'Crispy sweet spirals' },
      { name: 'Rasmalai', costPerServing: 2, prepTime: 60, difficulty: 'hard', veg: true, description: 'Soft paneer in sweet milk' },
    ],
  },
  italian: {
    starters: [
      { name: 'Bruschetta', costPerServing: 1.5, prepTime: 15, difficulty: 'easy', veg: true, description: 'Toasted bread with tomato basil' },
      { name: 'Caprese Salad', costPerServing: 2.5, prepTime: 10, difficulty: 'easy', veg: true, description: 'Mozzarella, tomato, and basil' },
      { name: 'Arancini', costPerServing: 2, prepTime: 45, difficulty: 'medium', veg: true, description: 'Fried risotto balls' },
      { name: 'Antipasto Platter', costPerServing: 4, prepTime: 15, difficulty: 'easy', veg: false, description: 'Cured meats, cheese, olives' },
    ],
    mains: [
      { name: 'Lasagna', costPerServing: 3.5, prepTime: 90, difficulty: 'medium', veg: false, description: 'Layered pasta with meat sauce' },
      { name: 'Margherita Pizza', costPerServing: 2.5, prepTime: 30, difficulty: 'medium', veg: true, description: 'Classic tomato and mozzarella pizza' },
      { name: 'Penne Arrabbiata', costPerServing: 2, prepTime: 25, difficulty: 'easy', veg: true, description: 'Spicy tomato pasta' },
      { name: 'Chicken Parmigiana', costPerServing: 4, prepTime: 45, difficulty: 'medium', veg: false, description: 'Breaded chicken with marinara' },
      { name: 'Risotto Mushroom', costPerServing: 3, prepTime: 40, difficulty: 'medium', veg: true, description: 'Creamy mushroom risotto' },
    ],
    sides: [
      { name: 'Garlic Bread', costPerServing: 1, prepTime: 15, difficulty: 'easy', veg: true, description: 'Toasted bread with garlic butter' },
      { name: 'Caesar Salad', costPerServing: 1.5, prepTime: 10, difficulty: 'easy', veg: false, description: 'Romaine lettuce with Caesar dressing' },
      { name: 'Focaccia', costPerServing: 1, prepTime: 30, difficulty: 'medium', veg: true, description: 'Herb-topped Italian flatbread' },
    ],
    desserts: [
      { name: 'Tiramisu', costPerServing: 2.5, prepTime: 30, difficulty: 'medium', veg: true, description: 'Coffee-flavored layered dessert' },
      { name: 'Panna Cotta', costPerServing: 2, prepTime: 20, difficulty: 'easy', veg: true, description: 'Vanilla cream dessert' },
      { name: 'Cannoli', costPerServing: 2, prepTime: 45, difficulty: 'hard', veg: true, description: 'Crispy shells with ricotta filling' },
    ],
  },
  mexican: {
    starters: [
      { name: 'Guacamole & Chips', costPerServing: 2, prepTime: 15, difficulty: 'easy', veg: true, description: 'Fresh avocado dip with tortilla chips' },
      { name: 'Nachos Supreme', costPerServing: 2.5, prepTime: 20, difficulty: 'easy', veg: false, description: 'Loaded tortilla chips' },
      { name: 'Elote (Street Corn)', costPerServing: 1.5, prepTime: 15, difficulty: 'easy', veg: true, description: 'Grilled corn with mayo and cheese' },
      { name: 'Queso Fundido', costPerServing: 2, prepTime: 20, difficulty: 'easy', veg: true, description: 'Melted cheese dip with peppers' },
    ],
    mains: [
      { name: 'Tacos al Pastor', costPerServing: 3, prepTime: 40, difficulty: 'medium', veg: false, description: 'Marinated pork tacos' },
      { name: 'Chicken Enchiladas', costPerServing: 3, prepTime: 45, difficulty: 'medium', veg: false, description: 'Rolled tortillas in chili sauce' },
      { name: 'Bean Burritos', costPerServing: 2, prepTime: 25, difficulty: 'easy', veg: true, description: 'Flour tortilla with beans and rice' },
      { name: 'Chicken Quesadillas', costPerServing: 2.5, prepTime: 20, difficulty: 'easy', veg: false, description: 'Grilled tortilla with chicken and cheese' },
      { name: 'Carnitas', costPerServing: 4, prepTime: 120, difficulty: 'hard', veg: false, description: 'Slow-cooked pulled pork' },
    ],
    sides: [
      { name: 'Mexican Rice', costPerServing: 0.8, prepTime: 25, difficulty: 'easy', veg: true, description: 'Tomato-flavored rice' },
      { name: 'Refried Beans', costPerServing: 0.5, prepTime: 20, difficulty: 'easy', veg: true, description: 'Creamy mashed pinto beans' },
      { name: 'Pico de Gallo', costPerServing: 0.5, prepTime: 10, difficulty: 'easy', veg: true, description: 'Fresh tomato salsa' },
    ],
    desserts: [
      { name: 'Churros', costPerServing: 1.5, prepTime: 30, difficulty: 'medium', veg: true, description: 'Fried dough with cinnamon sugar' },
      { name: 'Tres Leches Cake', costPerServing: 2, prepTime: 60, difficulty: 'medium', veg: true, description: 'Three-milk soaked sponge cake' },
      { name: 'Flan', costPerServing: 1.5, prepTime: 50, difficulty: 'medium', veg: true, description: 'Caramel custard' },
    ],
  },
  chinese: {
    starters: [
      { name: 'Spring Rolls', costPerServing: 1.5, prepTime: 30, difficulty: 'medium', veg: true, description: 'Crispy vegetable rolls' },
      { name: 'Dumplings', costPerServing: 2, prepTime: 45, difficulty: 'hard', veg: false, description: 'Steamed or fried dumplings' },
      { name: 'Wonton Soup', costPerServing: 1.5, prepTime: 35, difficulty: 'medium', veg: false, description: 'Pork wontons in clear broth' },
      { name: 'Crispy Tofu', costPerServing: 1.5, prepTime: 20, difficulty: 'easy', veg: true, description: 'Golden fried tofu cubes' },
    ],
    mains: [
      { name: 'Kung Pao Chicken', costPerServing: 3, prepTime: 30, difficulty: 'medium', veg: false, description: 'Spicy chicken with peanuts' },
      { name: 'Mapo Tofu', costPerServing: 2, prepTime: 25, difficulty: 'medium', veg: true, description: 'Spicy tofu in chili bean sauce' },
      { name: 'Sweet & Sour Pork', costPerServing: 3, prepTime: 35, difficulty: 'medium', veg: false, description: 'Battered pork in sweet-sour sauce' },
      { name: 'Chow Mein', costPerServing: 2, prepTime: 25, difficulty: 'easy', veg: true, description: 'Stir-fried noodles with vegetables' },
      { name: 'Orange Chicken', costPerServing: 3, prepTime: 35, difficulty: 'medium', veg: false, description: 'Crispy chicken in orange glaze' },
    ],
    sides: [
      { name: 'Fried Rice', costPerServing: 1, prepTime: 20, difficulty: 'easy', veg: true, description: 'Wok-fried rice with vegetables' },
      { name: 'Steamed Jasmine Rice', costPerServing: 0.5, prepTime: 20, difficulty: 'easy', veg: true, description: 'Fragrant steamed rice' },
      { name: 'Stir-Fried Greens', costPerServing: 1, prepTime: 10, difficulty: 'easy', veg: true, description: 'Garlic sautéed Chinese greens' },
    ],
    desserts: [
      { name: 'Mango Pudding', costPerServing: 1.5, prepTime: 15, difficulty: 'easy', veg: true, description: 'Chilled mango dessert' },
      { name: 'Sesame Balls', costPerServing: 1, prepTime: 40, difficulty: 'hard', veg: true, description: 'Fried glutinous rice balls' },
      { name: 'Egg Tarts', costPerServing: 1.5, prepTime: 50, difficulty: 'medium', veg: true, description: 'Flaky pastry with egg custard' },
    ],
  },
  japanese: {
    starters: [
      { name: 'Edamame', costPerServing: 1, prepTime: 10, difficulty: 'easy', veg: true, description: 'Steamed salted soybeans' },
      { name: 'Gyoza', costPerServing: 2, prepTime: 35, difficulty: 'medium', veg: false, description: 'Pan-fried dumplings' },
      { name: 'Miso Soup', costPerServing: 1, prepTime: 15, difficulty: 'easy', veg: true, description: 'Traditional soybean paste soup' },
      { name: 'Agedashi Tofu', costPerServing: 1.5, prepTime: 20, difficulty: 'medium', veg: true, description: 'Deep-fried tofu in dashi' },
    ],
    mains: [
      { name: 'Chicken Teriyaki', costPerServing: 3, prepTime: 30, difficulty: 'easy', veg: false, description: 'Glazed grilled chicken' },
      { name: 'Sushi Platter', costPerServing: 5, prepTime: 60, difficulty: 'hard', veg: false, description: 'Assorted nigiri and maki rolls' },
      { name: 'Ramen', costPerServing: 3, prepTime: 120, difficulty: 'hard', veg: false, description: 'Rich broth noodle soup' },
      { name: 'Katsu Curry', costPerServing: 3.5, prepTime: 45, difficulty: 'medium', veg: false, description: 'Breaded cutlet with curry sauce' },
      { name: 'Vegetable Tempura', costPerServing: 2.5, prepTime: 25, difficulty: 'medium', veg: true, description: 'Light battered fried vegetables' },
    ],
    sides: [
      { name: 'Steamed Rice', costPerServing: 0.5, prepTime: 20, difficulty: 'easy', veg: true, description: 'Short-grain Japanese rice' },
      { name: 'Seaweed Salad', costPerServing: 1.5, prepTime: 10, difficulty: 'easy', veg: true, description: 'Seasoned wakame seaweed' },
      { name: 'Pickled Vegetables', costPerServing: 0.5, prepTime: 5, difficulty: 'easy', veg: true, description: 'Assorted Japanese pickles' },
    ],
    desserts: [
      { name: 'Mochi', costPerServing: 2, prepTime: 30, difficulty: 'medium', veg: true, description: 'Rice cake with sweet filling' },
      { name: 'Matcha Ice Cream', costPerServing: 2, prepTime: 15, difficulty: 'easy', veg: true, description: 'Green tea ice cream' },
      { name: 'Dorayaki', costPerServing: 1.5, prepTime: 25, difficulty: 'medium', veg: true, description: 'Red bean pancakes' },
    ],
  },
  american: {
    starters: [
      { name: 'Buffalo Wings', costPerServing: 2.5, prepTime: 35, difficulty: 'easy', veg: false, description: 'Spicy fried chicken wings' },
      { name: 'Loaded Potato Skins', costPerServing: 2, prepTime: 40, difficulty: 'medium', veg: false, description: 'Baked potato with cheese and bacon' },
      { name: 'Spinach Artichoke Dip', costPerServing: 1.5, prepTime: 25, difficulty: 'easy', veg: true, description: 'Creamy hot cheese dip' },
      { name: 'Mozzarella Sticks', costPerServing: 1.5, prepTime: 20, difficulty: 'easy', veg: true, description: 'Breaded fried mozzarella' },
    ],
    mains: [
      { name: 'Gourmet Burgers', costPerServing: 4, prepTime: 30, difficulty: 'easy', veg: false, description: 'Custom built premium burgers' },
      { name: 'BBQ Ribs', costPerServing: 5, prepTime: 180, difficulty: 'hard', veg: false, description: 'Slow-cooked glazed ribs' },
      { name: 'Mac & Cheese', costPerServing: 2, prepTime: 35, difficulty: 'easy', veg: true, description: 'Baked creamy pasta' },
      { name: 'Pulled Pork Sliders', costPerServing: 3, prepTime: 120, difficulty: 'medium', veg: false, description: 'Slow-cooked pork on mini buns' },
      { name: 'Grilled Chicken Caesar', costPerServing: 3, prepTime: 25, difficulty: 'easy', veg: false, description: 'Grilled chicken on Caesar salad' },
    ],
    sides: [
      { name: 'Coleslaw', costPerServing: 0.8, prepTime: 15, difficulty: 'easy', veg: true, description: 'Creamy cabbage salad' },
      { name: 'Corn on the Cob', costPerServing: 0.8, prepTime: 15, difficulty: 'easy', veg: true, description: 'Buttered grilled corn' },
      { name: 'Fries', costPerServing: 1, prepTime: 25, difficulty: 'easy', veg: true, description: 'Crispy golden french fries' },
    ],
    desserts: [
      { name: 'Brownies', costPerServing: 1.5, prepTime: 35, difficulty: 'easy', veg: true, description: 'Rich chocolate brownies' },
      { name: 'Apple Pie', costPerServing: 2, prepTime: 60, difficulty: 'medium', veg: true, description: 'Classic American apple pie' },
      { name: 'Cheesecake', costPerServing: 2.5, prepTime: 70, difficulty: 'medium', veg: true, description: 'New York style cheesecake' },
    ],
  },
  mediterranean: {
    starters: [
      { name: 'Hummus & Pita', costPerServing: 1.5, prepTime: 15, difficulty: 'easy', veg: true, description: 'Chickpea dip with flatbread' },
      { name: 'Falafel', costPerServing: 1.5, prepTime: 30, difficulty: 'medium', veg: true, description: 'Fried chickpea patties' },
      { name: 'Tabbouleh', costPerServing: 1, prepTime: 15, difficulty: 'easy', veg: true, description: 'Bulgur wheat parsley salad' },
      { name: 'Stuffed Grape Leaves', costPerServing: 2, prepTime: 45, difficulty: 'medium', veg: true, description: 'Rice-stuffed grape leaves' },
    ],
    mains: [
      { name: 'Chicken Shawarma', costPerServing: 3, prepTime: 40, difficulty: 'medium', veg: false, description: 'Spiced rotisserie chicken' },
      { name: 'Moussaka', costPerServing: 3.5, prepTime: 75, difficulty: 'hard', veg: false, description: 'Layered eggplant and meat casserole' },
      { name: 'Grilled Lamb Kofta', costPerServing: 4, prepTime: 35, difficulty: 'medium', veg: false, description: 'Spiced lamb skewers' },
      { name: 'Vegetable Tagine', costPerServing: 2.5, prepTime: 50, difficulty: 'medium', veg: true, description: 'Moroccan-style stewed vegetables' },
    ],
    sides: [
      { name: 'Greek Salad', costPerServing: 1.5, prepTime: 10, difficulty: 'easy', veg: true, description: 'Tomato, cucumber, feta, olives' },
      { name: 'Couscous', costPerServing: 0.8, prepTime: 15, difficulty: 'easy', veg: true, description: 'Fluffy steamed couscous' },
      { name: 'Baba Ganoush', costPerServing: 1.5, prepTime: 25, difficulty: 'easy', veg: true, description: 'Smoky eggplant dip' },
    ],
    desserts: [
      { name: 'Baklava', costPerServing: 2, prepTime: 60, difficulty: 'hard', veg: true, description: 'Layered pastry with nuts and honey' },
      { name: 'Turkish Delight', costPerServing: 1.5, prepTime: 45, difficulty: 'medium', veg: true, description: 'Rosewater flavored gelatin candy' },
      { name: 'Kunafa', costPerServing: 2.5, prepTime: 50, difficulty: 'hard', veg: true, description: 'Shredded pastry with cheese and syrup' },
    ],
  },
  thai: {
    starters: [
      { name: 'Satay Skewers', costPerServing: 2, prepTime: 30, difficulty: 'easy', veg: false, description: 'Grilled meat with peanut sauce' },
      { name: 'Tom Yum Soup', costPerServing: 1.5, prepTime: 20, difficulty: 'medium', veg: false, description: 'Hot and sour shrimp soup' },
      { name: 'Thai Fish Cakes', costPerServing: 2, prepTime: 25, difficulty: 'medium', veg: false, description: 'Spicy fish patties' },
      { name: 'Fresh Spring Rolls', costPerServing: 1.5, prepTime: 20, difficulty: 'easy', veg: true, description: 'Rice paper rolls with vegetables' },
    ],
    mains: [
      { name: 'Green Curry', costPerServing: 3, prepTime: 35, difficulty: 'medium', veg: false, description: 'Coconut-based green curry' },
      { name: 'Pad Thai', costPerServing: 2.5, prepTime: 25, difficulty: 'medium', veg: false, description: 'Stir-fried rice noodles' },
      { name: 'Massaman Curry', costPerServing: 3.5, prepTime: 50, difficulty: 'medium', veg: false, description: 'Rich peanut-based curry' },
      { name: 'Thai Basil Stir Fry', costPerServing: 2.5, prepTime: 20, difficulty: 'easy', veg: true, description: 'Vegetables with holy basil' },
    ],
    sides: [
      { name: 'Jasmine Rice', costPerServing: 0.5, prepTime: 20, difficulty: 'easy', veg: true, description: 'Steamed Thai jasmine rice' },
      { name: 'Papaya Salad', costPerServing: 1.5, prepTime: 15, difficulty: 'easy', veg: true, description: 'Spicy shredded green papaya' },
      { name: 'Sticky Rice', costPerServing: 0.5, prepTime: 30, difficulty: 'easy', veg: true, description: 'Steamed glutinous rice' },
    ],
    desserts: [
      { name: 'Mango Sticky Rice', costPerServing: 2, prepTime: 30, difficulty: 'easy', veg: true, description: 'Sweet rice with fresh mango' },
      { name: 'Thai Tea Panna Cotta', costPerServing: 2, prepTime: 25, difficulty: 'medium', veg: true, description: 'Thai tea flavored custard' },
      { name: 'Coconut Ice Cream', costPerServing: 1.5, prepTime: 10, difficulty: 'easy', veg: true, description: 'Creamy coconut ice cream' },
    ],
  },
  fusion: {
    starters: [
      { name: 'Korean Fried Cauliflower', costPerServing: 2, prepTime: 25, difficulty: 'easy', veg: true, description: 'Crispy cauliflower in gochujang glaze' },
      { name: 'Tuna Tartare Tacos', costPerServing: 3.5, prepTime: 20, difficulty: 'medium', veg: false, description: 'Raw tuna in wonton shells' },
      { name: 'Tandoori Chicken Sliders', costPerServing: 2.5, prepTime: 30, difficulty: 'medium', veg: false, description: 'Mini tandoori chicken burgers' },
    ],
    mains: [
      { name: 'Butter Chicken Pizza', costPerServing: 3.5, prepTime: 35, difficulty: 'medium', veg: false, description: 'Pizza with butter chicken topping' },
      { name: 'Sushi Burrito', costPerServing: 4, prepTime: 30, difficulty: 'medium', veg: false, description: 'Giant sushi roll burrito-style' },
      { name: 'Tikka Masala Pasta', costPerServing: 3, prepTime: 30, difficulty: 'easy', veg: true, description: 'Pasta in tikka masala sauce' },
      { name: 'Thai Basil Burger', costPerServing: 3.5, prepTime: 25, difficulty: 'medium', veg: false, description: 'Burger with Thai basil and sriracha' },
    ],
    sides: [
      { name: 'Kimchi Fries', costPerServing: 2, prepTime: 20, difficulty: 'easy', veg: true, description: 'Fries topped with kimchi and cheese' },
      { name: 'Miso Caesar Salad', costPerServing: 1.5, prepTime: 10, difficulty: 'easy', veg: true, description: 'Caesar with miso dressing' },
    ],
    desserts: [
      { name: 'Matcha Tiramisu', costPerServing: 2.5, prepTime: 35, difficulty: 'medium', veg: true, description: 'Green tea tiramisu' },
      { name: 'Churro Ice Cream Sandwich', costPerServing: 2, prepTime: 40, difficulty: 'medium', veg: true, description: 'Ice cream between churro halves' },
    ],
  },
};

export const DRINKS = {
  nonAlcoholic: [
    { name: 'Fresh Lemonade', costPerServing: 1, prepTime: 10, description: 'Classic fresh-squeezed lemonade' },
    { name: 'Iced Tea', costPerServing: 0.5, prepTime: 15, description: 'Brewed and chilled tea' },
    { name: 'Mango Lassi', costPerServing: 1.5, prepTime: 5, description: 'Yogurt-based mango smoothie' },
    { name: 'Virgin Mojito', costPerServing: 1.5, prepTime: 5, description: 'Mint and lime refresher' },
    { name: 'Fruit Punch', costPerServing: 1, prepTime: 10, description: 'Mixed fruit juice punch' },
    { name: 'Sparkling Water Bar', costPerServing: 0.5, prepTime: 5, description: 'Flavored sparkling water station' },
    { name: 'Hot Chocolate', costPerServing: 1, prepTime: 10, description: 'Rich creamy hot chocolate' },
    { name: 'Chai Tea', costPerServing: 0.5, prepTime: 10, description: 'Spiced Indian tea' },
  ],
  alcoholic: [
    { name: 'Sangria Pitcher', costPerServing: 2.5, prepTime: 15, description: 'Red wine with fruits' },
    { name: 'Margarita Station', costPerServing: 3, prepTime: 10, description: 'Classic lime margaritas' },
    { name: 'Beer Selection', costPerServing: 2, prepTime: 0, description: 'Assorted craft and domestic beers' },
    { name: 'Wine Selection', costPerServing: 3, prepTime: 0, description: 'Red and white wine options' },
    { name: 'Cocktail Bar', costPerServing: 4, prepTime: 5, description: 'Mixed cocktails station' },
    { name: 'Prosecco & Mimosas', costPerServing: 3, prepTime: 5, description: 'Sparkling wine with juice' },
  ],
};
