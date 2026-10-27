package router_test

import (
	"encoding/json"
	"net/http"
	"strconv"
	"testing"
)

func loginToken(t *testing.T, srv http.Handler, username, password string) string {
	t.Helper()
	res := doJSONRequest(t, srv, http.MethodPost, "/api/auth/login", "", map[string]any{
		"username": username,
		"password": password,
	})
	if res.Code != http.StatusOK {
		t.Fatalf("login %s: %d %s", username, res.Code, res.Body.String())
	}
	var data struct {
		AccessToken string `json:"accessToken"`
	}
	if err := json.Unmarshal(res.Body.Bytes(), &data); err != nil {
		t.Fatalf("unmarshal login: %v", err)
	}
	return data.AccessToken
}

func TestCollectionOwnership(t *testing.T) {
	srv := setupTestServer(t)
	admin := loginToken(t, srv, "admin", "admin")

	res := doJSONRequest(t, srv, http.MethodPost, "/api/user/", admin, map[string]any{
		"userDto": map[string]any{
			"username":         "guest",
			"password":         "secret123",
			"adminLevel":       0,
			"accountNonLocked": true,
		},
	})
	if res.Code != http.StatusCreated {
		t.Fatalf("create user: %d %s", res.Code, res.Body.String())
	}
	guest := loginToken(t, srv, "guest", "secret123")

	res = doJSONRequest(t, srv, http.MethodPost, "/api/collection/", guest, map[string]any{"name": "  "})
	if res.Code != http.StatusBadRequest {
		t.Fatalf("blank name: expected 400, got %d", res.Code)
	}

	res = doJSONRequest(t, srv, http.MethodPost, "/api/collection/", guest, map[string]any{"name": "Mine", "description": "d"})
	if res.Code != http.StatusCreated {
		t.Fatalf("create collection: %d %s", res.Code, res.Body.String())
	}
	var created struct {
		ID int64 `json:"id"`
	}
	_ = json.Unmarshal(res.Body.Bytes(), &created)
	path := "/api/collection/" + strconv.FormatInt(created.ID, 10)

	res = doJSONRequest(t, srv, http.MethodPost, "/api/recipe/", admin, map[string]any{"name": "Test Drink"})
	var recipe struct {
		ID int64 `json:"id"`
	}
	_ = json.Unmarshal(res.Body.Bytes(), &recipe)

	if recipe.ID == 0 {
		t.Fatalf("recipe was not created: %s", res.Body.String())
	}
	for _, body := range []any{recipe.ID, map[string]any{"recipeId": recipe.ID}} {
		res = doJSONRequest(t, srv, http.MethodPost, path+"/add", guest, body)
		if res.Code != http.StatusOK {
			t.Fatalf("add recipe %v: %d %s", body, res.Code, res.Body.String())
		}
	}
	res = doJSONRequest(t, srv, http.MethodDelete, path+"/"+strconv.FormatInt(recipe.ID, 10), guest, nil)
	if res.Code != http.StatusOK {
		t.Fatalf("remove recipe: %d %s", res.Code, res.Body.String())
	}

	res = doJSONRequest(t, srv, http.MethodPost, "/api/user/", admin, map[string]any{
		"userDto": map[string]any{"username": "guest2", "password": "secret123", "adminLevel": 0, "accountNonLocked": true},
	})
	if res.Code != http.StatusCreated {
		t.Fatalf("create guest2: %d", res.Code)
	}
	guest2 := loginToken(t, srv, "guest2", "secret123")

	if res = doJSONRequest(t, srv, http.MethodPut, path, guest2, map[string]any{"name": "Hijack"}); res.Code != http.StatusForbidden {
		t.Fatalf("non-owner update: expected 403, got %d", res.Code)
	}
	if res = doJSONRequest(t, srv, http.MethodDelete, path, guest2, nil); res.Code != http.StatusForbidden {
		t.Fatalf("non-owner delete: expected 403, got %d", res.Code)
	}
	if res = doJSONRequest(t, srv, http.MethodPut, path, admin, map[string]any{"name": "Renamed"}); res.Code != http.StatusOK {
		t.Fatalf("admin update: %d %s", res.Code, res.Body.String())
	}
	if res = doJSONRequest(t, srv, http.MethodDelete, path, guest, nil); res.Code != http.StatusOK {
		t.Fatalf("owner delete: %d %s", res.Code, res.Body.String())
	}
}
