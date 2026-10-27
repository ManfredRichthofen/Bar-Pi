-- +goose Up
-- +goose StatementBegin
CREATE TABLE cocktail_orders (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER REFERENCES recipes ON DELETE SET NULL,
    recipe_name TEXT NOT NULL,
    user_id INTEGER REFERENCES users ON DELETE SET NULL,
    username TEXT NOT NULL,
    amount_ordered_ml INTEGER NOT NULL DEFAULT 250,
    status TEXT NOT NULL DEFAULT 'in_progress',
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

CREATE TABLE cocktail_order_ingredients (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES cocktail_orders ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients ON DELETE SET NULL,
    ingredient_name TEXT NOT NULL,
    dtype TEXT NOT NULL DEFAULT 'AutomatedIngredient',
    amount_ml INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_cocktail_orders_recipe ON cocktail_orders(recipe_id);
CREATE INDEX idx_cocktail_orders_user ON cocktail_orders(user_id);
CREATE INDEX idx_cocktail_orders_started_at ON cocktail_orders(started_at);
CREATE INDEX idx_cocktail_orders_status ON cocktail_orders(status);
CREATE INDEX idx_cocktail_order_ingredients_order ON cocktail_order_ingredients(order_id);
CREATE INDEX idx_cocktail_order_ingredients_ingredient ON cocktail_order_ingredients(ingredient_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_cocktail_order_ingredients_ingredient;
DROP INDEX IF EXISTS idx_cocktail_order_ingredients_order;
DROP INDEX IF EXISTS idx_cocktail_orders_status;
DROP INDEX IF EXISTS idx_cocktail_orders_started_at;
DROP INDEX IF EXISTS idx_cocktail_orders_user;
DROP INDEX IF EXISTS idx_cocktail_orders_recipe;
DROP TABLE IF EXISTS cocktail_order_ingredients;
DROP TABLE IF EXISTS cocktail_orders;
-- +goose StatementEnd
