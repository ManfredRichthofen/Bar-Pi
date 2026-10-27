package router_test

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/config"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/database"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/router"
	"github.com/gorilla/websocket"
)

func setupTestServer(t *testing.T) http.Handler {
	t.Helper()
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test.db")
	cfg := &config.Config{
		Server: config.ServerConfig{
			Port:         8080,
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
			IdleTimeout:  10 * time.Second,
		},
		Database: config.DatabaseConfig{
			Path:         dbPath,
			MaxOpenConns: 1,
			MaxIdleConns: 1,
		},
		JWT: config.JWTConfig{
			Secret:         "test-secret-key",
			ExpirationTime: 24 * time.Hour,
		},
		App: config.AppConfig{
			Name:      "Bar-Pi Test",
			Version:   "2.0.0",
			ImagesDir: filepath.Join(tmpDir, "images"),
		},
	}

	db, err := database.Initialize(cfg)
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	r, cleanup := router.SetupWithCleanup(cfg, db)
	t.Cleanup(func() {
		if cleanup != nil {
			cleanup()
		}
		if sqlDB, err := db.DB(); err == nil && sqlDB != nil {
			_ = sqlDB.Close()
		}
	})

	return r
}

func doJSONRequest(t *testing.T, r http.Handler, method, path, token string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var reqBody bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&reqBody).Encode(body); err != nil {
			t.Fatalf("encode json: %v", err)
		}
	}
	req := httptest.NewRequest(method, path, &reqBody)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func doMultipartRequest(t *testing.T, r http.Handler, method, path, token, fieldName string, dto any) *httptest.ResponseRecorder {
	t.Helper()
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	part, err := mw.CreateFormFile(fieldName, "blob")
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	if err := json.NewEncoder(part).Encode(dto); err != nil {
		t.Fatalf("encode dto: %v", err)
	}
	_ = mw.Close()

	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestCocktailPiAndFrontendCompatibility(t *testing.T) {
	srv := setupTestServer(t)

	// 1. Login as default admin
	loginRes := doJSONRequest(t, srv, http.MethodPost, "/api/auth/login", "", map[string]any{
		"username": "admin",
		"password": "admin",
		"remember": true,
	})
	if loginRes.Code != http.StatusOK {
		t.Fatalf("expected 200 login, got %d: %s", loginRes.Code, loginRes.Body.String())
	}
	var loginData struct {
		AccessToken string `json:"accessToken"`
		User        struct {
			ID               int64  `json:"id"`
			Username         string `json:"username"`
			AdminLevel       int    `json:"adminLevel"`
			AccountNonLocked bool   `json:"accountNonLocked"`
		} `json:"user"`
	}
	if err := json.Unmarshal(loginRes.Body.Bytes(), &loginData); err != nil {
		t.Fatalf("unmarshal login: %v", err)
	}
	token := loginData.AccessToken
	if token == "" || loginData.User.AdminLevel != 4 || !loginData.User.AccountNonLocked {
		t.Fatalf("unexpected login response: %+v", loginData)
	}

	// 2. GET /api/user/current (used by useCurrentUser)
	meRes := doJSONRequest(t, srv, http.MethodGet, "/api/user/current", token, nil)
	if meRes.Code != http.StatusOK {
		t.Fatalf("expected 200 on /api/user/current, got %d: %s", meRes.Code, meRes.Body.String())
	}

	// 3. Create user via CocktailPi envelope { userDto: { username, adminLevel, accountNonLocked }, password }
	createUserRes := doJSONRequest(t, srv, http.MethodPost, "/api/user/", token, map[string]any{
		"userDto": map[string]any{
			"username":         "bartender",
			"password":         "secret123",
			"adminLevel":       2,
			"accountNonLocked": true,
		},
	})
	if createUserRes.Code != http.StatusCreated {
		t.Fatalf("expected 201 create user, got %d: %s", createUserRes.Code, createUserRes.Body.String())
	}

	// 4. Create glass without size (as sent by GlassModal)
	glassRes := doJSONRequest(t, srv, http.MethodPost, "/api/glass/", token, map[string]any{
		"name":        "Highball",
		"description": "Tall glass",
	})
	if glassRes.Code != http.StatusCreated {
		t.Fatalf("expected 201 create glass, got %d: %s", glassRes.Code, glassRes.Body.String())
	}
	var glass struct {
		ID       int64 `json:"id"`
		Size     int   `json:"size"`
		SizeInMl int   `json:"sizeInMl"`
	}
	_ = json.Unmarshal(glassRes.Body.Bytes(), &glass)
	if glass.Size != 250 || glass.SizeInMl != 250 {
		t.Fatalf("expected glass size & sizeInMl = 250, got %+v", glass)
	}

	// 5. Create automated & manual ingredients via multipart/form-data and verify filterX exclusion semantics
	ingRes := doMultipartRequest(t, srv, http.MethodPost, "/api/ingredient/", token, "ingredient", map[string]any{
		"type":               "automated",
		"name":               "White Rum",
		"alcoholContent":     40,
		"bottleSize":         750,
		"pumpTimeMultiplier": 1.0,
	})
	if ingRes.Code != http.StatusCreated {
		t.Fatalf("expected 201 create ingredient, got %d: %s", ingRes.Code, ingRes.Body.String())
	}
	var rum struct {
		ID    int64  `json:"id"`
		Type  string `json:"type"`
		DType string `json:"dtype"`
	}
	_ = json.Unmarshal(ingRes.Body.Bytes(), &rum)
	if rum.Type != "automated" || rum.DType != "AutomatedIngredient" {
		t.Fatalf("unexpected ingredient response: %+v", rum)
	}

	manualIngRes := doMultipartRequest(t, srv, http.MethodPost, "/api/ingredient/", token, "ingredient", map[string]any{
		"type":           "manual",
		"name":           "Mint Leaves",
		"alcoholContent": 0,
		"unit":           "piece",
	})
	if manualIngRes.Code != http.StatusCreated {
		t.Fatalf("expected 201 create manual ingredient, got %d: %s", manualIngRes.Code, manualIngRes.Body.String())
	}

	// Verify filterManualIngredients=true excludes manual ingredients (leaves only automated)
	filteredIngsRes := doJSONRequest(t, srv, http.MethodGet, "/api/ingredient/?filterManualIngredients=true", token, nil)
	if filteredIngsRes.Code != http.StatusOK {
		t.Fatalf("expected 200 on filtered ingredients, got %d", filteredIngsRes.Code)
	}
	var filteredIngs []struct {
		Name string `json:"name"`
		Type string `json:"type"`
	}
	_ = json.Unmarshal(filteredIngsRes.Body.Bytes(), &filteredIngs)
	if len(filteredIngs) != 1 || filteredIngs[0].Name != "White Rum" {
		t.Fatalf("expected only White Rum when filterManualIngredients=true, got %+v", filteredIngs)
	}

	// 6. Check GPIO boards and pins
	boardsRes := doJSONRequest(t, srv, http.MethodGet, "/api/gpio/", token, nil)
	if boardsRes.Code != http.StatusOK {
		t.Fatalf("expected 200 on /api/gpio/, got %d", boardsRes.Code)
	}
	pinsRes := doJSONRequest(t, srv, http.MethodGet, "/api/gpio/1/pin", token, nil)
	if pinsRes.Code != http.StatusOK {
		t.Fatalf("expected 200 on /api/gpio/1/pin, got %d", pinsRes.Code)
	}

	// 7. Create skeleton pump (as sent by PumpSelector: { type: "dc" }) and patch it (as sent by EditPumpPage)
	pumpCreateRes := doJSONRequest(t, srv, http.MethodPost, "/api/pump/", token, map[string]any{
		"type": "dc",
	})
	if pumpCreateRes.Code != http.StatusCreated {
		t.Fatalf("expected 201 create skeleton pump, got %d: %s", pumpCreateRes.Code, pumpCreateRes.Body.String())
	}
	var createdPump struct {
		ID    int64  `json:"id"`
		State string `json:"state"`
	}
	_ = json.Unmarshal(pumpCreateRes.Body.Bytes(), &createdPump)
	if createdPump.State != "INCOMPLETE" {
		t.Fatalf("expected INCOMPLETE state for skeleton pump, got %s", createdPump.State)
	}

	pumpIDStr := strconv.FormatInt(createdPump.ID, 10)
	patchRes := doJSONRequest(t, srv, http.MethodPatch, "/api/pump/"+pumpIDStr, token, map[string]any{
		"name":                "Pump 1",
		"type":                "dc",
		"pin":                 map[string]any{"boardId": 1, "nr": 17},
		"timePerClInMs":       100,
		"tubeCapacityInMl":    50,
		"fillingLevelInMl":    500,
		"isPowerStateHigh":    true,
		"isPumpedUp":          true,
		"currentIngredientId": rum.ID,
	})
	if patchRes.Code != http.StatusOK {
		t.Fatalf("expected 200 patch pump, got %d: %s", patchRes.Code, patchRes.Body.String())
	}
	var patchedPump struct {
		ID       int64  `json:"id"`
		State    string `json:"state"`
		PumpedUp bool   `json:"pumpedUp"`
		Pin      *struct {
			BoardID int64 `json:"boardId"`
			Nr      int   `json:"nr"`
		} `json:"pin"`
	}
	_ = json.Unmarshal(patchRes.Body.Bytes(), &patchedPump)
	if patchedPump.State != "READY" || !patchedPump.PumpedUp || patchedPump.Pin == nil || patchedPump.Pin.Nr != 17 {
		t.Fatalf("unexpected patched pump: %+v", patchedPump)
	}

	// 8. Create recipe via multipart/form-data (as sent by RecipeForm / RecipeService)
	recipeCreateRes := doMultipartRequest(t, srv, http.MethodPost, "/api/recipe/", token, "recipe", map[string]any{
		"name":                "Daiquiri",
		"description":         "Classic rum cocktail",
		"defaultGlassId":      glass.ID,
		"defaultAmountToFill": 250,
		"productionSteps": []map[string]any{
			{
				"type": "addIngredients",
				"stepIngredients": []map[string]any{
					{
						"ingredient": map[string]any{"id": rum.ID},
						"amount":     60,
						"scale":      "milliliter",
						"boostable":  true,
					},
				},
			},
		},
	})
	if recipeCreateRes.Code != http.StatusCreated {
		t.Fatalf("expected 201 create recipe, got %d: %s", recipeCreateRes.Code, recipeCreateRes.Body.String())
	}
	var createdRecipe struct {
		ID          int64 `json:"id"`
		Alcoholic   bool  `json:"alcoholic"`
		Ingredients []struct {
			ID     int64  `json:"id"`
			Name   string `json:"name"`
			Type   string `json:"type"`
			OnPump bool   `json:"onPump"`
		} `json:"ingredients"`
	}
	_ = json.Unmarshal(recipeCreateRes.Body.Bytes(), &createdRecipe)
	if !createdRecipe.Alcoholic || len(createdRecipe.Ingredients) != 1 || !createdRecipe.Ingredients[0].OnPump {
		t.Fatalf("unexpected created recipe response: %+v", createdRecipe)
	}

	// 9. GET /api/recipe/ paginated response (Spring Page format)
	recipesPageRes := doJSONRequest(t, srv, http.MethodGet, "/api/recipe/?page=0", token, nil)
	if recipesPageRes.Code != http.StatusOK {
		t.Fatalf("expected 200 on /api/recipe/, got %d: %s", recipesPageRes.Code, recipesPageRes.Body.String())
	}
	var pageObj struct {
		Content       []any `json:"content"`
		TotalElements int   `json:"totalElements"`
		Last          bool  `json:"last"`
	}
	_ = json.Unmarshal(recipesPageRes.Body.Bytes(), &pageObj)
	if len(pageObj.Content) != 1 || pageObj.TotalElements != 1 || !pageObj.Last {
		t.Fatalf("unexpected page response: %+v", pageObj)
	}

	// 10. Check feasibility & order cocktail
	recipeIDStr := strconv.FormatInt(createdRecipe.ID, 10)
	feasRes := doJSONRequest(t, srv, http.MethodPut, "/api/cocktail/"+recipeIDStr+"/feasibility", token, map[string]any{
		"amountOrderedInMl": 250,
		"customisations": map[string]any{
			"boost":                 100,
			"additionalIngredients": []any{},
		},
	})
	if feasRes.Code != http.StatusOK {
		t.Fatalf("expected 200 feasibility, got %d: %s", feasRes.Code, feasRes.Body.String())
	}
	var feasData struct {
		Feasible            bool `json:"feasible"`
		TotalAmountInMl     int  `json:"totalAmountInMl"`
		RequiredIngredients []struct {
			AmountRequired int `json:"amountRequired"`
			AmountMissing  int `json:"amountMissing"`
		} `json:"requiredIngredients"`
	}
	_ = json.Unmarshal(feasRes.Body.Bytes(), &feasData)
	if !feasData.Feasible || len(feasData.RequiredIngredients) != 1 || feasData.RequiredIngredients[0].AmountMissing != 0 {
		t.Fatalf("unexpected feasibility result: %+v", feasData)
	}

	orderRes := doJSONRequest(t, srv, http.MethodPut, "/api/cocktail/"+recipeIDStr, token, map[string]any{
		"amountOrderedInMl": 250,
		"customisations": map[string]any{
			"boost":                 100,
			"additionalIngredients": []any{},
		},
	})
	if orderRes.Code != http.StatusAccepted {
		t.Fatalf("expected 202 order cocktail, got %d: %s", orderRes.Code, orderRes.Body.String())
	}

	cancelRes := doJSONRequest(t, srv, http.MethodDelete, "/api/cocktail", token, nil)
	if cancelRes.Code != http.StatusOK {
		t.Fatalf("expected 200 cancel cocktail, got %d: %s", cancelRes.Code, cancelRes.Body.String())
	}

	// 11. Verify backend identification on /health, /api/system/version, and /api/system/settings/global
	healthRes := doJSONRequest(t, srv, http.MethodGet, "/health", "", nil)
	if healthRes.Code != http.StatusOK {
		t.Fatalf("expected 200 on /health, got %d", healthRes.Code)
	}
	var healthData struct {
		Status  string `json:"status"`
		Backend string `json:"backend"`
	}
	_ = json.Unmarshal(healthRes.Body.Bytes(), &healthData)
	if healthData.Status != "ok" || healthData.Backend != "go" {
		t.Fatalf("expected /health backend='go', got %+v", healthData)
	}

	globalRes := doJSONRequest(t, srv, http.MethodGet, "/api/system/settings/global", token, nil)
	if globalRes.Code != http.StatusOK {
		t.Fatalf("expected 200 on /api/system/settings/global, got %d", globalRes.Code)
	}
	var globalData struct {
		Backend string `json:"backend"`
	}
	_ = json.Unmarshal(globalRes.Body.Bytes(), &globalData)
	if globalData.Backend != "go" {
		t.Fatalf("expected /api/system/settings/global backend='go', got %+v", globalData)
	}

	versionRes := doJSONRequest(t, srv, http.MethodGet, "/api/system/version", token, nil)
	if versionRes.Code != http.StatusOK {
		t.Fatalf("expected 200 on /api/system/version, got %d", versionRes.Code)
	}
	var versionData struct {
		Backend string `json:"backend"`
	}
	_ = json.Unmarshal(versionRes.Body.Bytes(), &versionData)
	if versionData.Backend != "go" {
		t.Fatalf("expected /api/system/version backend='go', got %+v", versionData)
	}
}

func TestSockJSFramingAndInitialSubscriptionState(t *testing.T) {
	srv := setupTestServer(t)
	ts := httptest.NewServer(srv)
	defer ts.Close()

	// 1. Check /websocket/info
	infoResp, err := http.Get(ts.URL + "/websocket/info")
	if err != nil {
		t.Fatalf("GET /websocket/info failed: %v", err)
	}
	defer infoResp.Body.Close()
	if infoResp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 on /websocket/info, got %d", infoResp.StatusCode)
	}

	// 2. Connect to SockJS WebSocket sub-path: /websocket/123/abc/websocket
	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http") + "/websocket/123/abc/websocket"
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("dial sockjs websocket failed: %v", err)
	}
	defer conn.Close()

	_ = conn.SetReadDeadline(time.Now().Add(3 * time.Second))

	// First frame must be SockJS open frame "o"
	_, msg, err := conn.ReadMessage()
	if err != nil {
		t.Fatalf("read open frame failed: %v", err)
	}
	if string(msg) != "o" {
		t.Fatalf("expected SockJS open frame 'o', got %q", string(msg))
	}

	// Send SockJS-wrapped STOMP CONNECT frame
	connectFrame, _ := json.Marshal([]string{"CONNECT\naccept-version:1.2\n\n\x00"})
	if err := conn.WriteMessage(websocket.TextMessage, connectFrame); err != nil {
		t.Fatalf("write CONNECT failed: %v", err)
	}

	// Expect SockJS-wrapped CONNECTED frame: a["CONNECTED\n..."]
	_, msg, err = conn.ReadMessage()
	if err != nil {
		t.Fatalf("read CONNECTED failed: %v", err)
	}
	if !strings.HasPrefix(string(msg), "a[\"CONNECTED") {
		t.Fatalf("expected SockJS a[\"CONNECTED...\"] frame, got %q", string(msg))
	}

	// Subscribe to /user/topic/cocktailprogress and verify immediate initial state push
	subFrame, _ := json.Marshal([]string{"SUBSCRIBE\nid:sub-0\ndestination:/user/topic/cocktailprogress\n\n\x00"})
	if err := conn.WriteMessage(websocket.TextMessage, subFrame); err != nil {
		t.Fatalf("write SUBSCRIBE failed: %v", err)
	}

	_, msg, err = conn.ReadMessage()
	if err != nil {
		t.Fatalf("read initial MESSAGE failed: %v", err)
	}
	if !strings.HasPrefix(string(msg), "a[\"MESSAGE") || !strings.Contains(string(msg), "DELETE") {
		t.Fatalf("expected initial MESSAGE with DELETE body, got %q", string(msg))
	}
}
