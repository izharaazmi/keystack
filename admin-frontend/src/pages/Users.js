import React, {useState, useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from 'react-query';
import {Search, Shield, UserX, UserCheck, Users as UsersIcon, X, Plus} from 'lucide-react';
import {api} from '../utils/api';
import toast from 'react-hot-toast';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });
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

  const { data: teams } = useQuery('teams', async () => {
    const response = await api.get('/teams');
    return response.data.groups;
  });

  const { data: pendingUsers } = useQuery('pendingUsers', async () => {
    const response = await api.get('/users/pending');
    return response.data.users;
  });

  // Auto-set role to admin if it's the first user
  useEffect(() => {
    if (users && users.length === 0) {
      setNewUser(prev => ({ ...prev, role: 'admin' }));
    }
  }, [users]);

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

  const batchAssignMutation = useMutation(
    ({ teamId, userIds }) => api.post(`/teams/${teamId}/batch-add-members`, { userIds }),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('teams');
        queryClient.invalidateQueries('users');
        setSelectedUsers([]);
        setShowTeamModal(false);
        setSelectedTeam('');
        toast.success(`Successfully added ${data.data.added} users to team${data.data.skipped > 0 ? ` (${data.data.skipped} already in team)` : ''}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to assign users to team');
      },
    }
  );

  const createUserMutation = useMutation(
    (userData) => api.post('/auth/register', userData),
    {
      onSuccess: () => {
        toast.success('User created successfully');
        queryClient.invalidateQueries('users');
        setShowUserModal(false);
        setNewUser({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'user'
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create user');
      }
    }
  );

  const updateUserRoleMutation = useMutation(
    ({ userId, role }) => api.patch(`/users/${userId}/role`, { role }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User role updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update user role');
      }
    }
  );

  const approveUserMutation = useMutation(
    (userId) => api.patch(`/users/${userId}/approve`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        queryClient.invalidateQueries('pendingUsers');
        toast.success('User approved successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve user');
      }
    }
  );

  const handleToggleStatus = (user) => {
    if (user.isActive) {
      deactivateMutation.mutate(user.id);
    } else {
      activateMutation.mutate(user.id);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleBatchAssign = () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to assign');
      return;
    }
    if (!selectedTeam) {
      toast.error('Please select a team');
      return;
    }
    batchAssignMutation.mutate({ teamId: selectedTeam, userIds: selectedUsers });
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast.error('Please fill in all required fields');
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleRoleChange = (userId, newRole) => {
    // Check if this would leave no admins
    const currentAdmins = users.filter(user => user.role === 'admin' && user.id !== userId);
    if (newRole === 'user' && currentAdmins.length === 0) {
      toast.error('Cannot change role: At least one admin must remain');
      return;
    }
    updateUserRoleMutation.mutate({ userId, role: newRole });
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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts and permissions
          </p>
        </div>
        <button
          onClick={() => setShowUserModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
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

      {/* Batch Assignment Controls */}
      {selectedUsers.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setShowTeamModal(true)}
                className="btn btn-primary btn-sm"
                disabled={batchAssignMutation.isLoading}
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                Assign to Team
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="btn btn-secondary btn-sm"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users?.length && users?.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
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
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
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
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleRoleChange(user.id, 'user')}
                          disabled={user.role === 'user' || updateUserRoleMutation.isLoading}
                          className={`px-2 py-1 text-xs rounded ${
                            user.role === 'user'
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                          title="Change to User role"
                        >
                          User
                        </button>
                        <button
                          onClick={() => handleRoleChange(user.id, 'admin')}
                          disabled={user.role === 'admin' || updateUserRoleMutation.isLoading}
                          className={`px-2 py-1 text-xs rounded ${
                            user.role === 'admin'
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                          title="Change to Admin role"
                        >
                          Admin
                        </button>
                      </div>
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

      {/* Pending Users Section */}
      {pendingUsers && pendingUsers.length > 0 && (
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
            <p className="text-sm text-gray-500">
              Users waiting for admin approval to access the system
            </p>
          </div>
          
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Email Verified</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
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
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approveUserMutation.mutate(user.id)}
                            disabled={!user.isEmailVerified || approveUserMutation.isLoading}
                            className={`px-3 py-1 text-sm rounded ${
                              !user.isEmailVerified
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={!user.isEmailVerified ? 'User must verify email first' : 'Approve user'}
                          >
                            {approveUserMutation.isLoading ? 'Approving...' : 'Approve'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Team Selection Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} to Team
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Team
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Choose a team...</option>
                  {teams?.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowTeamModal(false);
                    setSelectedTeam('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchAssign}
                  disabled={!selectedTeam || batchAssignMutation.isLoading}
                  className="btn btn-primary"
                >
                  {batchAssignMutation.isLoading ? 'Assigning...' : 'Assign to Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4" autoComplete="off">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    className="input w-full"
                    autoComplete="off"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    className="input w-full"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="input w-full"
                  autoComplete="off"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="input w-full"
                  autoComplete="new-password"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Role
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="user"
                      checked={newUser.role === 'user'}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">User</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={newUser.role === 'admin'}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Admin</span>
                  </label>
                </div>
                {users && users.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    The first user will automatically be assigned admin privileges.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isLoading}
                  className="btn btn-primary"
                >
                  {createUserMutation.isLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
