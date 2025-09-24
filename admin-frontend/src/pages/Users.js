import {ChevronDown, ChevronUp, Edit3, Lock, Plus, Search, Shield, User, Users as UsersIcon, X, FolderOpen} from 'lucide-react';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import toast from 'react-hot-toast';
import {useMutation, useQuery, useQueryClient} from 'react-query';
import {useNavigate, useSearchParams} from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import CreateUserModal from '../components/CreateUserModal';
import EditUserModal from '../components/EditUserModal';
import Pagination from '../components/Pagination';
import TeamAssignmentModal from '../components/TeamAssignmentModal';
import TeamRemovalModal from '../components/TeamRemovalModal';
import {useAuth} from '../contexts/AuthContext';
import {api} from '../utils/api';

// Role constants
const ROLES = {
	USER: 0,
	ADMIN: 1
};

// State constants
const STATES = {
	TRASHED: -2,
	BLOCKED: -1,
	PENDING: 0,
	ACTIVE: 1
};

const Users = () => {
	const {user: currentUser} = useAuth();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
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
	const [showTeamRemovalModal, setShowTeamRemovalModal] = useState(false);
	const [showUserModal, setShowUserModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingUser, setEditingUser] = useState(null);
	const [deleteConfirm, setDeleteConfirm] = useState({isOpen: false, user: null});
	const queryClient = useQueryClient();

	// Initialize filters from URL parameters
	useEffect(() => {
		const teamParam = searchParams.get('team');
		const roleParam = searchParams.get('role');
		const statusParam = searchParams.get('status');


		if (teamParam) {
			setTeamFilter(teamParam);
		}
		if (roleParam) {
			setRoleFilter(roleParam);
		}
		if (statusParam) {
			setStatusFilter(statusParam);
		}

	}, [searchParams, navigate]);

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

	const SortableHeader = useCallback(({field, children, align = 'left'}) => {
		const alignmentClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
		return (
			<th
				className={`cursor-pointer hover:bg-gray-50 select-none ${alignmentClass}`}
				onClick={() => handleSort(field)}
			>
				<div
					className={`flex items-center space-x-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
					<span>{children}</span>
					{sortField === field && (
						sortDirection === 'asc' ?
							<ChevronUp className="h-4 w-4"/> :
							<ChevronDown className="h-4 w-4"/>
					)}
				</div>
			</th>
		);
	}, [handleSort, sortField, sortDirection]);

	const {data: usersData, isLoading} = useQuery(
		['users', debouncedSearchTerm, roleFilter, statusFilter, teamFilter, sortField, sortDirection, currentPage, pageSize],
		async () => {
			const params = new URLSearchParams();
			if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
			if (roleFilter) params.append('role', roleFilter);
			if (statusFilter) params.append('state', statusFilter);
			if (teamFilter && teamFilter !== '') {
				params.append('team_id', teamFilter);
			}
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


	const {data: teams} = useQuery('teams', async () => {
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
		                               onRoleChange,
		                               onViewProfile,
		                               onViewAssignments,
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
							<SortableHeader field="id" align="center">ID</SortableHeader>
							<SortableHeader field="first_name">Name</SortableHeader>
							<SortableHeader field="email">Email</SortableHeader>
							<SortableHeader field="role" align="center">Admin</SortableHeader>
							<SortableHeader field="state" align="center">Status</SortableHeader>
							<SortableHeader field="team_count" align="center">Teams</SortableHeader>
							<SortableHeader field="is_email_verified" align="center">Email Verified</SortableHeader>
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
								<td className="text-center text-sm text-gray-500">
									{user.id}
								</td>
								<td className="font-medium">
									<div className="flex items-center">
										<button
											onClick={() => onViewProfile(user)}
											className="text-left hover:text-blue-600 hover:underline transition-colors cursor-pointer"
											title="View profile"
										>
											{user.first_name} {user.last_name}
										</button>
										<div className="flex items-center ml-2 space-x-1">
											<button
												onClick={() => onViewAssignments(user)}
												className="p-1 text-gray-400 hover:text-green-600 transition-colors relative group"
											>
												<FolderOpen className="h-4 w-4"/>
												<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
													View credentials
													<div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
												</div>
											</button>
											{user.id !== currentUser?.id && (
												<button
													onClick={() => handleEditUser(user)}
													className="p-1 text-gray-400 hover:text-blue-600 transition-colors relative group"
													title="Edit user"
												>
													<Edit3 className="h-4 w-4"/>
													<div
														className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
														Edit user
														<div
															className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
													</div>
												</button>
											)}
										</div>
									</div>
								</td>
								<td>{user.email}</td>
								<td className="text-center">
									{user.id === currentUser?.id ? (
										<div className="inline-flex items-center justify-center w-8 h-8 rounded-full text-yellow-500 relative group">
											<Lock className="w-5 h-5"/>
											<div
												className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
												Cannot change your own role
												<div
													className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
											</div>
										</div>
									) : user.state !== STATES.ACTIVE ? (
										<div className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 relative group">
											<Lock className="w-5 h-5"/>
											<div
												className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
												Cannot change role for non-active users
												<div
													className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
											</div>
										</div>
									) : (
										<button
											onClick={onRoleChange(user)}
											disabled={updateUserRoleLoading}
											className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors relative group ${
												user.role === ROLES.ADMIN
													? 'text-yellow-500 hover:text-yellow-600'
													: 'text-gray-600 hover:text-gray-800'
											} ${updateUserRoleLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
										>
											{user.role === ROLES.ADMIN ? (
												<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
													<path
														d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
												</svg>
											) : (
												<User className="w-5 h-5"/>
											)}
											<div
												className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
												{user.role === ROLES.ADMIN ? 'Remove admin privileges' : 'Grant admin privileges'}
												<div
													className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
											</div>
										</button>
									)}
								</td>
								<td className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
	                    user.state === STATES.ACTIVE
		                    ? 'bg-green-100 text-green-800'
		                    : user.state === STATES.PENDING
			                    ? 'bg-yellow-100 text-yellow-800'
			                    : user.state === STATES.BLOCKED
				                    ? 'bg-red-100 text-red-800'
				                    : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.state === STATES.ACTIVE ? 'Active' :
	                      user.state === STATES.PENDING ? 'Pending' :
		                      user.state === STATES.BLOCKED ? 'Blocked' : 'Trashed'}
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
									<div className="flex flex-wrap gap-1 justify-center">
										{/* Self Protection Lock */}
										{user.id === currentUser?.id && (
											<div className="text-gray-400 relative group">
												<Lock className="h-4 w-4"/>
												<div
													className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
													Cannot change your own status
													<div
														className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
												</div>
											</div>
										)}

										{/* Actions for other users */}
										{user.id !== currentUser?.id && (
											<>
												{/* Active State Actions */}
												{user.state === STATES.ACTIVE && (
													<>
														<button
															onClick={() => handleBlockUser(user)}
															className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700 hover:bg-orange-200 relative group"
														>
															Block
															<div
																className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
																Block user
																<div
																	className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
															</div>
														</button>
														<button
															onClick={() => handleDeleteUser(user)}
															className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 relative group"
														>
															Delete
															<div
																className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
																Delete user
																<div
																	className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
															</div>
														</button>
													</>
												)}

												{/* Trashed State Actions */}
												{user.state === STATES.TRASHED && (
													<button
														onClick={() => handleRestoreUser(user)}
														className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 relative group"
													>
														Restore
														<div
															className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
															Restore user
															<div
																className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
														</div>
													</button>
												)}

												{/* Blocked State Actions */}
												{user.state === STATES.BLOCKED && (
													<button
														onClick={() => handleBlockUser(user)}
														className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 relative group"
													>
														Unblock
														<div
															className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
															Unblock user
															<div
																className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
														</div>
													</button>
												)}

												{/* Pending State Actions */}
												{user.state === STATES.PENDING && (
													<button
														onClick={() => handleApproveUser(user)}
														disabled={approveUserMutation.isLoading}
														className={`px-2 py-1 text-xs rounded relative group ${
															user.is_email_verified
																? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
																: 'bg-red-100 text-red-700 hover:bg-red-200'
														}`}
													>
														{approveUserMutation.isLoading ? 'Activating...' : 'Activate'}
														<div
															className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
															{user.is_email_verified ? "Activate user" : "Activate (Email unverified)"}
															<div
																className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
														</div>
													</button>
												)}
											</>
										)}
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
		({teamId, userIds}) => api.post(`/teams/${teamId}/batch-add-members`, {userIds}),
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

	const batchRemoveMutation = useMutation(
		({teamId, userIds}) => api.post(`/teams/${teamId}/remove-members`, {userIds}),
		{
			onSuccess: (data) => {
				queryClient.invalidateQueries('teams');
				queryClient.invalidateQueries('users');
				setSelectedUsers([]);
				setShowTeamRemovalModal(false);
				toast.success(`Successfully removed ${data.data.removed} users from team`);
			},
			onError: (error) => {
				toast.error(error.response?.data?.message || 'Failed to remove users from team');
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

	const updateUserMutation = useMutation(
		({userId, userData}) => api.put(`/users/${userId}`, userData),
		{
			onSuccess: () => {
				toast.success('User updated successfully');
				queryClient.invalidateQueries('users');
				setShowEditModal(false);
				setEditingUser(null);
			},
			onError: (error) => {
				toast.error(error.response?.data?.message || 'Failed to update user');
			}
		}
	);

	const updateUserRoleMutation = useMutation(
		({userId, role}) => api.patch(`/users/${userId}/role`, {role}),
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
				toast.success('User approved successfully');
			},
			onError: (error) => {
				toast.error(error.response?.data?.message || 'Failed to approve user');
			}
		}
	);

	const updateUserStateMutation = useMutation(
		({id, state}) => api.patch(`/users/${id}/state`, {state}),
		{
			onSuccess: (response) => {
				queryClient.invalidateQueries('users');
				toast.success(response.data.message || 'User state updated successfully');
			},
			onError: (error) => {
				toast.error(error.response?.data?.message || 'Failed to update user state');
			}
		}
	);

	const handleToggleStatus = useCallback((user) => {
		if (user.state === STATES.ACTIVE) {
			deactivateMutation.mutate(user.id);
		} else if (user.state === STATES.TRASHED) {
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
		batchAssignMutation.mutate({teamId: teamId, userIds: selectedUsers});
	}, [selectedUsers, batchAssignMutation]);

	const handleBatchRemove = useCallback((teamId) => {
		if (selectedUsers.length === 0) {
			toast.error('Please select users to remove');
			return;
		}
		batchRemoveMutation.mutate({teamId: teamId, userIds: selectedUsers});
	}, [selectedUsers, batchRemoveMutation]);

	const handleCreateUser = useCallback((formData) => {
		if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
			toast.error('Please fill in all required fields');
			return;
		}
		createUserMutation.mutate(formData);
	}, [createUserMutation]);

	const handleEditUser = useCallback((user) => {
		setEditingUser(user);
		setShowEditModal(true);
	}, []);

	const handleViewAssignments = useCallback((user) => {
		navigate(`/profile?userId=${user.id}&tab=credentials`);
	}, [navigate]);

	const handleViewProfile = useCallback((user) => {
		navigate(`/profile?userId=${user.id}`);
	}, [navigate]);

	const handleUpdateUser = useCallback((formData) => {
		if (!editingUser) return;
		updateUserMutation.mutate({userId: editingUser.id, userData: formData});
	}, [updateUserMutation, editingUser]);

	const handleRoleChange = useCallback((userId, newRole) => {
		// Check if this would leave no admins
		const currentAdmins = users.filter(user => user.role === ROLES.ADMIN && user.id !== userId);
		if (newRole === ROLES.USER && currentAdmins.length === 0) {
			toast.error('Cannot change role: At least one admin must remain');
			return;
		}
		updateUserRoleMutation.mutate({userId, role: newRole});
	}, [users, updateUserRoleMutation]);

	const handleSearchChange = useCallback((e) => {
		setSearchTerm(e.target.value);
		setCurrentPage(1); // Reset to first page when searching
	}, []);

	const handleRoleFilterChange = useCallback((e) => {
		const value = e.target.value;
		setRoleFilter(value);
		setCurrentPage(1);

		// Update URL parameters
		const newSearchParams = new URLSearchParams(searchParams);
		if (value) {
			newSearchParams.set('role', value);
		} else {
			newSearchParams.delete('role');
		}
		navigate(`/users?${newSearchParams.toString()}`, {replace: true});
	}, [searchParams, navigate]);

	const handleStatusFilterChange = useCallback((e) => {
		const value = e.target.value;
		setStatusFilter(value);
		setCurrentPage(1);

		// Update URL parameters
		const newSearchParams = new URLSearchParams(searchParams);
		if (value) {
			newSearchParams.set('status', value);
		} else {
			newSearchParams.delete('status');
		}
		navigate(`/users?${newSearchParams.toString()}`, {replace: true});
	}, [searchParams, navigate]);

	const handleTeamFilterChange = useCallback((e) => {
		const value = e.target.value;
		setTeamFilter(value);
		setCurrentPage(1);

		// Update URL parameters
		const newSearchParams = new URLSearchParams(searchParams);
		if (value) {
			newSearchParams.set('team', value);
		} else {
			newSearchParams.delete('team');
		}
		navigate(`/users?${newSearchParams.toString()}`, {replace: true});
	}, [searchParams, navigate]);

	const handleUserToggleStatus = useCallback((user) => {
		return () => handleToggleStatus(user);
	}, [handleToggleStatus]);

	const handleUserRoleChange = useCallback((user) => {
		return () => {
			const newRole = user.role === ROLES.ADMIN ? ROLES.USER : ROLES.ADMIN;
			handleRoleChange(user.id, newRole);
		};
	}, [handleRoleChange]);

	const handleUserSelect = useCallback((userId) => {
		return () => handleSelectUser(userId);
	}, [handleSelectUser]);

	const handleBlockUser = useCallback((user) => {
		const newState = user.state === STATES.BLOCKED ? STATES.ACTIVE : STATES.BLOCKED;
		updateUserStateMutation.mutate({id: user.id, state: newState});
	}, [updateUserStateMutation]);

	const handleApproveUser = useCallback((user) => {
		approveUserMutation.mutate(user.id);
	}, [approveUserMutation]);

	const handleDeleteUser = useCallback((user) => {
		setDeleteConfirm({isOpen: true, user});
	}, []);

	const confirmDeleteUser = useCallback(() => {
		if (deleteConfirm.user) {
			updateUserStateMutation.mutate({id: deleteConfirm.user.id, state: STATES.TRASHED});
			setDeleteConfirm({isOpen: false, user: null});
		}
	}, [deleteConfirm.user, updateUserStateMutation]);

	const handleRestoreUser = useCallback((user) => {
		updateUserStateMutation.mutate({id: user.id, state: STATES.ACTIVE});
	}, [updateUserStateMutation]);


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
					<Plus className="h-4 w-4 mr-2"/>
					Add User
				</button>
			</div>

			{/* Filters */}
			<div className="mb-6 flex flex-col sm:flex-row gap-4">
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
						<input
							type="text"
							placeholder="Search users..."
							value={searchTerm}
							onChange={handleSearchChange}
							className="input pl-10"
						/>
					</div>
				</div>
				<div className="sm:w-40">
					<select
						value={roleFilter}
						onChange={handleRoleFilterChange}
						className="input w-full text-base"
					>
						<option value="">(Roles)</option>
						<option value={ROLES.ADMIN}>Admin</option>
						<option value={ROLES.USER}>User</option>
					</select>
				</div>
				<div className="sm:w-40">
					<select
						value={statusFilter}
						onChange={handleStatusFilterChange}
						className="input w-full text-base"
					>
						<option value="">(Status)</option>
						<option value={STATES.ACTIVE}>Active</option>
						<option value={STATES.PENDING}>Pending</option>
						<option value={STATES.BLOCKED}>Blocked</option>
						<option value={STATES.TRASHED}>Trashed</option>
					</select>
				</div>
				<div className="sm:w-64">
					<select
						value={teamFilter}
						onChange={handleTeamFilterChange}
						className="input w-full text-base"
					>
						<option value="">(Team)</option>
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
								className="btn btn-primary btn-sm flex items-center"
								disabled={batchAssignMutation.isLoading}
							>
								<UsersIcon className="h-4 w-4 mr-2"/>
								Assign to Team
							</button>
							<button
								onClick={() => setShowTeamRemovalModal(true)}
								className="btn btn-danger btn-sm flex items-center"
								disabled={batchRemoveMutation.isLoading}
							>
								<X className="h-4 w-4 mr-2"/>
								Remove from Team
							</button>
							<button
								onClick={() => setSelectedUsers([])}
								className="btn btn-secondary btn-sm flex items-center"
							>
								<X className="h-4 w-4 mr-2"/>
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
				onRoleChange={handleUserRoleChange}
				onViewProfile={handleViewProfile}
				onViewAssignments={handleViewAssignments}
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
					<Shield className="mx-auto h-12 w-12 text-gray-400"/>
					<h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
					<p className="mt-1 text-sm text-gray-500">
						Try adjusting your search or filter criteria.
					</p>
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

			<TeamRemovalModal
				isOpen={showTeamRemovalModal}
				onClose={() => setShowTeamRemovalModal(false)}
				selectedUsers={selectedUsers}
				teams={teams}
				onRemove={handleBatchRemove}
				isLoading={batchRemoveMutation.isLoading}
			/>

			<CreateUserModal
				isOpen={showUserModal}
				onClose={() => setShowUserModal(false)}
				onCreate={handleCreateUser}
				isLoading={createUserMutation.isLoading}
				isFirstUser={users && users.length === 0}
			/>

			<EditUserModal
				isOpen={showEditModal}
				onClose={() => {
					setShowEditModal(false);
					setEditingUser(null);
				}}
				user={editingUser}
				onUpdate={handleUpdateUser}
				isLoading={updateUserMutation.isLoading}
			/>

			{/* Delete User Confirmation Modal */}
			<ConfirmationModal
				isOpen={deleteConfirm.isOpen}
				onClose={() => setDeleteConfirm({isOpen: false, user: null})}
				onConfirm={confirmDeleteUser}
				title="Delete User"
				message={`Are you sure you want to delete "${deleteConfirm.user?.first_name} ${deleteConfirm.user?.last_name}"? This action cannot be undone.`}
				confirmText="Delete User"
				type="remove-user"
				isLoading={updateUserStateMutation.isLoading}
			/>
		</div>
	);
};

export default Users;
