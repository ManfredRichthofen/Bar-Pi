import { useNavigate } from '@tanstack/react-router';
import { UserPlus } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import UserService from '@/services/user.service';
import { DeleteUserDialog } from './components/DeleteUserDialog';
import { EmptyUserState } from './components/EmptyUserState';
import { UserCard } from './components/UserCard';
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
            <EmptyUserState onAddUser={() => setIsModalOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                />
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
