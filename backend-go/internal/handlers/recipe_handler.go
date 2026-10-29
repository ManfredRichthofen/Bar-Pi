package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/middleware"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/websocket"
	"github.com/gin-gonic/gin"
)

type RecipeHandler struct {
	service      *service.RecipeService
	imageService *service.ImageService
	wsService    *websocket.Service
}

func NewRecipeHandler(service *service.RecipeService, imageService *service.ImageService, ws ...*websocket.Service) *RecipeHandler {
	var wsSvc *websocket.Service
	if len(ws) > 0 {
		wsSvc = ws[0]
	}
	return &RecipeHandler{
		service:      service,
		imageService: imageService,
		wsService:    wsSvc,
	}
}

type RecipeWritePayload struct {
	Name                string                  `json:"name"`
	Description         string                  `json:"description"`
	OwnerID             int64                   `json:"ownerId"`
	DefaultAmountToFill int                     `json:"defaultAmountToFill"`
	DefaultGlassID      *int64                  `json:"defaultGlassId"`
	GlassID             *int64                  `json:"glassId"`
	DefaultGlass        *models.Glass           `json:"defaultGlass"`
	CategoryIDs         []int64                 `json:"categoryIds"`
	Categories          []models.Category       `json:"categories"`
	ProductionSteps     []models.ProductionStep `json:"productionSteps"`
}

func (p *RecipeWritePayload) ToRecipe() models.Recipe {
	glassID := p.DefaultGlassID
	if glassID == nil {
		glassID = p.GlassID
	}
	if glassID == nil && p.DefaultGlass != nil && p.DefaultGlass.ID > 0 {
		id := p.DefaultGlass.ID
		glassID = &id
	}

	categories := p.Categories
	if len(categories) == 0 && len(p.CategoryIDs) > 0 {
		for _, cid := range p.CategoryIDs {
			categories = append(categories, models.Category{ID: cid})
		}
	}

	return models.Recipe{
		Name:                p.Name,
		Description:         p.Description,
		OwnerID:             p.OwnerID,
		DefaultAmountToFill: p.DefaultAmountToFill,
		GlassID:             glassID,
		Categories:          categories,
		ProductionSteps:     p.ProductionSteps,
	}
}

func parseRecipeAndImageFromRequest(c *gin.Context) (*models.Recipe, []byte, error) {
	contentType := c.ContentType()
	var payload RecipeWritePayload
	var imageBytes []byte

	if strings.HasPrefix(contentType, "multipart/") {
		if err := c.Request.ParseMultipartForm(16 << 20); err != nil {
			return nil, nil, err
		}
		var recipeJSON []byte
		if val := c.Request.FormValue("recipe"); val != "" {
			recipeJSON = []byte(val)
		} else if fileHeaders := c.Request.MultipartForm.File["recipe"]; len(fileHeaders) > 0 {
			f, err := fileHeaders[0].Open()
			if err != nil {
				return nil, nil, err
			}
			defer f.Close()
			recipeJSON, err = io.ReadAll(f)
			if err != nil {
				return nil, nil, err
			}
		}
		if err := json.Unmarshal(recipeJSON, &payload); err != nil {
			return nil, nil, err
		}

		if imgHeaders := c.Request.MultipartForm.File["image"]; len(imgHeaders) > 0 {
			imgFile, err := imgHeaders[0].Open()
			if err == nil {
				defer imgFile.Close()
				imageBytes, _ = io.ReadAll(imgFile)
			}
		}
	} else {
		if err := c.ShouldBindJSON(&payload); err != nil {
			return nil, nil, err
		}
	}

	recipe := payload.ToRecipe()
	return &recipe, imageBytes, nil
}

func (h *RecipeHandler) GetAll(c *gin.Context) {
	var ownerID *int64
	if s := c.Query("ownerId"); s != "" {
		if v, err := strconv.ParseInt(s, 10, 64); err == nil {
			ownerID = &v
		}
	}
	var inCollection *int64
	if s := c.Query("inCollection"); s != "" {
		if v, err := strconv.ParseInt(s, 10, 64); err == nil {
			inCollection = &v
		}
	}
	var inCategory *int64
	if s := c.Query("inCategory"); s != "" {
		if v, err := strconv.ParseInt(s, 10, 64); err == nil {
			inCategory = &v
		}
	} else if s := c.Query("inCategoryId"); s != "" {
		if v, err := strconv.ParseInt(s, 10, 64); err == nil {
			inCategory = &v
		}
	}

	var containsIngredients []int64
	if s := c.Query("containsIngredients"); s != "" {
		for _, part := range strings.Split(s, ",") {
			if v, err := strconv.ParseInt(strings.TrimSpace(part), 10, 64); err == nil {
				containsIngredients = append(containsIngredients, v)
			}
		}
	}

	searchName := c.Query("searchName")
	if searchName == "" {
		searchName = c.Query("q")
	}
	orderBy := c.Query("orderBy")

	recipes, err := h.service.GetByFilter(ownerID, inCollection, inCategory, containsIngredients, searchName, orderBy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes", "message": "Failed to fetch recipes"})
		return
	}

	// Pagination parameters (Spring Data Page format)
	page := 0
	if pStr := c.Query("page"); pStr != "" {
		if p, err := strconv.Atoi(pStr); err == nil && p >= 0 {
			page = p
		}
	}
	pageSize := 50
	if szStr := c.Query("size"); szStr != "" {
		if sz, err := strconv.Atoi(szStr); err == nil && sz > 0 {
			pageSize = sz
		}
	}

	totalElements := len(recipes)
	totalPages := (totalElements + pageSize - 1) / pageSize
	if totalPages == 0 {
		totalPages = 1
	}

	start := page * pageSize
	end := start + pageSize
	var pageContent []models.Recipe
	if start < totalElements {
		if end > totalElements {
			end = totalElements
		}
		pageContent = recipes[start:end]
	} else {
		pageContent = []models.Recipe{}
	}

	isLast := page >= totalPages-1

	c.JSON(http.StatusOK, gin.H{
		"content":          pageContent,
		"totalElements":    totalElements,
		"totalPages":       totalPages,
		"last":             isLast,
		"first":            page == 0,
		"size":             pageSize,
		"number":           page,
		"numberOfElements": len(pageContent),
		"empty":            len(pageContent) == 0,
	})
}

