import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  UserPlus,
  Edit,
  Trash2,
  Shield,
  User as UserIcon,
  Crown,
  Settings,
  Wrench,
  Lock,
  Check,
} from 'lucide-react';
import { mapAdminLevelToRole, getRoleDisplayName } from '@/utils/roleAccess';

export const UserCard = ({ user, onEdit, onDelete }) => {
  const getRoleIcon = (adminLevel) => {
    switch (adminLevel) {
      case 4:
        return <Crown size={16} className="text-yellow-500" />;
      case 3:
        return <Shield size={16} className="text-purple-500" />;
      case 2:
        return <Wrench size={16} className="text-orange-500" />;
      case 1:
        return <Settings size={16} className="text-blue-500" />;
      default:
        return <UserIcon size={16} className="text-muted-foreground" />;
    }
  };

  const getRoleBadgeClass = (adminLevel) => {
    switch (adminLevel) {
      case 4:
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 3:
        return 'bg-purple-500 hover:bg-purple-600';
      case 2:
        return 'bg-orange-500 hover:bg-orange-600';
      case 1:
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return '';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-2xl font-bold">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2 w-full">
            <h3 className="text-lg font-bold truncate">
              {user.username}
            </h3>

            <div className="flex items-center justify-center gap-2">
              {getRoleIcon(user.adminLevel)}
              <Badge
                variant="default"
                className={`text-xs font-semibold ${getRoleBadgeClass(user.adminLevel)}`}
              >
                {getRoleDisplayName(mapAdminLevelToRole(user.adminLevel))}
              </Badge>
            </div>

            {/* Account Status Badge */}
            <div className="flex items-center justify-center">
              {user.accountNonLocked === false ? (
                <Badge variant="destructive" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </Badge>
              ) : (
                <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-2 p-4 bg-muted/30 border-t">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onEdit(user)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Edit size={16} className="mr-2" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(user)}
          className="text-destructive hover:text-destructive hover:bg-red-50"
        >
          <Trash2 size={16} className="mr-2" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};
