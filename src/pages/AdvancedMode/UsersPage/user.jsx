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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PageHeader,
  EmptyState,
  ListCard,
  ActionButtons,
} from '@/components/AdvancedMode';
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
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    adminLevel: 0,
    accountLocked: false,
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

  const getRoleIcon = (adminLevel) => {
    switch (adminLevel) {
      case 4:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 3:
        return <Shield className="h-4 w-4 text-purple-500" />;
      case 2:
        return <Wrench className="h-4 w-4 text-orange-500" />;
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
        // Update existing user
        const updateData = {
          username: formData.username,
          adminLevel: formData.adminLevel,
          accountNonLocked: !formData.accountLocked,
        };
        // Only include password if provided and not empty
        if (formData.password && formData.password.trim() !== '') {
          updateData.password = formData.password;
        }
        await UserService.updateUser(editingUser.id, updateData, token);
      } else {
        // Create new user
        const createData = {
          username: formData.username,
          password: formData.password,
          adminLevel: formData.adminLevel,
          accountNonLocked: !formData.accountLocked,
        };
        await UserService.createUser(createData, token);
      }

      await loadUsers();
      setFormData({
        username: '',
        password: '',
        adminLevel: 1,
        accountLocked: false,
      });
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
            <UserPlus className="mr-2 h-4 w-4" />
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
                        <Badge
                          variant="default"
                          className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                        >
                          {getRoleDisplayName(
                            mapAdminLevelToRole(user.adminLevel),
                          )}
                        </Badge>
                      </>
                    }
                    metadata={
                      <>
                        {user.accountNonLocked === false ? (
                          <Badge
                            variant="destructive"
                            className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                          >
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </Badge>
                        ) : (
                          <Badge
                            variant="default"
                            className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-800 hover:bg-green-200"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </>
                    }
                    actions={
                      <ActionButtons
                        actions={[
                          {
                            icon: <Edit className="h-4 w-4" />,
                            label: 'Edit user',
                            onClick: (e) => {
                              e.stopPropagation();
                              handleEditUser(user);
                            },
                          },
                          {
                            icon: (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            ),
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
          setFormData({
            username: '',
            password: '',
            adminLevel: 1,
            accountLocked: false,
          });
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
