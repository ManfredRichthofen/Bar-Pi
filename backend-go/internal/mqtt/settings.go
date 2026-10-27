package mqtt

import (
	"errors"
	"net/url"
	"strings"

	"github.com/ManfredRichthofen/Bar-Pi/backend-go/internal/models"
)

const (
	DefaultBaseTopic       = "barpi"
	DefaultDiscoveryPrefix = "homeassistant"
)

// Normalize validates the settings and fills in defaults. Broker details are only
// required when MQTT is enabled so a disabled config can still be saved half-filled.
func Normalize(s models.MQTTSettings) (models.MQTTSettings, error) {
	s.BrokerURL = strings.TrimSpace(s.BrokerURL)
	s.Username = strings.TrimSpace(s.Username)
	s.BaseTopic = strings.TrimSpace(s.BaseTopic)
	s.DiscoveryPrefix = strings.TrimSpace(s.DiscoveryPrefix)
	if s.BaseTopic == "" {
		s.BaseTopic = DefaultBaseTopic
	}
	if s.DiscoveryPrefix == "" {
		s.DiscoveryPrefix = DefaultDiscoveryPrefix
	}
	if err := validateTopic("Base topic", s.BaseTopic); err != nil {
		return s, err
	}
	if err := validateTopic("Discovery prefix", s.DiscoveryPrefix); err != nil {
		return s, err
	}

	if s.BrokerURL == "" {
		if s.Enabled {
			return s, errors.New("Broker URL is required")
		}
		return s, nil
	}
	broker, err := normalizeBrokerURL(s.BrokerURL)
	if err != nil {
		if s.Enabled {
			return s, err
		}
		return s, nil
	}
	s.BrokerURL = broker
	return s, nil
}

func validateTopic(label, topic string) error {
	if len(topic) > 64 {
		return errors.New(label + " must be at most 64 characters")
	}
	if strings.ContainsAny(topic, "+#\x00 ") || strings.HasPrefix(topic, "/") || strings.HasSuffix(topic, "/") {
		return errors.New(label + " must not contain spaces, + or #, and must not start or end with /")
	}
	return nil
}

// normalizeBrokerURL maps mqtt:// and mqtts:// onto the schemes the client understands
// and adds the default port.
func normalizeBrokerURL(raw string) (string, error) {
	u, err := url.Parse(raw)
	if err != nil || u.Host == "" {
		return "", errors.New("Broker URL must look like mqtt://host:1883")
	}
	defaultPort := "1883"
	switch strings.ToLower(u.Scheme) {
	case "mqtt", "tcp":
		u.Scheme = "tcp"
	case "mqtts", "ssl", "tls":
		u.Scheme, defaultPort = "ssl", "8883"
	case "ws":
		defaultPort = "80"
	case "wss":
		defaultPort = "443"
	default:
		return "", errors.New("Broker URL scheme must be mqtt, mqtts, ws or wss")
	}
	if u.Port() == "" {
		u.Host = u.Hostname() + ":" + defaultPort
	}
	return u.String(), nil
}
