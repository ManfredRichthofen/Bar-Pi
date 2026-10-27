import { useNavigate } from '@tanstack/react-router';
import {
  Check,
  Crown,
  Edit,
  Lock,
  Shield,
  Trash2,
  UserPlus,
  Wrench,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  ActionButtons,
  EmptyState,
  ListCard,
  PageHeader,
} from '@/components/AdvancedMode';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import UserService from '@/services/user.service';
import { getRoleDisplayName, mapAdminLevelToRole } from '@/utils/roleAccess';
import { DeleteUserDialog } from './components/DeleteUserDialog';
import { UserFormModal } from './components/UserFormModal';

const UserPage = () => {
  const navigate = useNavigate({ from: '/users' });
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const emptyForm = {
    username: '',
    password: '',
    pin: '',
    clearPin: false,
    hasPin: false,
    maxDrinksPerDay: 0,
    adminLevel: 0,
    accountLocked: false,
  };
  const [formData, setFormData] = useState(emptyForm);
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

  const getRoleIcon = (adminLevel) => {
    switch (adminLevel) {
      case 4:
        return <Crown className="size-6 text-warning" />;
      case 3:
        return <Shield className="size-6 text-info" />;
      case 2:
        return <Wrench className="size-6 text-warning" />;
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      pin: '',
      clearPin: false,
      hasPin: !!user.hasPin,
      maxDrinksPerDay: user.maxDrinksPerDay || 0,
      adminLevel: user.adminLevel,
      accountLocked: user.accountNonLocked === false,
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await UserService.deleteUser(userToDelete.id, token);
      await loadUsers();
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSubmit = async () => {
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (editingUser) {
        const updateData = {
          username: formData.username,
          adminLevel: formData.adminLevel,
          accountNonLocked: !formData.accountLocked,
          maxDrinksPerDay: Number(formData.maxDrinksPerDay) || 0,
          clearPin: !!formData.clearPin,
        };
        if (formData.password && formData.password.trim() !== '') {
          updateData.password = formData.password;
        }
        if (formData.pin && formData.pin.trim() !== '' && !formData.clearPin) {
          updateData.pin = formData.pin.trim();
        }
        await UserService.updateUser(editingUser.id, updateData, token);
      } else {
        const createData = {
          username: formData.username,
          password: formData.password,
          adminLevel: formData.adminLevel,
          accountNonLocked: !formData.accountLocked,
          maxDrinksPerDay: Number(formData.maxDrinksPerDay) || 0,
        };
        if (formData.pin && formData.pin.trim() !== '') {
          createData.pin = formData.pin.trim();
        }
        await UserService.createUser(createData, token);
      }

      await loadUsers();
      setFormData({ ...emptyForm, adminLevel: 1 });
      setEditingUser(null);
      setIsModalOpen(false);
    } catch (err) {
      if (err.message && err.message.includes('required')) {
        setError(err.message);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            `Failed to ${editingUser ? 'update' : 'create'} user`,
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="User Management"
        action={
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <UserPlus className="mr-2 size-6" />
            Add User
          </Button>
        }
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="max-w-screen-2xl mx-auto">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {users.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="h-16 w-16" />}
              title="No users found"
              description="Get started by creating your first user"
              actions={
                <Button size="lg" onClick={() => setIsModalOpen(true)}>
                  <UserPlus className="mr-2" />
                  Add User
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="px-2 sm:px-4 py-1.5 sm:py-2">
                  <ListCard
                    title={user.username}
                    badges={
                      <>
                        {getRoleIcon(user.adminLevel)}
                        <Badge variant="default" className="text-sm">
                          {getRoleDisplayName(
                            mapAdminLevelToRole(user.adminLevel),
                          )}
                        </Badge>
                      </>
                    }
                    metadata={
                      <>
                        {user.accountNonLocked === false ? (
                          <Badge variant="destructive" className="text-sm">
                            <Lock className="size-4 mr-1" />
                            Locked
                          </Badge>
                        ) : (
                          <Badge
                            variant="default"
                            className="text-sm bg-success-tint text-success hover:bg-success-tint"
                          >
                            <Check className="size-4 mr-1" />
                            Active
                          </Badge>
                        )}
                        {user.hasPin && (
                          <Badge variant="outline" className="text-sm">
                            PIN
                          </Badge>
                        )}
                        {user.maxDrinksPerDay > 0 && (
                          <Badge variant="outline" className="text-sm">
                            {user.maxDrinksPerDay}/day
                          </Badge>
                        )}
                      </>
                    }
                    actions={
                      <ActionButtons
                        actions={[
                          {
                            icon: <Edit className="size-6" />,
                            label: 'Edit user',
                            onClick: (e) => {
                              e.stopPropagation();
                              handleEditUser(user);
                            },
                          },
                          {
                            icon: <Trash2 className="size-6 text-danger" />,
                            label: 'Delete user',
                            onClick: (e) => {
                              e.stopPropagation();
                              handleDeleteUser(user);
                            },
                          },
                        ]}
                      />
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit User Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
          setFormData({ ...emptyForm, adminLevel: 1 });
        }}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleChange}
        error={error}
        isEditing={!!editingUser}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setUserToDelete(null);
          setError('');
        }}
        onConfirm={confirmDelete}
        userToDelete={userToDelete}
        error={error}
      />
    </div>
  );
};

export default UserPage;
