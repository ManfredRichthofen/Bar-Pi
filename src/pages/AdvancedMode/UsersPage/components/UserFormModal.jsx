import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';

export const UserFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  error,
  isEditing = false,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit User' : 'Create New User'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={onChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
            </Label>
            <Input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={onChange}
              required={!isEditing}
              placeholder={isEditing ? 'Leave blank to keep current password' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminLevel">Access Level</Label>
            <Select
              value={formData.adminLevel.toString()}
              onValueChange={(value) =>
                onChange({
                  target: {
                    name: 'adminLevel',
                    value: parseInt(value),
                  },
                })
              }
            >
              <SelectTrigger id="adminLevel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">User</SelectItem>
                <SelectItem value="1">Recipe Creator</SelectItem>
                <SelectItem value="2">Pump & Ingredient Editor</SelectItem>
                <SelectItem value="3">Admin</SelectItem>
                <SelectItem value="4">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Account Security Settings
            </Label>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="accountLocked"
                name="accountLocked"
                checked={formData.accountLocked}
                onChange={onChange}
                className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <div className="flex-1">
                <Label htmlFor="accountLocked" className="text-sm font-medium cursor-pointer">
                  Lock Account
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.accountLocked 
                    ? "User will be unable to log in" 
                    : "User can log in and access the system"
                  }
                </p>
              </div>
            </div>

            {formData.accountLocked && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <Lock className="h-4 w-4 text-red-600" />
                <span className="text-xs text-red-800">
                  ⚠️ This user will be completely locked out and unable to access the system
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
