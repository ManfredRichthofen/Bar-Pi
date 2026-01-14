import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  UserPlus,
  Edit,
  Trash2,
  Shield,
  User as UserIcon,
  Crown,
  Settings,
  Wrench,
} from 'lucide-react';
import UserService from '../../../services/user.service';
import {
  mapAdminLevelToRole,
  getRoleDisplayName,
} from '../../../utils/roleAccess';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const UserPage = () => {
  const navigate = useNavigate({ from: '/users' });
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    adminLevel: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await UserService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      await UserService.createUser(formData, token);
      await loadUsers();
      setFormData({
        username: '',
        password: '',
        adminLevel: 1,
      });
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">User Management</h1>
            <Button onClick={() => setIsModalOpen(true)} size="sm">
              <UserPlus size={16} className="mr-2" />
              Add User
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="text-muted-foreground mb-4">
                <UserIcon size={64} />
              </div>
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground text-center text-sm mb-4">
                Get started by creating your first user
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <UserPlus size={16} className="mr-2" />
                Add User
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {users.map((user) => (
                <Card
                  key={user.id}
                  className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
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
                          {user.adminLevel === 4 ? (
                            <>
                              <Crown size={16} className="text-yellow-500" />
                              <Badge
                                variant="default"
                                className="text-xs bg-yellow-500 hover:bg-yellow-600 font-semibold"
                              >
                                {getRoleDisplayName(
                                  mapAdminLevelToRole(user.adminLevel),
                                )}
                              </Badge>
                            </>
                          ) : user.adminLevel === 3 ? (
                            <>
                              <Shield size={16} className="text-purple-500" />
                              <Badge
                                variant="default"
                                className="text-xs bg-purple-500 hover:bg-purple-600 font-semibold"
                              >
                                {getRoleDisplayName(
                                  mapAdminLevelToRole(user.adminLevel),
                                )}
                              </Badge>
                            </>
                          ) : user.adminLevel === 2 ? (
                            <>
                              <Wrench size={16} className="text-orange-500" />
                              <Badge
                                variant="default"
                                className="text-xs bg-orange-500 hover:bg-orange-600 font-semibold"
                              >
                                {getRoleDisplayName(
                                  mapAdminLevelToRole(user.adminLevel),
                                )}
                              </Badge>
                            </>
                          ) : user.adminLevel === 1 ? (
                            <>
                              <Settings size={16} className="text-blue-500" />
                              <Badge
                                variant="default"
                                className="text-xs bg-blue-500 hover:bg-blue-600 font-semibold"
                              >
                                {getRoleDisplayName(
                                  mapAdminLevelToRole(user.adminLevel),
                                )}
                              </Badge>
                            </>
                          ) : (
                            <>
                              <UserIcon
                                size={16}
                                className="text-muted-foreground"
                              />
                              <Badge
                                variant="secondary"
                                className="text-xs font-semibold"
                              >
                                {getRoleDisplayName(
                                  mapAdminLevelToRole(user.adminLevel),
                                )}
                              </Badge>
                            </>
                          )}
                        </div>

                        {user.accountNonLocked === false && (
                          <Badge variant="destructive" className="text-xs">
                            Locked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-center gap-2 p-4 bg-muted/30 border-t">
                    <Button variant="ghost" size="sm" onClick={() => {}}>
                      <Edit size={16} className="mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {}}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
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
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminLevel">Access Level</Label>
              <Select
                value={formData.adminLevel.toString()}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    adminLevel: parseInt(value),
                  }))
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserPage;
