package handlers

import (
	"bytes"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/service"
)

func serveStoredImage(c *gin.Context, img *service.StoredImage) {
	c.Header("Content-Type", img.ContentType)
	c.Header("Cache-Control", "private, no-cache")
	c.Header("ETag", fmt.Sprintf(`"%x-%x"`, img.ModTime.UnixNano(), len(img.Data)))
	http.ServeContent(c.Writer, c.Request, "", img.ModTime, bytes.NewReader(img.Data))
}
