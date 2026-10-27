package service

import (
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
	"gorm.io/gorm"
)

type StatisticsService struct {
	repo *repository.StatisticsRepository
}

func NewStatisticsService(db *gorm.DB) *StatisticsService {
	return &StatisticsService{
		repo: repository.NewStatisticsRepository(db),
	}
}

func (s *StatisticsService) GetOverview(days int) (*models.StatisticsOverview, error) {
	summary, _ := s.repo.GetSummaryStats()
	inv, _ := s.repo.GetInventoryStats()
	topRecipes, _ := s.repo.GetTopRecipes(15)
	topIngredients, _ := s.repo.GetTopIngredients(20)
	categories, _ := s.repo.GetCategoryStats()
	topUsers, _ := s.repo.GetTopUsers(10)
	pumpStats, _ := s.repo.GetPumpStats()
	dailyTimeline, _ := s.repo.GetDailyTimeline(days)
	hourlyDistribution, _ := s.repo.GetHourlyDistribution()
	recentOrders, _ := s.repo.GetRecentOrders(30)

	return &models.StatisticsOverview{
		Summary:            summary,
		Inventory:          inv,
		TopRecipes:         topRecipes,
		TopIngredients:     topIngredients,
		Categories:         categories,
		TopUsers:           topUsers,
		PumpStats:          pumpStats,
		DailyTimeline:      dailyTimeline,
		HourlyDistribution: hourlyDistribution,
		RecentOrders:       recentOrders,
	}, nil
}

func (s *StatisticsService) GetTopRecipes(limit int) ([]models.RecipeStat, error) {
	return s.repo.GetTopRecipes(limit)
}

func (s *StatisticsService) GetTopIngredients(limit int) ([]models.IngredientUsageStat, error) {
	return s.repo.GetTopIngredients(limit)
}

func (s *StatisticsService) GetRecentOrders(limit int) ([]models.CocktailOrder, error) {
	return s.repo.GetRecentOrders(limit)
}

func (s *StatisticsService) ClearOrderHistory() error {
	return s.repo.ClearOrderHistory()
}
