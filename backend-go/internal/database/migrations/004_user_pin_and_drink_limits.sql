-- +goose Up
-- +goose StatementBegin
ALTER TABLE users ADD COLUMN pin_hash TEXT;
ALTER TABLE users ADD COLUMN max_drinks_per_day INTEGER NOT NULL DEFAULT 0;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE users DROP COLUMN pin_hash;
ALTER TABLE users DROP COLUMN max_drinks_per_day;
-- +goose StatementEnd
