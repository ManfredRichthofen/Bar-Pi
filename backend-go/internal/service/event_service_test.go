package service

import (
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/config"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/database"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/repository"
)

type fakePins struct {
	mu     sync.Mutex
	states map[int]bool
	log    []bool
}

func (f *fakePins) SetupOutputPin(int) error { return nil }
func (f *fakePins) SetPinHigh(pin int) error { return f.set(pin, true) }
func (f *fakePins) SetPinLow(pin int) error  { return f.set(pin, false) }

func (f *fakePins) set(pin int, high bool) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.states[pin] = high
	f.log = append(f.log, high)
	return nil
}

func (f *fakePins) state(pin int) (bool, int) {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.states[pin], len(f.log)
}

func newEventTestService(t *testing.T) (*EventService, *repository.EventRepository, *fakePins) {
	t.Helper()
	cfg := &config.Config{
		Database: config.DatabaseConfig{
			Path:         filepath.Join(t.TempDir(), "test.db"),
			MaxOpenConns: 1,
			MaxIdleConns: 1,
		},
	}
	db, err := database.Initialize(cfg)
	if err != nil {
		t.Fatalf("init db: %v", err)
	}
	t.Cleanup(func() {
		if sqlDB, err := db.DB(); err == nil {
			_ = sqlDB.Close()
		}
	})
	repo := repository.NewEventRepository(db)
	pins := &fakePins{states: map[int]bool{}}
	return NewEventService(repo, pins), repo, pins
}

func eventPtr[T any](v T) *T { return &v }

func TestExecuteRestoresPinAfterDuration(t *testing.T) {
	svc, _, pins := newEventTestService(t)
	action := models.EventAction{
		DType:          models.EventActionTypeGPIO,
		GpioBoard:      eventPtr(int64(1)),
		GpioPin:        eventPtr(17),
		PowerStateHigh: eventPtr(true),
		DurationInMs:   eventPtr(30),
	}
	if err := svc.Execute(action); err != nil {
		t.Fatalf("execute: %v", err)
	}
	if high, _ := pins.state(17); !high {
		t.Fatalf("pin should be high right after execute")
	}
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if high, n := pins.state(17); !high && n == 2 {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("pin was not restored after the duration")
}

func TestDispatchOnlyRunsMatchingActions(t *testing.T) {
	svc, repo, pins := newEventTestService(t)
	for _, a := range []models.EventAction{
		{DType: models.EventActionTypeGPIO, Trigger: models.EventTriggerProductionStarted, GpioBoard: eventPtr(int64(1)), GpioPin: eventPtr(5)},
		{DType: models.EventActionTypeGPIO, Trigger: models.EventTriggerProductionFinished, GpioBoard: eventPtr(int64(1)), GpioPin: eventPtr(6)},
	} {
		a := a
		if err := repo.Create(&a); err != nil {
			t.Fatalf("create: %v", err)
		}
	}

	svc.Dispatch(models.EventTriggerProductionStarted, 42)

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if high, _ := pins.state(5); high {
			if other, _ := pins.state(6); other {
				t.Fatalf("action for a different trigger ran")
			}
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("matching action did not run")
}

func TestCallURLActionSendsRequest(t *testing.T) {
	svc, _, _ := newEventTestService(t)
	var method atomic.Value
	status := http.StatusOK
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		method.Store(r.Method)
		w.WriteHeader(status)
	}))
	defer target.Close()

	action := models.EventAction{
		DType:         models.EventActionTypeCallURL,
		URL:           eventPtr(target.URL),
		RequestMethod: eventPtr("PUT"),
	}
	if err := svc.Execute(action); err != nil {
		t.Fatalf("execute: %v", err)
	}
	if got := method.Load(); got != "PUT" {
		t.Fatalf("expected a PUT request, got %v", got)
	}

	status = http.StatusInternalServerError
	if err := svc.Execute(action); err == nil {
		t.Fatalf("expected an error for a 500 response")
	}
}

func TestExecuteRejectsMissingHardware(t *testing.T) {
	svc, _, _ := newEventTestService(t)
	svc.pins = nil
	err := svc.Execute(models.EventAction{
		DType:     models.EventActionTypeGPIO,
		GpioBoard: eventPtr(int64(1)),
		GpioPin:   eventPtr(3),
	})
	if err == nil {
		t.Fatalf("expected an error without GPIO hardware")
	}
}
