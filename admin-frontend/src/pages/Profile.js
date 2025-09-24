import {Calendar, Edit3, Mail, Shield, User, FolderOpen, ArrowLeft, Users} from 'lucide-react';
import React, {useState, useEffect} from 'react';
import toast from 'react-hot-toast';
import {useMutation, useQuery, useQueryClient} from 'react-query';
import {useNavigate, useSearchParams} from 'react-router-dom';
import ProfileEditModal from '../components/ProfileEditModal';
import EditUserModal from '../components/EditUserModal';
import AssignmentsTab from '../components/AssignmentsTab';
import {api} from '../utils/api';

const Profile = ({ userId = null }) => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [activeTab, setActiveTab] = useState('profile');
	const [leaveTeamModal, setLeaveTeamModal] = useState({isOpen: false, team: null});
	const queryClient = useQueryClient();

	// Get tab from URL params
	useEffect(() => {
		const tab = searchParams.get('tab');
		if (tab) {
			setActiveTab(tab);
		}
	}, [searchParams]);

	// Fetch current user profile
	const {data: profileData, isLoading: profileLoading, error: profileError} = useQuery(
		'profile',
		async () => {
			const response = await api.get('/auth/me');
			return response.data.user;
		},
		{
			retry: (failureCount, error) => {
				// Don't retry on 429 errors
				if (error?.response?.status === 429) {
					return false;
				}
				return failureCount < 3;
			},
			onError: (error) => {
				if (error?.response?.status === 429) {
					const retryAfter = error.response?.data?.retryAfter || '15 minutes';
					toast.error(`Too many requests. Please wait ${retryAfter} before refreshing.`);
				}
			}
		}
	);

	// Fetch target user data if viewing another user
	const {data: targetUserData, isLoading: targetUserLoading} = useQuery(
		['user', userId],
		async () => {
			const response = await api.get(`/users/${userId}`);
			return response.data.user;
		},
		{
			enabled: !!userId,
			retry: (failureCount, error) => {
				if (error?.response?.status === 429) {
					return false;
				}
				return failureCount < 3;
			},
			onError: (error) => {
				if (error?.response?.status === 429) {
					const retryAfter = error.response?.data?.retryAfter || '15 minutes';
					toast.error(`Too many requests. Please wait ${retryAfter} before refreshing.`);
				} else {
					toast.error('Failed to load user data');
				}
			}
		}
	);

	// Fetch user teams (for both own profile and viewing other users)
	const {data: userTeamsData, isLoading: userTeamsLoading} = useQuery(
		['user-teams', userId || 'me'],
		async () => {
			// Use different endpoints based on whether viewing own profile or another user's
			const endpoint = userId ? `/users/${userId}/teams` : '/auth/me/teams';
			const response = await api.get(endpoint);
			return response.data.teams;
		},
		{
			enabled: !!(userId || profileData?.id), // Fetch when viewing another user or when own profile is loaded
			retry: (failureCount, error) => {
				if (error?.response?.status === 429) {
					return false;
				}
				return failureCount < 3;
			},
			onError: (error) => {
				if (error?.response?.status === 429) {
					const retryAfter = error.response?.data?.retryAfter || '15 minutes';
					toast.error(`Too many requests. Please wait ${retryAfter} before refreshing.`);
				} else {
					toast.error('Failed to load user teams');
				}
			}
		}
	);

	// Determine which user data to display
	const displayUser = userId ? targetUserData : profileData;
	const isViewingOtherUser = !!userId;

	// Update profile mutation
	const updateProfileMutation = useMutation(
		async (profileData) => {
			const response = await api.put('/auth/me', profileData);
			return response.data;
		},
		{
			onSuccess: (data) => {
				queryClient.invalidateQueries('profile');
				setIsEditModalOpen(false);
				toast.success(data.message || 'Profile updated successfully');
			},
			onError: (error) => {
				if (error.response?.status === 429) {
					const retryAfter = error.response?.data?.retryAfter || '15 minutes';
					toast.error(`Too many requests. Please wait ${retryAfter} before trying again.`);
				} else {
					toast.error(error.response?.data?.message || 'Failed to update profile');
				}
			}
		}
	);

	// Update user mutation (for editing other users)
	const updateUserMutation = useMutation(
		({userId, userData}) => api.put(`/users/${userId}`, userData),
		{
			onSuccess: () => {
				queryClient.invalidateQueries('users');
				queryClient.invalidateQueries(['user', userId]);
				setIsEditUserModalOpen(false);
				toast.success('User updated successfully');
			},
			onError: (error) => {
				toast.error(error.response?.data?.message || 'Failed to update user');
			}
		}
	);

	// Leave team mutation
	const leaveTeamMutation = useMutation(
		(teamId) => {
			// Use different endpoints based on whether viewing own profile or another user's
			const endpoint = isViewingOtherUser ? `/users/${userId}/teams/${teamId}` : `/auth/me/teams/${teamId}`;
			return api.delete(endpoint);
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries(['user-teams', userId || 'me']);
				const message = isViewingOtherUser ? 'Successfully removed user from team' : 'Successfully left the team';
				toast.success(message);
			},
			onError: (error) => {
				const message = isViewingOtherUser ? 'Failed to remove user from team' : 'Failed to leave team';
				toast.error(error.response?.data?.message || message);
			}
		}
	);

	const handleUpdateProfile = async (formData) => {
		setIsLoading(true);
		try {
			await updateProfileMutation.mutateAsync(formData);
		} catch (error) {
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdateUser = async (formData) => {
		if (!userId) return;
		setIsLoading(true);
		try {
			await updateUserMutation.mutateAsync({userId, userData: formData});
		} catch (error) {
		} finally {
			setIsLoading(false);
		}
	};

	const handleLeaveTeam = (team) => {
		setLeaveTeamModal({isOpen: true, team});
	};

	const confirmLeaveTeam = async () => {
		if (!leaveTeamModal.team) return;
		setIsLoading(true);
		try {
			await leaveTeamMutation.mutateAsync(leaveTeamModal.team.id);
			setLeaveTeamModal({isOpen: false, team: null});
		} catch (error) {
		} finally {
			setIsLoading(false);
		}
	};

	const formatDate = (dateString, includeTime = true) => {
		if (!dateString) return 'Never';
		const options = {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};

		if (includeTime) {
			options.hour = '2-digit';
			options.minute = '2-digit';
			options.hour12 = true; // Use 12-hour format with AM/PM
		}

		const date = new Date(dateString);
		return includeTime ? date.toLocaleString('en-US', options) : date.toLocaleDateString('en-US', options);
	};

	if (profileLoading || (isViewingOtherUser && targetUserLoading)) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
			</div>
		);
	}

	if (profileError) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<div className="text-red-600 text-lg font-medium mb-2">Error Loading Profile</div>
					<div className="text-gray-600 mb-4">
						{profileError?.response?.status === 429
							? 'Too many requests. Please wait a moment and refresh the page.'
							: 'Failed to load profile data. Please try again.'
						}
					</div>
					<button
						onClick={() => window.location.reload()}
						className="btn btn-primary"
					>
						Refresh Page
					</button>
				</div>
			</div>
		);
	}

	const tabs = [
		{
			id: 'profile',
			name: 'Profile',
			icon: User,
			description: 'Manage your account information and security settings'
		},
		{
			id: 'teams',
			name: 'Teams',
			icon: Users,
			description: isViewingOtherUser ? 'View teams this user belongs to' : 'View teams you belong to'
		},
		{
			id: 'credentials',
			name: 'Credentials',
			icon: FolderOpen,
			description: 'View and manage your project and credential access'
		}
	];

	return (
		<div>
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center">
						{isViewingOtherUser && (
							<button
								onClick={() => navigate('/users')}
								className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
								title="Back to users"
							>
								<ArrowLeft className="h-5 w-5"/>
							</button>
						)}
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								{isViewingOtherUser ? `${displayUser?.first_name} ${displayUser?.last_name}'s Profile` : 'My Profile'}
							</h1>
							<p className="mt-1 text-sm text-gray-500">
								{tabs.find(tab => tab.id === activeTab)?.description}
							</p>
						</div>
					</div>
					{activeTab === 'profile' && (
						<button
							onClick={() => isViewingOtherUser ? setIsEditUserModalOpen(true) : setIsEditModalOpen(true)}
							className="btn btn-primary flex items-center"
						>
							<Edit3 className="h-4 w-4 mr-2"/>
							{isViewingOtherUser ? 'Edit User' : 'Edit Profile'}
						</button>
					)}
				</div>
			</div>

			{/* Tab Navigation */}
			<div className="mb-6">
				<div className="border-b border-gray-200">
					<nav className="-mb-px flex space-x-8">
						{tabs.map((tab) => {
							const Icon = tab.icon;
							return (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
										activeTab === tab.id
											? 'border-blue-500 text-blue-600'
											: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
									}`}
								>
									<Icon className="h-4 w-4 mr-2"/>
									{tab.name}
								</button>
							);
						})}
					</nav>
				</div>
			</div>

			{/* Tab Content */}
			{activeTab === 'profile' && (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Profile Information */}
					<div className="lg:col-span-2">
						<div className="card">
							<div className="px-6 py-4 border-b border-gray-200">
								<h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
							</div>
							<div className="p-6">
							<dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
								<div>
									<dt className="text-sm font-medium text-gray-500">First Name</dt>
									<dd className="mt-1 text-sm text-gray-900">{displayUser?.first_name || 'N/A'}</dd>
								</div>
								<div>
									<dt className="text-sm font-medium text-gray-500">Last Name</dt>
									<dd className="mt-1 text-sm text-gray-900">{displayUser?.last_name || 'N/A'}</dd>
								</div>
								<div className="sm:col-span-2">
									<dt className="text-sm font-medium text-gray-500">Email Address</dt>
									<dd className="mt-1 text-sm text-gray-900 flex items-center">
										<Mail className="h-4 w-4 mr-2 text-gray-400"/>
										{displayUser?.email || 'N/A'}
										{displayUser?.is_email_verified ? (
											<span
												className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
										) : (
											<span
												className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Unverified
                      </span>
										)}
									</dd>
								</div>
								<div>
									<dt className="text-sm font-medium text-gray-500">Role</dt>
									<dd className="mt-1 text-sm text-gray-900 flex items-center">
										<Shield className="h-4 w-4 mr-2 text-gray-400"/>
										{displayUser?.role === 1 ? 'Administrator' : 'User'}
									</dd>
								</div>
								<div>
									<dt className="text-sm font-medium text-gray-500">User ID</dt>
									<dd className="mt-1 text-sm text-gray-900">{displayUser?.id || 'N/A'}</dd>
								</div>
							</dl>
						</div>
					</div>
				</div>

				{/* Account Status */}
				<div className="lg:col-span-1">
					<div className="card">
						<div className="px-6 py-4 border-b border-gray-200">
							<h3 className="text-lg font-medium text-gray-900">Account Status</h3>
						</div>
						<div className="p-6">
							<div className="space-y-4">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<User className="h-5 w-5 text-gray-400"/>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-gray-900">Account Status</p>
										<p className="text-sm text-gray-500">Active</p>
									</div>
								</div>

								<div className="flex items-center">
									<div className="flex-shrink-0">
										<Mail className="h-5 w-5 text-gray-400"/>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-gray-900">Email Status</p>
										<p className="text-sm text-gray-500">
											{displayUser?.is_email_verified ? 'Verified' : 'Unverified'}
										</p>
									</div>
								</div>

								<div className="flex items-center">
									<div className="flex-shrink-0">
										<Calendar className="h-5 w-5 text-gray-400"/>
									</div>
									<div className="ml-3">
										<p className="text-sm font-medium text-gray-900">Member Since</p>
										<p className="text-sm text-gray-500">
											{formatDate(displayUser?.created_at, false)}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Security Information */}
					<div className="card mt-6">
						<div className="px-6 py-4 border-b border-gray-200">
							<h3 className="text-lg font-medium text-gray-900">Security</h3>
						</div>
						<div className="p-6">
							<div className="space-y-4">
								{isViewingOtherUser ? (
									<>
										<div className="flex items-center">
											<div className="flex-shrink-0">
												<Shield className="h-5 w-5 text-blue-500"/>
											</div>
											<div className="ml-3">
												<p className="text-sm font-medium text-gray-900">Account Security</p>
												<p className="text-sm text-gray-500">
													{displayUser?.is_email_verified ? 'Email verified' : 'Email not verified'}
												</p>
											</div>
										</div>
										<div className="flex items-center">
											<div className="flex-shrink-0">
												<User className="h-5 w-5 text-gray-400"/>
											</div>
											<div className="ml-3">
												<p className="text-sm font-medium text-gray-900">Account Status</p>
												<p className="text-sm text-gray-500">
													{displayUser?.state === 1 ? 'Active' : 
													 displayUser?.state === 0 ? 'Pending' : 
													 displayUser?.state === -1 ? 'Blocked' : 'Unknown'}
												</p>
											</div>
										</div>
										<div className="flex items-center">
											<div className="flex-shrink-0">
												<Calendar className="h-5 w-5 text-gray-400"/>
											</div>
											<div className="ml-3">
												<p className="text-sm font-medium text-gray-900">Last Login</p>
												<p className="text-sm text-gray-500">
													{displayUser?.last_login ? formatDate(displayUser.last_login, true) : 'Never'}
												</p>
											</div>
										</div>
									</>
								) : (
									<>
										<div className="flex items-center">
											<div className="flex-shrink-0">
												<Shield className="h-5 w-5 text-green-500"/>
											</div>
											<div className="ml-3">
												<p className="text-sm font-medium text-gray-900">Security Status</p>
												<p className="text-sm text-gray-500">Your profile is currently secure</p>
											</div>
										</div>
										<div className="flex items-center">
											<div className="flex-shrink-0">
												<Calendar className="h-5 w-5 text-blue-500"/>
											</div>
											<div className="ml-3">
												<p className="text-sm font-medium text-gray-900">Last Login</p>
												<p className="text-sm text-gray-500">
													{displayUser?.last_login ? formatDate(displayUser.last_login, true) : 'Never'}
												</p>
											</div>
										</div>
										<div className="flex items-center">
											<div className="flex-shrink-0">
												<Calendar className="h-5 w-5 text-gray-400"/>
											</div>
											<div className="ml-3">
												<p className="text-sm font-medium text-gray-900">Security Updates</p>
												<p className="text-sm text-gray-500">Any security updates or information will be published here</p>
											</div>
										</div>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
			)}

			{/* Credentials Tab */}
			{activeTab === 'credentials' && (
				<AssignmentsTab userId={userId}/>
			)}

			{/* Teams Tab */}
			{activeTab === 'teams' && (
				<div className="space-y-6">
					{userTeamsLoading ? (
						<div className="flex items-center justify-center h-32">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
						</div>
					) : (
						<>
							{userTeamsData && userTeamsData.length > 0 ? (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{userTeamsData.map((team) => (
										<div key={team.id} className="card">
											<div className="p-6">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<h3 className="text-lg font-medium text-gray-900 mb-2">
															{team.name}
														</h3>
														{team.description && (
															<p className="text-sm text-gray-600 mb-3">
																{team.description}
															</p>
														)}
														<div className="space-y-2">
															<div className="flex items-center text-sm text-gray-500">
																<Users className="h-4 w-4 mr-2"/>
																<span>Team Status: </span>
																<span className={`ml-1 font-medium ${
																	team.is_active ? 'text-green-600' : 'text-red-600'
																}`}>
																	{team.is_active ? 'Active' : 'Inactive'}
																</span>
															</div>
															<div className="flex items-center text-sm text-gray-500">
																<Calendar className="h-4 w-4 mr-2"/>
																<span>Joined: {formatDate(team.joinedAt, false)}</span>
															</div>
														</div>
													</div>
													<button
														onClick={() => handleLeaveTeam(team)}
														className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
													>
														{isViewingOtherUser ? 'Remove' : 'Leave'}
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-12">
									<Users className="mx-auto h-12 w-12 text-gray-400 mb-4"/>
									<h3 className="text-lg font-medium text-gray-900 mb-2">No Teams</h3>
									<p className="text-gray-500">
										This user is not currently a member of any teams.
									</p>
								</div>
							)}
						</>
					)}
				</div>
			)}

			{/* Profile Edit Modal */}
			{profileData && !isViewingOtherUser && (
				<ProfileEditModal
					isOpen={isEditModalOpen}
					onClose={() => setIsEditModalOpen(false)}
					user={profileData}
					onUpdate={handleUpdateProfile}
					isLoading={isLoading}
				/>
			)}

			{/* Edit User Modal */}
			{displayUser && isViewingOtherUser && (
				<EditUserModal
					isOpen={isEditUserModalOpen}
					onClose={() => setIsEditUserModalOpen(false)}
					user={displayUser}
					onUpdate={handleUpdateUser}
					isLoading={isLoading}
				/>
			)}

			{/* Leave Team Confirmation Modal */}
			{leaveTeamModal.isOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
						<div className="flex items-center mb-4">
							<div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
								<Users className="h-6 w-6 text-red-600" />
							</div>
						</div>
						<div className="text-center">
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								{isViewingOtherUser ? 'Remove from Team' : 'Leave Team'}
							</h3>
							<p className="text-sm text-gray-500 mb-6">
								{isViewingOtherUser 
									? `Are you sure you want to remove this user from ${leaveTeamModal.team?.name}? This action cannot be undone.`
									: `Are you sure you want to leave ${leaveTeamModal.team?.name}? This action cannot be undone.`
								}
							</p>
							<div className="flex space-x-3">
								<button
									onClick={() => setLeaveTeamModal({isOpen: false, team: null})}
									className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
									disabled={isLoading}
								>
									Cancel
								</button>
								<button
									onClick={confirmLeaveTeam}
									disabled={isLoading}
									className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
								>
									{isLoading 
										? (isViewingOtherUser ? 'Removing...' : 'Leaving...') 
										: (isViewingOtherUser ? 'Remove from Team' : 'Leave Team')
									}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Profile;
