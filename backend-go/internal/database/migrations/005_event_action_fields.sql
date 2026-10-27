-- +goose Up
-- +goose StatementBegin
ALTER TABLE event_actions ADD COLUMN comment TEXT NOT NULL DEFAULT '';
ALTER TABLE event_actions ADD COLUMN url TEXT;
ALTER TABLE event_actions ADD COLUMN request_method TEXT;
ALTER TABLE event_actions ADD COLUMN on_repeat BOOLEAN;
ALTER TABLE event_actions ADD COLUMN sound_device TEXT;
ALTER TABLE event_actions ADD COLUMN volume INTEGER;

CREATE TABLE event_action_groups (
    event_action_id INTEGER NOT NULL REFERENCES event_actions ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    PRIMARY KEY (event_action_id, group_name)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE event_action_groups;
ALTER TABLE event_actions DROP COLUMN volume;
ALTER TABLE event_actions DROP COLUMN sound_device;
ALTER TABLE event_actions DROP COLUMN on_repeat;
ALTER TABLE event_actions DROP COLUMN request_method;
ALTER TABLE event_actions DROP COLUMN url;
ALTER TABLE event_actions DROP COLUMN comment;
-- +goose StatementEnd
