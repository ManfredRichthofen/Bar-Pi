package router_test

import (
	"encoding/json"
	"net/http"
	"strconv"
	"testing"
)

func TestEventActionCRUD(t *testing.T) {
	srv := setupTestServer(t)
	admin := loginToken(t, srv, "admin", "admin")

	res := doJSONRequest(t, srv, http.MethodPost, "/api/user/", admin, map[string]any{
		"userDto": map[string]any{"username": "guest", "password": "secret123", "adminLevel": 0, "accountNonLocked": true},
	})
	if res.Code != http.StatusCreated {
		t.Fatalf("create user: %d", res.Code)
	}
	guest := loginToken(t, srv, "guest", "secret123")
	if res = doJSONRequest(t, srv, http.MethodGet, "/api/event/", guest, nil); res.Code != http.StatusForbidden {
		t.Fatalf("non-admin list: expected 403, got %d", res.Code)
	}

	valid := map[string]any{
		"name":           "Light on",
		"trigger":        "COCKTAIL_PRODUCTION_STARTED",
		"pin":            map[string]any{"boardId": 1, "nr": 17},
		"powerStateHigh": true,
		"durationInMs":   500,
	}
	res = doJSONRequest(t, srv, http.MethodPost, "/api/event/", admin, valid)
	if res.Code != http.StatusCreated {
		t.Fatalf("create event: %d %s", res.Code, res.Body.String())
	}
	var created struct {
		ID   int64  `json:"id"`
		Type string `json:"type"`
	}
	_ = json.Unmarshal(res.Body.Bytes(), &created)
	if created.ID == 0 || created.Type != "gpio" {
		t.Fatalf("unexpected created event: %s", res.Body.String())
	}

	bad := map[string]map[string]any{
		"unknown trigger": {"name": "x", "trigger": "NOPE", "pin": valid["pin"]},
		"blank name":      {"name": " ", "trigger": "COCKTAIL_PRODUCTION_STARTED", "pin": valid["pin"]},
		"missing pin":     {"name": "x", "trigger": "COCKTAIL_PRODUCTION_STARTED"},
		"unknown pin":     {"name": "x", "trigger": "COCKTAIL_PRODUCTION_STARTED", "pin": map[string]any{"boardId": 1, "nr": 999}},
		"negative time":   {"name": "x", "trigger": "COCKTAIL_PRODUCTION_STARTED", "pin": valid["pin"], "durationInMs": -1},
		"unknown recipe":  {"name": "x", "trigger": "COCKTAIL_PRODUCTION_STARTED", "pin": valid["pin"], "recipeId": 9999},
	}
	for name, body := range bad {
		if res = doJSONRequest(t, srv, http.MethodPost, "/api/event/", admin, body); res.Code != http.StatusBadRequest {
			t.Fatalf("%s: expected 400, got %d %s", name, res.Code, res.Body.String())
		}
	}

	path := "/api/event/" + strconv.FormatInt(created.ID, 10)
	valid["name"] = "Light off"
	if res = doJSONRequest(t, srv, http.MethodPut, path, admin, valid); res.Code != http.StatusOK {
		t.Fatalf("update: %d %s", res.Code, res.Body.String())
	}

	// A pin used by an event shows as in use on its board.
	res = doJSONRequest(t, srv, http.MethodGet, "/api/gpio/1/pin", admin, nil)
	var pins []struct {
		Nr    int  `json:"nr"`
		InUse bool `json:"inUse"`
	}
	_ = json.Unmarshal(res.Body.Bytes(), &pins)
	inUse := false
	for _, p := range pins {
		if p.Nr == 17 {
			inUse = p.InUse
		}
	}
	if !inUse {
		t.Fatalf("pin 17 should be in use by the event")
	}

	if res = doJSONRequest(t, srv, http.MethodPost, path+"/run", admin, nil); res.Code != http.StatusOK {
		t.Fatalf("run: %d %s", res.Code, res.Body.String())
	}
	if res = doJSONRequest(t, srv, http.MethodDelete, path, admin, nil); res.Code != http.StatusOK {
		t.Fatalf("delete: %d", res.Code)
	}
	if res = doJSONRequest(t, srv, http.MethodGet, path, admin, nil); res.Code != http.StatusNotFound {
		t.Fatalf("get deleted: expected 404, got %d", res.Code)
	}
}
