package router_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync/atomic"
	"testing"
)

type eventResponse struct {
	ID              int64    `json:"id"`
	Type            string   `json:"type"`
	Comment         string   `json:"comment"`
	Description     string   `json:"description"`
	ExecutionGroups []string `json:"executionGroups"`
}

func decodeEvent(t *testing.T, body []byte) eventResponse {
	t.Helper()
	var e eventResponse
	if err := json.Unmarshal(body, &e); err != nil {
		t.Fatalf("decode event: %v (%s)", err, body)
	}
	return e
}

func TestEventActionAPI(t *testing.T) {
	srv := setupTestServer(t)
	admin := loginToken(t, srv, "admin", "admin")

	res := doJSONRequest(t, srv, http.MethodPost, "/api/user/", admin, map[string]any{
		"userDto": map[string]any{"username": "guest", "password": "secret123", "adminLevel": 0, "accountNonLocked": true},
	})
	if res.Code != http.StatusCreated {
		t.Fatalf("create user: %d", res.Code)
	}
	guest := loginToken(t, srv, "guest", "secret123")
	if res = doJSONRequest(t, srv, http.MethodGet, "/api/eventaction/", guest, nil); res.Code != http.StatusForbidden {
		t.Fatalf("non-admin list: expected 403, got %d", res.Code)
	}

	var hits atomic.Int32
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			hits.Add(1)
		}
	}))
	defer target.Close()

	// CocktailPi sends the DTO as a multipart "eventAction" part.
	res = doMultipartRequest(t, srv, http.MethodPost, "/api/eventaction/", admin, "eventAction", map[string]any{
		"type":            "callUrl",
		"comment":         "Ping",
		"trigger":         "COCKTAIL_PRODUCTION_STARTED",
		"executionGroups": []string{"lights", "notify", "lights", " "},
		"url":             target.URL,
		"requestMethod":   "post",
	})
	if res.Code != http.StatusCreated {
		t.Fatalf("create callUrl: %d %s", res.Code, res.Body.String())
	}
	callURL := decodeEvent(t, res.Body.Bytes())
	if callURL.Type != "callUrl" || len(callURL.ExecutionGroups) != 2 || callURL.Description == "" {
		t.Fatalf("unexpected callUrl event: %s", res.Body.String())
	}

	res = doJSONRequest(t, srv, http.MethodPost, "/api/eventaction/", admin, map[string]any{
		"type":    "gpio",
		"comment": "Light on",
		"trigger": "APPLICATION_STARTUP",
		"pin":     map[string]any{"boardId": 1, "nr": 17},
	})
	if res.Code != http.StatusCreated {
		t.Fatalf("create gpio: %d %s", res.Code, res.Body.String())
	}
	gpio := decodeEvent(t, res.Body.Bytes())

	res = doJSONRequest(t, srv, http.MethodPost, "/api/eventaction/", admin, map[string]any{
		"type": "doNothing", "trigger": "COCKTAIL_PRODUCTION_CANCELED",
	})
	if res.Code != http.StatusCreated {
		t.Fatalf("create doNothing: %d %s", res.Code, res.Body.String())
	}

	pin := map[string]any{"boardId": 1, "nr": 17}
	bad := map[string]map[string]any{
		"unknown trigger":   {"type": "doNothing", "trigger": "NOPE"},
		"old canceled name": {"type": "doNothing", "trigger": "COCKTAIL_PRODUCTION_CANCELLED"},
		"long comment":      {"type": "doNothing", "trigger": "APPLICATION_STARTUP", "comment": "this comment is definitely longer than forty characters"},
		"unknown type":      {"type": "teleport", "trigger": "APPLICATION_STARTUP"},
		"execPy":            {"type": "execPy", "trigger": "APPLICATION_STARTUP"},
		"playAudio":         {"type": "playAudio", "trigger": "APPLICATION_STARTUP"},
		"callUrl no url":    {"type": "callUrl", "trigger": "APPLICATION_STARTUP", "requestMethod": "GET"},
		"callUrl bad url":   {"type": "callUrl", "trigger": "APPLICATION_STARTUP", "requestMethod": "GET", "url": "file:///etc/passwd"},
		"callUrl bad verb":  {"type": "callUrl", "trigger": "APPLICATION_STARTUP", "requestMethod": "PATCH", "url": target.URL},
		"gpio no pin":       {"type": "gpio", "trigger": "APPLICATION_STARTUP"},
		"gpio unknown pin":  {"type": "gpio", "trigger": "APPLICATION_STARTUP", "pin": map[string]any{"boardId": 1, "nr": 999}},
		"gpio negative":     {"type": "gpio", "trigger": "APPLICATION_STARTUP", "pin": pin, "durationInMs": -1},
		"unknown recipe":    {"type": "doNothing", "trigger": "APPLICATION_STARTUP", "recipeId": 9999},
	}
	for name, body := range bad {
		if res = doJSONRequest(t, srv, http.MethodPost, "/api/eventaction/", admin, body); res.Code != http.StatusBadRequest {
			t.Fatalf("%s: expected 400, got %d %s", name, res.Code, res.Body.String())
		}
	}

	res = doJSONRequest(t, srv, http.MethodGet, "/api/eventaction/", admin, nil)
	var all []eventResponse
	_ = json.Unmarshal(res.Body.Bytes(), &all)
	if len(all) != 3 {
		t.Fatalf("expected 3 events, got %d: %s", len(all), res.Body.String())
	}

	res = doJSONRequest(t, srv, http.MethodGet, "/api/eventaction/executiongroup", admin, nil)
	var groups []string
	_ = json.Unmarshal(res.Body.Bytes(), &groups)
	if len(groups) != 2 || groups[0] != "lights" || groups[1] != "notify" {
		t.Fatalf("unexpected execution groups: %s", res.Body.String())
	}

	// Updating replaces the groups.
	path := "/api/eventaction/" + strconv.FormatInt(callURL.ID, 10)
	res = doJSONRequest(t, srv, http.MethodPut, path, admin, map[string]any{
		"type": "callUrl", "comment": "Ping", "trigger": "COCKTAIL_PRODUCTION_STARTED",
		"executionGroups": []string{"notify"}, "url": target.URL, "requestMethod": "POST",
	})
	if res.Code != http.StatusOK {
		t.Fatalf("update: %d %s", res.Code, res.Body.String())
	}
	if e := decodeEvent(t, res.Body.Bytes()); len(e.ExecutionGroups) != 1 || e.ExecutionGroups[0] != "notify" {
		t.Fatalf("groups not replaced: %s", res.Body.String())
	}
	res = doJSONRequest(t, srv, http.MethodGet, "/api/eventaction/executiongroup", admin, nil)
	groups = nil
	_ = json.Unmarshal(res.Body.Bytes(), &groups)
	if len(groups) != 1 || groups[0] != "notify" {
		t.Fatalf("stale execution groups: %s", res.Body.String())
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

	res = doJSONRequest(t, srv, http.MethodPost, path+"/start", admin, nil)
	if res.Code != http.StatusOK || hits.Load() != 1 {
		t.Fatalf("start callUrl: %d, target hit %d times", res.Code, hits.Load())
	}
	// Succeeds with (simulated) GPIO; without hardware, e.g. on CI, it is a clean 400.
	res = doJSONRequest(t, srv, http.MethodPost, "/api/eventaction/"+strconv.FormatInt(gpio.ID, 10)+"/start", admin, nil)
	if res.Code != http.StatusOK && res.Code != http.StatusBadRequest {
		t.Fatalf("start gpio: %d %s", res.Code, res.Body.String())
	}

	if res = doJSONRequest(t, srv, http.MethodDelete, "/api/eventaction/process/1", admin, nil); res.Code != http.StatusNotFound {
		t.Fatalf("kill process: expected 404, got %d", res.Code)
	}
	if res = doJSONRequest(t, srv, http.MethodDelete, path, admin, nil); res.Code != http.StatusOK {
		t.Fatalf("delete: %d", res.Code)
	}
	if res = doJSONRequest(t, srv, http.MethodDelete, path, admin, nil); res.Code != http.StatusNotFound {
		t.Fatalf("delete again: expected 404, got %d", res.Code)
	}
}

