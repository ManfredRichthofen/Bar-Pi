package router_test

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"
)

func TestMQTTSettingsAPI(t *testing.T) {
	srv := setupTestServer(t)
	admin := loginToken(t, srv, "admin", "admin")

	res := doJSONRequest(t, srv, http.MethodPost, "/api/user/", admin, map[string]any{
		"userDto": map[string]any{"username": "guest", "password": "secret123", "adminLevel": 0, "accountNonLocked": true},
	})
	if res.Code != http.StatusCreated {
		t.Fatalf("create user: %d", res.Code)
	}
	guest := loginToken(t, srv, "guest", "secret123")
	if res = doJSONRequest(t, srv, http.MethodGet, "/api/system/settings/mqtt", guest, nil); res.Code != http.StatusForbidden {
		t.Fatalf("non-admin read: expected 403, got %d", res.Code)
	}

	type response struct {
		Enabled         bool   `json:"enabled"`
		BrokerURL       string `json:"brokerUrl"`
		Username        string `json:"username"`
		PasswordSet     bool   `json:"passwordSet"`
		BaseTopic       string `json:"baseTopic"`
		DiscoveryPrefix string `json:"discoveryPrefix"`
	}
	decode := func(body []byte) response {
		var r response
		if err := json.Unmarshal(body, &r); err != nil {
			t.Fatalf("decode: %v (%s)", err, body)
		}
		return r
	}

	res = doJSONRequest(t, srv, http.MethodGet, "/api/system/settings/mqtt", admin, nil)
	if r := decode(res.Body.Bytes()); res.Code != http.StatusOK || r.Enabled || r.BaseTopic != "barpi" || r.DiscoveryPrefix != "homeassistant" {
		t.Fatalf("unexpected defaults: %d %s", res.Code, res.Body.String())
	}

	// Saved while disabled, so no broker is contacted.
	res = doJSONRequest(t, srv, http.MethodPut, "/api/system/settings/mqtt", admin, map[string]any{
		"enabled": false, "brokerUrl": "mqtt://broker.local", "username": "ha", "password": "hunter2",
	})
	if r := decode(res.Body.Bytes()); res.Code != http.StatusOK || r.BrokerURL != "tcp://broker.local:1883" || !r.PasswordSet || r.Username != "ha" {
		t.Fatalf("unexpected save response: %d %s", res.Code, res.Body.String())
	}
	if strings.Contains(res.Body.String(), "hunter2") {
		t.Fatalf("password must never be returned: %s", res.Body.String())
	}

	// Omitting the password keeps it; an empty string clears it.
	res = doJSONRequest(t, srv, http.MethodPut, "/api/system/settings/mqtt", admin, map[string]any{
		"enabled": false, "brokerUrl": "mqtt://broker.local", "username": "ha",
	})
	if !decode(res.Body.Bytes()).PasswordSet {
		t.Fatalf("password should be kept when omitted: %s", res.Body.String())
	}
	res = doJSONRequest(t, srv, http.MethodPut, "/api/system/settings/mqtt", admin, map[string]any{
		"enabled": false, "brokerUrl": "mqtt://broker.local", "username": "ha", "password": "",
	})
	if decode(res.Body.Bytes()).PasswordSet {
		t.Fatalf("password should be cleared: %s", res.Body.String())
	}

	bad := map[string]map[string]any{
		"enabled without broker": {"enabled": true},
		"bad scheme":             {"enabled": true, "brokerUrl": "http://broker.local"},
		"wildcard topic":         {"baseTopic": "bar/#"},
	}
	for name, body := range bad {
		if res = doJSONRequest(t, srv, http.MethodPut, "/api/system/settings/mqtt", admin, body); res.Code != http.StatusBadRequest {
			t.Fatalf("%s: expected 400, got %d %s", name, res.Code, res.Body.String())
		}
	}

	// Enabling against an unreachable broker saves, and reports the failure instead of erroring.
	res = doJSONRequest(t, srv, http.MethodPut, "/api/system/settings/mqtt", admin, map[string]any{
		"enabled": true, "brokerUrl": "mqtt://127.0.0.1:1",
	})
	var full struct {
		Status struct {
			Connected bool   `json:"connected"`
			Error     string `json:"error"`
		} `json:"status"`
	}
	_ = json.Unmarshal(res.Body.Bytes(), &full)
	if res.Code != http.StatusOK || full.Status.Connected || full.Status.Error == "" {
		t.Fatalf("expected a reported connection error: %d %s", res.Code, res.Body.String())
	}
	if res = doJSONRequest(t, srv, http.MethodPut, "/api/system/settings/mqtt", admin, map[string]any{"enabled": false}); res.Code != http.StatusOK {
		t.Fatalf("disable: %d", res.Code)
	}
}
