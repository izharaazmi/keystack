import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Search, UserPlus, Shield, ShieldCheck, UserX, UserCheck } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery(
    ['users', searchTerm, roleFilter, statusFilter],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('isActive', statusFilter);
      
      const response = await api.get(`/users?${params.toString()}`);
      return response.data.users;
    }
  );

  const activateMutation = useMutation(
    (id) => api.patch(`/users/${id}/activate`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User activated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to activate user');
      },
    }
  );

  const deactivateMutation = useMutation(
    (id) => api.patch(`/users/${id}/deactivate`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User deactivated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to deactivate user');
      },
    }
  );

  const handleToggleStatus = (user) => {
    if (user.isActive) {
      deactivateMutation.mutate(user.id);
    } else {
      activateMutation.mutate(user.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        <div className="sm:w-32">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <div className="sm:w-32">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Email Verified</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id}>
                  <td className="font-medium">
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isEmailVerified 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.isEmailVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`${
                          user.isActive 
                            ? 'text-red-600 hover:text-red-800'
                            : 'text-green-600 hover:text-green-800'
                        }`}
                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.isActive ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users?.length === 0 && (
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default Users;