func TestI2CBoardModelsMatchCocktailPi(t *testing.T) {
	srv := setupTestServer(t)
	admin := loginToken(t, srv, "admin", "admin")

	cases := map[string]int{
		"MCP23017":           16,
		"XL9535_K1V5_RELAY":  1,
		"XL9535_K16V5_RELAY": 16,
	}
	address := 0x20
	for model, wantPins := range cases {
		address++
		res := doJSONRequest(t, srv, http.MethodPost, "/api/gpio/", admin, map[string]any{
			"name": "board " + model, "type": "i2c", "boardModel": model, "address": address,
		})
		if res.Code != http.StatusCreated {
			t.Fatalf("create %s: %d %s", model, res.Code, res.Body.String())
		}
		var board struct {
			ID int64 `json:"id"`
		}
		_ = json.Unmarshal(res.Body.Bytes(), &board)
		res = doJSONRequest(t, srv, http.MethodGet, "/api/gpio/"+strconv.FormatInt(board.ID, 10)+"/pin", admin, nil)
		var pins []json.RawMessage
		_ = json.Unmarshal(res.Body.Bytes(), &pins)
		if len(pins) != wantPins {
			t.Fatalf("%s: expected %d pins, got %d", model, wantPins, len(pins))
		}
	}

	res := doJSONRequest(t, srv, http.MethodPost, "/api/gpio/", admin, map[string]any{
		"name": "old model", "type": "i2c", "boardModel": "PCF8574", "address": 0x30,
	})
	if res.Code != http.StatusBadRequest {
		t.Fatalf("unsupported model should be rejected, got %d", res.Code)
	}
}
