import { User as UserIcon, UserPlus } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

export const EmptyUserState = ({ onAddUser }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-muted-foreground mb-4">
        <UserIcon size={64} />
      </div>
      <h3 className="text-lg font-semibold mb-2">No users found</h3>
      <p className="text-muted-foreground text-center text-sm mb-4">
        Get started by creating your first user
      </p>
      <Button onClick={onAddUser}>
        <UserPlus size={16} className="mr-2" />
        Add User
      </Button>
    </div>
  );
};
