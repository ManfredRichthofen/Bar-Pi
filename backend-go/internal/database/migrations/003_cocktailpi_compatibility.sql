-- +goose Up
-- +goose StatementBegin
ALTER TABLE glasses ADD COLUMN description TEXT DEFAULT '';
ALTER TABLE glasses ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE glasses ADD COLUMN use_for_single_ingredients BOOLEAN NOT NULL DEFAULT 0;

ALTER TABLE recipes ADD COLUMN default_amount_to_fill INTEGER NOT NULL DEFAULT 250;

ALTER TABLE pumps ADD COLUMN power_consumption INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pumps ADD COLUMN minimal_wait_time INTEGER;

-- Seed default local Raspberry Pi GPIO board and pins 0..27 if none exist
INSERT INTO gpio_boards (id, name, dtype)
SELECT 1, 'Raspberry Pi Local', 'local'
WHERE NOT EXISTS (SELECT 1 FROM gpio_boards WHERE id = 1);

INSERT OR IGNORE INTO gpio_pins (board, pin_nr) VALUES
    (1, 0), (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
    (1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15),
    (1, 16), (1, 17), (1, 18), (1, 19), (1, 20), (1, 21), (1, 22), (1, 23),
    (1, 24), (1, 25), (1, 26), (1, 27);

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT NOT NULL PRIMARY KEY,
    value TEXT NOT NULL
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS system_settings;
-- +goose StatementEnd
