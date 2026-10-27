package mqtt

import (
	"fmt"
	"strings"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
)

// message is one MQTT publication.
type message struct {
	topic   string
	payload any
	retain  bool
}

type topics struct {
	base      string
	prefix    string
	node      string
	available string
	state     string
	stats     string
	event     string
}

func newTopics(base, prefix string) topics {
	return topics{
		base:      base,
		prefix:    prefix,
		node:      strings.ReplaceAll(base, "/", "_"),
		available: base + "/availability",
		state:     base + "/state",
		stats:     base + "/stats",
		event:     base + "/event",
	}
}

func (t topics) pump(id int64) string { return fmt.Sprintf("%s/pump/%d", t.base, id) }

func (t topics) config(component, object string) string {
	return fmt.Sprintf("%s/%s/%s/%s/config", t.prefix, component, t.node, object)
}

func (t topics) device(version string) map[string]any {
	return map[string]any{
		"identifiers":  []string{t.node},
		"name":         "Bar-Pi",
		"manufacturer": "Bar-Pi",
		"model":        "Cocktail machine",
		"sw_version":   version,
	}
}

// entity builds a discovery payload with the fields every Bar-Pi entity shares.
func (t topics) entity(object, name, stateTopic string, version string, extra map[string]any) map[string]any {
	cfg := map[string]any{
		"name":               name,
		"unique_id":          t.node + "_" + object,
		"object_id":          t.node + "_" + object,
		"state_topic":        stateTopic,
		"availability_topic": t.available,
		"device":             t.device(version),
	}
	for k, v := range extra {
		cfg[k] = v
	}
	return cfg
}

// discoveryMessages describes the Home Assistant entities every Bar-Pi device has.
func discoveryMessages(t topics, version string) []message {
	sensor := func(object, name, stateTopic, field string, extra map[string]any) message {
		cfg := map[string]any{"value_template": "{{ value_json." + field + " }}"}
		for k, v := range extra {
			cfg[k] = v
		}
		return message{t.config("sensor", object), t.entity(object, name, stateTopic, version, cfg), true}
	}
	binary := func(object, name, stateTopic, field string, extra map[string]any) message {
		cfg := map[string]any{
			"value_template": "{{ 'ON' if value_json." + field + " else 'OFF' }}",
		}
		for k, v := range extra {
			cfg[k] = v
		}
		return message{t.config("binary_sensor", object), t.entity(object, name, stateTopic, version, cfg), true}
	}
	total := map[string]any{"state_class": "total_increasing"}
	measurement := map[string]any{"state_class": "measurement"}
	volume := func(class string) map[string]any {
		return map[string]any{"device_class": "volume", "unit_of_measurement": "mL", "state_class": class}
	}

	msgs := []message{
		sensor("status", "Status", t.state, "status", map[string]any{
			"icon":                  "mdi:glass-cocktail",
			"json_attributes_topic": t.state,
		}),
		sensor("recipe", "Current recipe", t.state, "recipe", map[string]any{"icon": "mdi:book-open-variant"}),
		sensor("progress", "Progress", t.state, "progress", map[string]any{
			"unit_of_measurement": "%", "state_class": "measurement", "icon": "mdi:progress-clock",
		}),
		binary("making", "Making a drink", t.state, "making", map[string]any{"device_class": "running"}),
		sensor("drinks_completed", "Drinks made", t.stats, "drinks_completed", merge(total, map[string]any{"icon": "mdi:cup"})),
		sensor("drinks_cancelled", "Drinks cancelled", t.stats, "drinks_cancelled", merge(total, map[string]any{"icon": "mdi:cup-off"})),
		sensor("drinks_24h", "Drinks last 24 hours", t.stats, "drinks_24h", merge(measurement, map[string]any{"icon": "mdi:cup"})),
		sensor("drinks_7d", "Drinks last 7 days", t.stats, "drinks_7d", merge(measurement, map[string]any{"icon": "mdi:cup"})),
		sensor("volume_total", "Volume dispensed", t.stats, "volume_total_ml", volume("total_increasing")),
		sensor("average_size", "Average drink size", t.stats, "average_size_ml", volume("measurement")),
		sensor("top_recipe", "Most popular recipe", t.stats, "top_recipe", map[string]any{"icon": "mdi:trophy"}),
		sensor("pump_fill_total", "Liquid in pumps", t.stats, "pump_fill_total_ml", volume("measurement")),
		sensor("low_pumps", "Low pumps", t.stats, "low_pumps", merge(measurement, map[string]any{"icon": "mdi:bottle-tonic-skull"})),
		sensor("version", "Version", t.stats, "version", map[string]any{"entity_category": "diagnostic", "icon": "mdi:tag"}),
		binary("update_available", "Update available", t.stats, "update_available", map[string]any{
			"device_class": "update", "entity_category": "diagnostic",
		}),
		{t.config("event", "production"), t.entity("production", "Production", t.event, version, map[string]any{
			"event_types":    models.EventTriggers,
			"value_template": "{{ value_json.event_type }}",
			"icon":           "mdi:glass-cocktail",
		}), true},
	}

	return msgs
}