func (h *RecipeHandler) GetIngredientRecipes(c *gin.Context) {
	c.JSON(http.StatusOK, []models.Recipe{})
}

func (h *RecipeHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID", "message": "Invalid recipe ID"})
		return
	}

	recipe, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipe", "message": "Failed to fetch recipe"})
		return
	}
	if recipe == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recipe not found", "message": "Recipe not found"})
		return
	}

	c.JSON(http.StatusOK, recipe)
}

func (h *RecipeHandler) GetImage(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID", "message": "Invalid recipe ID"})
		return
	}

	if h.imageService == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	img, err := h.imageService.GetEntityImage("recipe", id)
	if err != nil || img == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	serveStoredImage(c, img)
}

func (h *RecipeHandler) Create(c *gin.Context) {
	recipe, imageBytes, err := parseRecipeAndImageFromRequest(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	claims, ok := middleware.GetClaims(c)
	if ok && recipe.OwnerID == 0 {
		recipe.OwnerID = claims.UserID
	}

	if len(imageBytes) > 0 {
		recipe.HasImage = true
	}

	if err := h.service.Create(recipe); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	if len(imageBytes) > 0 && h.imageService != nil {
		if _, err := h.imageService.SaveImage(imageBytes, "recipe", recipe.ID); err != nil {
			recipe.HasImage = false
			_ = h.service.Update(recipe)
		}
	}

	created, err := h.service.GetByID(recipe.ID)
	if err == nil && created != nil {
		recipe = created
	}

	if h.wsService != nil {
		h.wsService.InvalidateRecipeScrollCaches()
	}

	c.JSON(http.StatusCreated, recipe)
}

func (h *RecipeHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID", "message": "Invalid recipe ID"})
		return
	}

	claims, ok := middleware.GetClaims(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized", "message": "Unauthorized"})
		return
	}

	existing, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipe", "message": "Failed to fetch recipe"})
		return
	}
	if existing == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recipe not found", "message": "Recipe not found"})
		return
	}

	if existing.OwnerID != claims.UserID && claims.Role.Level() < models.RoleRecipeCreator.Level() {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized", "message": "Unauthorized"})
		return
	}

	recipe, imageBytes, err := parseRecipeAndImageFromRequest(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	recipe.ID = id
	recipe.OwnerID = existing.OwnerID
	recipe.HasImage = existing.HasImage

	removeImage := c.Query("removeImage") == "true"
	if removeImage {
		recipe.HasImage = false
		if h.imageService != nil {
			_ = h.imageService.DeleteEntityImage("recipe", id)
		}
	}
	if len(imageBytes) > 0 && h.imageService != nil {
		if _, err := h.imageService.SaveImage(imageBytes, "recipe", id); err == nil {
			recipe.HasImage = true
		}
	}

	if err := h.service.Update(recipe); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recipe", "message": err.Error()})
		return
	}

	updated, err := h.service.GetByID(id)
	if err == nil && updated != nil {
		recipe = updated
	}

	if h.wsService != nil {
		h.wsService.InvalidateRecipeScrollCaches()
	}

	c.JSON(http.StatusOK, recipe)
}

func (h *RecipeHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID", "message": "Invalid recipe ID"})
		return
	}

	claims, ok := middleware.GetClaims(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized", "message": "Unauthorized"})
		return
	}
	isAdmin := claims.Role.Level() >= models.RoleRecipeCreator.Level()

	if err := h.service.Delete(id, claims.UserID, isAdmin); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error(), "message": err.Error()})
		return
	}

	if h.imageService != nil {
		_ = h.imageService.DeleteEntityImage("recipe", id)
	}
	if h.wsService != nil {
		h.wsService.InvalidateRecipeScrollCaches()
	}

	c.JSON(http.StatusOK, gin.H{"message": "Recipe deleted successfully"})
}

func (h *RecipeHandler) Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required", "message": "Search query is required"})
		return
	}

	recipes, err := h.service.Search(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search recipes", "message": "Failed to search recipes"})
		return
	}

	c.JSON(http.StatusOK, recipes)
}
