-- +goose Up
-- +goose StatementBegin
CREATE TABLE users (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    is_account_non_locked BOOLEAN NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE gpio_boards (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    dtype TEXT NOT NULL,
    board_model TEXT,
    i2c_address INTEGER,
    CHECK (dtype != 'i2c' OR board_model IS NOT NULL),
    CHECK (dtype != 'i2c' OR i2c_address IS NOT NULL)
);

CREATE TABLE gpio_pins (
    pin_nr INTEGER NOT NULL,
    board INTEGER NOT NULL REFERENCES gpio_boards ON DELETE CASCADE,
    PRIMARY KEY (board, pin_nr)
);

CREATE TABLE ingredients (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    dtype TEXT NOT NULL,
    name TEXT NOT NULL UNIQUE,
    alcohol_content INTEGER,
    parent_group_id INTEGER REFERENCES ingredients ON DELETE SET NULL,
    bottle_size INTEGER,
    unit TEXT,
    in_bar BOOLEAN,
    pump_time_multiplier REAL,
    has_image BOOLEAN NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    CHECK (dtype != 'AutomatedIngredient' OR bottle_size IS NOT NULL),
    CHECK (alcohol_content BETWEEN 0 AND 100 OR alcohol_content IS NULL),
    CHECK (dtype != 'AutomatedIngredient' OR pump_time_multiplier IS NOT NULL),
    CHECK (parent_group_id != id)
);

CREATE TABLE pumps (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    dtype TEXT NOT NULL,
    name TEXT UNIQUE,
    completed BOOLEAN NOT NULL DEFAULT 1,
    tube_capacity REAL,
    current_ingredient_id INTEGER REFERENCES ingredients ON DELETE SET NULL,
    filling_level_in_ml INTEGER NOT NULL DEFAULT 0,
    is_pumped_up BOOLEAN NOT NULL DEFAULT 0,
    dc_pin_board INTEGER,
    dc_pin_nr INTEGER,
    time_per_cl_in_ms INTEGER,
    is_power_state_high BOOLEAN,
    acceleration INTEGER,
    step_pin_board INTEGER,
    step_pin_nr INTEGER,
    enable_pin_board INTEGER,
    enable_pin_nr INTEGER,
    steps_per_cl INTEGER,
    max_steps_per_second INTEGER,
    CHECK (tube_capacity >= 0 OR tube_capacity IS NULL),
    CHECK (filling_level_in_ml >= 0),
    CHECK (time_per_cl_in_ms >= 1 OR time_per_cl_in_ms IS NULL),
    CHECK (acceleration BETWEEN 1 AND 500000 OR acceleration IS NULL),
    CHECK (steps_per_cl >= 1 OR steps_per_cl IS NULL),
    CHECK (max_steps_per_second BETWEEN 1 AND 500000 OR max_steps_per_second IS NULL),
    FOREIGN KEY (dc_pin_board, dc_pin_nr) REFERENCES gpio_pins ON DELETE RESTRICT,
    FOREIGN KEY (step_pin_board, step_pin_nr) REFERENCES gpio_pins ON DELETE RESTRICT,
    FOREIGN KEY (enable_pin_board, enable_pin_nr) REFERENCES gpio_pins ON DELETE RESTRICT
);

CREATE TABLE glasses (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    size INTEGER NOT NULL,
    CHECK (size BETWEEN 10 AND 5000)
);

CREATE TABLE recipes (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    has_image BOOLEAN NOT NULL DEFAULT 0,
    owner_id INTEGER NOT NULL REFERENCES users ON DELETE CASCADE,
    glass_id INTEGER REFERENCES glasses ON DELETE SET NULL,
    last_update INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE production_steps (
    recipe_id INTEGER NOT NULL REFERENCES recipes ON DELETE CASCADE,
    dtype TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    message TEXT,
    CHECK (dtype != 'WrittenInstruction' OR (message IS NOT NULL AND length(message) > 0)),
    PRIMARY KEY (recipe_id, step_order)
);

CREATE TABLE production_step_ingredients (
    recipe_id INTEGER NOT NULL,
    step_order INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    scale REAL NOT NULL DEFAULT 1.0,
    boostable BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (recipe_id, step_order) REFERENCES production_steps ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, step_order, ingredient_id)
);

CREATE TABLE categories (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE recipe_categories (
    recipe_id INTEGER NOT NULL REFERENCES recipes ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, category_id)
);

CREATE TABLE collections (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL REFERENCES users ON DELETE CASCADE,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE collection_recipes (
    collection_id INTEGER NOT NULL REFERENCES collections ON DELETE CASCADE,
    recipe_id INTEGER NOT NULL REFERENCES recipes ON DELETE CASCADE,
    PRIMARY KEY (collection_id, recipe_id)
);

CREATE TABLE load_cells (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    pin_dt_board INTEGER NOT NULL,
    pin_dt_nr INTEGER NOT NULL,
    pin_sck_board INTEGER NOT NULL,
    pin_sck_nr INTEGER NOT NULL,
    reference_unit REAL NOT NULL,
    offset REAL NOT NULL,
    FOREIGN KEY (pin_dt_board, pin_dt_nr) REFERENCES gpio_pins ON DELETE RESTRICT,
    FOREIGN KEY (pin_sck_board, pin_sck_nr) REFERENCES gpio_pins ON DELETE RESTRICT
);

CREATE TABLE event_actions (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    dtype TEXT NOT NULL,
    name TEXT NOT NULL,
    event_trigger TEXT NOT NULL,
    recipe_id INTEGER REFERENCES recipes ON DELETE CASCADE,
    gpio_board INTEGER,
    gpio_pin INTEGER,
    power_state_high BOOLEAN,
    duration_in_ms INTEGER,
    FOREIGN KEY (gpio_board, gpio_pin) REFERENCES gpio_pins ON DELETE RESTRICT
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_recipes_owner ON recipes(owner_id);
CREATE INDEX idx_recipes_glass ON recipes(glass_id);
CREATE INDEX idx_ingredients_parent_group ON ingredients(parent_group_id);
CREATE INDEX idx_pumps_ingredient ON pumps(current_ingredient_id);
CREATE INDEX idx_production_steps_recipe ON production_steps(recipe_id);
CREATE INDEX idx_production_step_ingredients_ingredient ON production_step_ingredients(ingredient_id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_production_step_ingredients_ingredient;
DROP INDEX IF EXISTS idx_production_steps_recipe;
DROP INDEX IF EXISTS idx_pumps_ingredient;
DROP INDEX IF EXISTS idx_ingredients_parent_group;
DROP INDEX IF EXISTS idx_recipes_glass;
DROP INDEX IF EXISTS idx_recipes_owner;
DROP INDEX IF EXISTS idx_users_username;
DROP TABLE IF EXISTS event_actions;
DROP TABLE IF EXISTS load_cells;
DROP TABLE IF EXISTS collection_recipes;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS recipe_categories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS production_step_ingredients;
DROP TABLE IF EXISTS production_steps;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS glasses;
DROP TABLE IF EXISTS pumps;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS gpio_pins;
DROP TABLE IF EXISTS gpio_boards;
DROP TABLE IF EXISTS users;
-- +goose StatementEnd
