import { Loader2, type LucideIcon } from 'lucide-react';
import SimplePageEnter from '@/components/simple-mode/SimplePageEnter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type SimpleStateCardProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

/** Full-page loading / empty / error card for simple-mode pages. */
const SimpleStateCard = ({
  title,
  description,
  icon: Icon,
  loading = false,
  actionLabel,
  onAction,
}: SimpleStateCardProps) => (
  <div
    className="min-h-screen bg-background flex items-center justify-center p-4"
    aria-busy={loading || undefined}
  >
    <SimplePageEnter className="w-full max-w-md">
      <Card>
        <CardContent className="pt-6 text-center">
          {loading ? (
            <Loader2 className="size-12 mx-auto mb-4 animate-spin text-primary" />
          ) : (
            Icon && (
              <Icon className="size-16 mx-auto mb-4 text-foreground-muted" />
            )
          )}
          <h2
            className="text-xl font-bold mb-2"
            role={loading ? 'status' : undefined}
          >
            {title}
          </h2>
          {description && (
            <p className="text-foreground-muted mb-6">{description}</p>
          )}
          {actionLabel && onAction && (
            <Button size="lg" className="w-full" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </SimplePageEnter>
  </div>
);

export default SimpleStateCard;