func pumpObject(id int64) string { return fmt.Sprintf("pump_%d_level", id) }

// pumpDiscoveryMessages describes one level sensor per pump.
func pumpDiscoveryMessages(t topics, version string, pumps []models.Pump) []message {
	msgs := make([]message, 0, len(pumps))
	for _, p := range pumps {
		name := fmt.Sprintf("Pump %d", p.ID)
		if p.Name != nil && *p.Name != "" {
			name = *p.Name
		}
		stateTopic := t.pump(p.ID)
		object := pumpObject(p.ID)
		cfg := t.entity(object, name+" level", stateTopic, version, map[string]any{
			"value_template":        "{{ value_json.level_ml }}",
			"device_class":          "volume",
			"unit_of_measurement":   "mL",
			"state_class":           "measurement",
			"icon":                  "mdi:bottle-wine",
			"json_attributes_topic": stateTopic,
		})
		msgs = append(msgs, message{t.config("sensor", object), cfg, true})
	}
	return msgs
}

func merge(a, b map[string]any) map[string]any {
	out := make(map[string]any, len(a)+len(b))
	for k, v := range a {
		out[k] = v
	}
	for k, v := range b {
		out[k] = v
	}
	return out
}

// stateStatus maps a cocktail progress status onto the values Home Assistant shows.
func stateStatus(p *models.CocktailProgress) (status string, making bool) {
	if p == nil {
		return "idle", false
	}
	switch p.Status {
	case "pending", "in_progress":
		return "making", true
	case "paused":
		return "waiting_for_user", true
	case "completed":
		return "finished", false
	case "cancelled":
		return "canceled", false
	case "error":
		return "error", false
	default:
		return "idle", false
	}
}

func statePayload(p *models.CocktailProgress) map[string]any {
	status, making := stateStatus(p)
	payload := map[string]any{
		"status":   status,
		"making":   making,
		"recipe":   "",
		"progress": 0,
	}
	if p != nil {
		payload["recipe"] = p.RecipeName
		payload["progress"] = p.Progress
		payload["user"] = p.Username
		payload["step"] = p.CurrentStep
		payload["total_steps"] = p.TotalSteps
		payload["message"] = p.Message
	}
	return payload
}

func statsPayload(o *models.StatisticsOverview, version string, updateAvailable bool) map[string]any {
	topRecipe := ""
	if len(o.TopRecipes) > 0 {
		topRecipe = o.TopRecipes[0].RecipeName
	}
	return map[string]any{
		"drinks_completed":   o.Summary.CompletedOrders,
		"drinks_cancelled":   o.Summary.CancelledOrders,
		"drinks_24h":         o.Summary.OrdersLast24h,
		"drinks_7d":          o.Summary.OrdersLast7d,
		"volume_total_ml":    o.Summary.TotalVolumeDispensedMl,
		"average_size_ml":    int(o.Summary.AverageDrinkSizeMl + 0.5),
		"top_recipe":         topRecipe,
		"pump_fill_total_ml": o.Inventory.TotalPumpFillingMl,
		"low_pumps":          o.Inventory.LowLiquidPumps,
		"version":            version,
		"update_available":   updateAvailable,
	}
}

func pumpPayload(p models.Pump) map[string]any {
	ingredient := ""
	if p.CurrentIngredient != nil {
		ingredient = p.CurrentIngredient.Name
	}
	return map[string]any{
		"level_ml":   p.FillingLevelInMl,
		"ingredient": ingredient,
		"pumped_up":  p.IsPumpedUp,
	}
}
