import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { UserPlus, Edit, Trash2, Shield, User as UserIcon } from 'lucide-react';
import UserService from '../../../services/user.service';

const UserPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'USER',
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
        role: 'USER',
      });
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">User Management</h1>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary btn-sm"
            >
              <UserPlus size={16} className="mr-2" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto">
          {error && (
            <div className="alert alert-error mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="text-base-content/40 mb-4">
                <UserIcon size={64} />
              </div>
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-base-content/60 text-center text-sm mb-4">
                Get started by creating your first user
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsModalOpen(true)}
              >
                <UserPlus size={16} className="mr-2" />
                Add User
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="card bg-base-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-base-200"
                >
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="avatar placeholder">
                          <div className="bg-primary text-primary-content rounded-full w-12 h-12">
                            <span className="text-lg font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="card-title text-base font-bold text-base-content/90 line-clamp-1">
                            {user.username}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            {user.role === 'ADMIN' ? (
                              <>
                                <Shield size={14} className="text-error" />
                                <span className="badge badge-error badge-sm">
                                  Admin
                                </span>
                              </>
                            ) : (
                              <>
                                <UserIcon size={14} className="text-primary" />
                                <span className="badge badge-primary badge-sm">
                                  User
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card-actions justify-end mt-4 pt-4 border-t border-base-200">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {}}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => {}}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <dialog
        id="create_user_modal"
        className={`modal ${isModalOpen ? 'modal-open' : ''}`}
      >
        <div className="modal-box w-11/12 max-w-xl p-6">
          <form method="dialog">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
          </form>

          <h3 className="font-bold text-lg mb-6">Create New User</h3>

          {error && (
            <div className="alert alert-error mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Username</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Role</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="select select-bordered"
                required
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="modal-action">
              <button type="submit" className="btn btn-primary">
                Create User
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setIsModalOpen(false)}>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default UserPage;
