import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {useQuery, useMutation, useQueryClient} from 'react-query';
import {useSearchParams} from 'react-router-dom';
import {Search, Shield, UserX, UserCheck, Users as UsersIcon, Plus, ChevronUp, ChevronDown, X} from 'lucide-react';
import {api} from '../utils/api';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import TeamAssignmentModal from '../components/TeamAssignmentModal';
import CreateUserModal from '../components/CreateUserModal';

const Users = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const queryClient = useQueryClient();

  // Initialize team filter from URL parameters
  useEffect(() => {
    const teamParam = searchParams.get('team');
    if (teamParam) {
      setTeamFilter(teamParam);
    }
  }, [searchParams]);

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  }, [sortField, sortDirection]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const SortableHeader = useCallback(({ field, children, align = 'left' }) => {
    const alignmentClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
    return (
      <th 
        className={`cursor-pointer hover:bg-gray-50 select-none ${alignmentClass}`}
        onClick={() => handleSort(field)}
      >
        <div className={`flex items-center space-x-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span>{children}</span>
          {sortField === field && (
            sortDirection === 'asc' ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </th>
    );
  }, [handleSort, sortField, sortDirection]);

  const { data: usersData, isLoading } = useQuery(
    ['users', debouncedSearchTerm, roleFilter, statusFilter, teamFilter, sortField, sortDirection, currentPage, pageSize],
    async () => {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('is_active', statusFilter);
      if (teamFilter) params.append('team_id', teamFilter);
      params.append('sort_field', sortField);
      params.append('sort_direction', sortDirection);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      
      const response = await api.get(`/users?${params.toString()}`);
      return response.data;
    },
    {
      staleTime: 0,
      cacheTime: 0,
      refetchOnWindowFocus: false,
    }
  );

  const users = useMemo(() => usersData?.users || [], [usersData?.users]);
  const pagination = usersData?.pagination;

  const { data: teams } = useQuery('teams', async () => {
    const response = await api.get('/teams');
    return response.data.groups;
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users;
  }, [users]);

  // Separate memoized table component that only re-renders when data changes
  const UsersTable = React.memo(({ 
    users, 
    isLoading, 
    selectedUsers, 
    onSelectAll, 
    onSelectUser, 
    onToggleStatus, 
    onRoleChangeToUser, 
    onRoleChangeToAdmin, 
    updateUserRoleLoading,
    pagination,
    currentPage,
    pageSize,
    onPageChange,
    onPageSizeChange,
    SortableHeader
  }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    return (
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="text-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users?.length && users?.length > 0}
                    onChange={onSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <SortableHeader field="first_name">Name</SortableHeader>
                <SortableHeader field="email">Email</SortableHeader>
                <SortableHeader field="role" align="center">Role</SortableHeader>
                <SortableHeader field="is_active" align="center">Status</SortableHeader>
                <SortableHeader field="team_count" align="center">Teams</SortableHeader>
                <th className="text-center">Email Verified</th>
                <SortableHeader field="created_at">Joined</SortableHeader>
                <SortableHeader field="last_login">Last Login</SortableHeader>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id}>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={onSelectUser(user.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="font-medium">
                    {user.first_name} {user.last_name}
                  </td>
                  <td>{user.email}</td>
                  <td className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.team_count > 0 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.team_count > 0 ? `${user.team_count} team${user.team_count !== 1 ? 's' : ''}` : 'No teams'}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_email_verified 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.is_email_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="text-center">
                    <div className="flex space-x-2 justify-center">
                      <button
                        onClick={onToggleStatus(user)}
                        className={`${
                          user.is_active 
                            ? 'text-red-600 hover:text-red-800'
                            : 'text-green-600 hover:text-green-800'
                        }`}
                        title={user.is_active ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.is_active ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </button>
                      <div className="flex space-x-1">
                        <button
                          onClick={onRoleChangeToUser(user.id)}
                          disabled={user.role === 'user' || updateUserRoleLoading}
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
                          onClick={onRoleChangeToAdmin(user.id)}
                          disabled={user.role === 'admin' || updateUserRoleLoading}
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
        
        <Pagination
          pagination={pagination}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    );
  });

  const { data: pendingUsers } = useQuery('pendingUsers', async () => {
    const response = await api.get('/users/pending');
    return response.data.users;
  });


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

  const handleToggleStatus = useCallback((user) => {
    if (user.is_active) {
      deactivateMutation.mutate(user.id);
    } else {
      activateMutation.mutate(user.id);
    }
  }, [deactivateMutation, activateMutation]);

  const handleSelectUser = useCallback((userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  }, [selectedUsers.length, users]);

  const handleBatchAssign = useCallback((teamId) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users to assign');
      return;
    }
    batchAssignMutation.mutate({ teamId: teamId, userIds: selectedUsers });
  }, [selectedUsers, batchAssignMutation]);

  const handleCreateUser = useCallback((formData) => {
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }
    createUserMutation.mutate(formData);
  }, [createUserMutation]);

  const handleRoleChange = useCallback((userId, newRole) => {
    // Check if this would leave no admins
    const currentAdmins = users.filter(user => user.role === 'admin' && user.id !== userId);
    if (newRole === 'user' && currentAdmins.length === 0) {
      toast.error('Cannot change role: At least one admin must remain');
      return;
    }
    updateUserRoleMutation.mutate({ userId, role: newRole });
  }, [users, updateUserRoleMutation]);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleRoleFilterChange = useCallback((e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleTeamFilterChange = useCallback((e) => {
    setTeamFilter(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleUserToggleStatus = useCallback((user) => {
    return () => handleToggleStatus(user);
  }, [handleToggleStatus]);

  const handleUserRoleChangeToUser = useCallback((userId) => {
    return () => handleRoleChange(userId, 'user');
  }, [handleRoleChange]);

  const handleUserRoleChangeToAdmin = useCallback((userId) => {
    return () => handleRoleChange(userId, 'admin');
  }, [handleRoleChange]);

  const handleUserSelect = useCallback((userId) => {
    return () => handleSelectUser(userId);
  }, [handleSelectUser]);


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
              onChange={handleSearchChange}
              className="input pl-10"
            />
          </div>
        </div>
        <div className="sm:w-32">
          <select
            value={roleFilter}
            onChange={handleRoleFilterChange}
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
            onChange={handleStatusFilterChange}
            className="input"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <div className="sm:w-40">
          <select
            value={teamFilter}
            onChange={handleTeamFilterChange}
            className="input"
          >
            <option value="">All Teams</option>
            {teams?.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
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
      <UsersTable
        users={filteredUsers}
        isLoading={isLoading}
        selectedUsers={selectedUsers}
        onSelectAll={handleSelectAll}
        onSelectUser={handleUserSelect}
        onToggleStatus={handleUserToggleStatus}
        onRoleChangeToUser={handleUserRoleChangeToUser}
        onRoleChangeToAdmin={handleUserRoleChangeToAdmin}
        updateUserRoleLoading={updateUserRoleMutation.isLoading}
        pagination={pagination}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        SortableHeader={SortableHeader}
      />

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
                        {user.first_name} {user.last_name}
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
                          user.is_email_verified 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.is_email_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approveUserMutation.mutate(user.id)}
                            disabled={!user.is_email_verified || approveUserMutation.isLoading}
                            className={`px-3 py-1 text-sm rounded ${
                              !user.is_email_verified
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={!user.is_email_verified ? 'User must verify email first' : 'Approve user'}
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

      <TeamAssignmentModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        selectedUsers={selectedUsers}
        teams={teams}
        onAssign={handleBatchAssign}
        isLoading={batchAssignMutation.isLoading}
      />

      <CreateUserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onCreate={handleCreateUser}
        isLoading={createUserMutation.isLoading}
        isFirstUser={users && users.length === 0}
      />
    </div>
  );
};

export default Users;
