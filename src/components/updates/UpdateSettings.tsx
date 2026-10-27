import { AlertCircle, ChevronDown, Settings2 } from 'lucide-react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export type UpdateChannel = 'release' | 'prerelease';

const CHANNELS: UpdateChannel[] = ['release', 'prerelease'];

export const UpdateSettingsSection: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { t } = useTranslation();
  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 rounded-md py-1 text-left font-semibold outline-none focus-visible:ring-[3px]">
        <span className="flex items-center gap-2">
          <Settings2 className="size-6" />
          {t('settings.updates.settings_title', 'Update Settings')}
        </span>
        <ChevronDown className="size-6 text-foreground-muted transition-transform group-data-[panel-open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
        <div className="space-y-4 pt-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const SettingRow: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}> = ({ title, description, checked, disabled, onChange }) => (
  <div className="flex items-center justify-between gap-4">
    <div className={disabled ? 'opacity-50' : undefined}>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-foreground-muted">{description}</p>
    </div>
    <Switch
      checked={checked}
      disabled={disabled}
      onCheckedChange={(value) => onChange(value)}
    />
  </div>
);

export const ChannelSelect: React.FC<{
  value: UpdateChannel;
  disabled?: boolean;
  onChange: (channel: UpdateChannel) => void;
}> = ({ value, disabled, onChange }) => {
  const { t } = useTranslation();
  const label = (channel: UpdateChannel) =>
    channel === 'prerelease'
      ? t('settings.updates.channel_prerelease', 'Pre-release')
      : t('settings.updates.channel_release', 'Release');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
      <div className={disabled ? 'opacity-50' : undefined}>
        <p className="font-medium">
          {t('settings.updates.channel', 'Update channel')}
        </p>
        <p className="text-sm text-foreground-muted">
          {t(
            'settings.updates.channel_desc',
            'Pre-release also offers beta and release-candidate versions.',
          )}
        </p>
      </div>
      <Select
        value={value}
        disabled={disabled}
        onValueChange={(v) => v && onChange(v as UpdateChannel)}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue>{label(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {CHANNELS.map((channel) => (
            <SelectItem key={channel} value={channel}>
              {label(channel)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const parseReleaseNotes = (notes?: string) => {
  if (!notes) return [];

  return notes
    .split(/(?=^#{1,6}\s)/m)
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section, sectionIndex) => {
      const [first, ...rest] = section.split('\n');
      const hasHeader = first.startsWith('#');
      const title = hasHeader ? first.replace(/^#+\s+/, '') : '';
      const lines = (hasHeader ? rest : [first, ...rest])
        .filter((line) => line.trim())
        .map((line, lineIndex) => {
          const trimmed = line.trim();
          const text = trimmed.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
          return {
            id: `${sectionIndex}-${lineIndex}`,
            text: /^[-*]\s/.test(trimmed) ? `• ${text.substring(2)}` : text,
          };
        });
      return { id: String(sectionIndex), title, lines };
    });
};

export const ReleaseNotes: React.FC<{ notes?: string }> = ({ notes }) => {
  const { t } = useTranslation();
  const sections = parseReleaseNotes(notes);
  if (sections.length === 0) return null;

  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <AlertCircle className="size-6" />
        {t('settings.updates.release_notes', 'Release Notes')}
      </h3>
      <div className="bg-surface-sunken rounded-lg p-4 space-y-4 max-h-80 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.id} className="space-y-2">
            {section.title && (
              <h4 className="font-semibold text-sm text-primary">
                {section.title}
              </h4>
            )}
            <div className="space-y-1 ml-4">
              {section.lines.map((line) => (
                <div key={line.id} className="text-sm text-foreground-muted">
                  {line.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const formatRelativeTime = (date: Date, locale?: string) => {
  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
  if (Math.abs(diffMinutes) < 60 * 24)
    return rtf.format(Math.round(diffMinutes / 60), 'hour');
  return rtf.format(Math.round(diffMinutes / 1440), 'day');
};
