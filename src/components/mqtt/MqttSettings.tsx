import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Radio } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import SystemService, {
  type MqttSettingsResponse,
} from '../../services/system.service';

const queryKey = ['mqtt-settings'] as const;

const errorMessage = (error: unknown, fallback: string): string => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return err?.response?.data?.message || err?.message || fallback;
};

const StatusBadge: React.FC<{ settings: MqttSettingsResponse }> = ({
  settings,
}) => {
  if (!settings.enabled) return <Badge variant="secondary">Disabled</Badge>;
  if (settings.status.connected)
    return <Badge variant="success">Connected</Badge>;
  return <Badge variant="destructive">Disconnected</Badge>;
};

export const MqttSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey,
    queryFn: () => SystemService.getMqttSettings(),
    // Keep the connection badge fresh while the page is open.
    refetchInterval: 10000,
  });

  const [enabled, setEnabled] = useState(false);
  const [brokerUrl, setBrokerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [baseTopic, setBaseTopic] = useState('barpi');
  const [discoveryPrefix, setDiscoveryPrefix] = useState('homeassistant');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Fill the form once; later refetches only update the status badge.
  useEffect(() => {
    if (!settings || loaded) return;
    setEnabled(settings.enabled);
    setBrokerUrl(settings.brokerUrl);
    setUsername(settings.username);
    setBaseTopic(settings.baseTopic);
    setDiscoveryPrefix(settings.discoveryPrefix);
    setLoaded(true);
  }, [settings, loaded]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await SystemService.setMqttSettings({
        enabled,
        brokerUrl,
        username,
        baseTopic,
        discoveryPrefix,
        ...(passwordChanged ? { password } : {}),
      });
      queryClient.setQueryData(queryKey, saved);
      setPassword('');
      setPasswordChanged(false);
      if (saved.enabled && !saved.status.connected) {
        toast.error(
          saved.status.error || 'Saved, but the broker is unreachable',
        );
      } else {
        toast.success('MQTT settings saved');
      }
    } catch (err) {
      setError(errorMessage(err, 'Failed to save MQTT settings'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Radio className="size-6" />
            Home Assistant (MQTT)
          </span>
          {settings && <StatusBadge settings={settings} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-foreground-muted">
          Publishes drink status, statistics, pump levels and production events
          to your MQTT broker. Home Assistant finds the device automatically via
          MQTT discovery.
        </p>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {settings?.enabled &&
          !settings.status.connected &&
          settings.status.error && (
            <Alert variant="destructive">
              <AlertDescription>{settings.status.error}</AlertDescription>
            </Alert>
          )}

        <div className="flex items-center justify-between">
          <Label>Enable MQTT</Label>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mqtt-broker">Broker URL</Label>
          <Input
            id="mqtt-broker"
            value={brokerUrl}
            onChange={(e) => setBrokerUrl(e.target.value)}
            placeholder="mqtt://homeassistant.local:1883"
          />
          <p className="text-sm text-foreground-muted">
            Use mqtts:// for TLS. The port defaults to 1883 (8883 for TLS).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mqtt-username">Username</Label>
            <Input
              id="mqtt-username"
              value={username}
              autoComplete="off"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mqtt-password">Password</Label>
            <Input
              id="mqtt-password"
              type="password"
              value={password}
              autoComplete="new-password"
              placeholder={settings?.passwordSet ? 'Unchanged' : ''}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordChanged(true);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mqtt-base">Base topic</Label>
            <Input
              id="mqtt-base"
              value={baseTopic}
              onChange={(e) => setBaseTopic(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mqtt-discovery">Discovery prefix</Label>
            <Input
              id="mqtt-discovery"
              value={discoveryPrefix}
              onChange={(e) => setDiscoveryPrefix(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
