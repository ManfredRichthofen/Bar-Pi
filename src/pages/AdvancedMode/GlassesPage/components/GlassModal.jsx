import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

function GlassModal({ show, onHide, onSave, glass }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    size: 250,
    description: '',
  });

  useEffect(() => {
    if (glass) {
      setFormData({
        id: glass.id,
        name: glass.name || '',
        size: glass.size ?? glass.sizeInMl ?? 250,
        description: glass.description || '',
      });
    } else {
      setFormData({
        name: '',
        size: 250,
        description: '',
      });
    }
  }, [glass]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const size = Number(formData.size) || 250;
    onSave({
      ...formData,
      size,
      sizeInMl: size,
    });
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{glass ? 'Edit Glass' : 'Add Glass'}</DialogTitle>
            <DialogDescription>
              {glass
                ? 'Update the glass details below.'
                : 'Add a new glass to your collection.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('glass_modal.name')}</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="size">{t('glass_modal.size', 'Size (ml)')}</Label>
              <Input
                id="size"
                name="size"
                type="number"
                min={10}
                max={5000}
                value={formData.size}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">
                {t('glass_modal.description')}
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onHide}>
              {t('glass_modal.cancel')}
            </Button>
            <Button type="submit">{t('glass_modal.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default GlassModal;
