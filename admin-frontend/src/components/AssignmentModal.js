import {Check, Search, UserMinus, UserPlus, Users, X} from 'lucide-react';
import React, {useEffect, useState} from 'react';
import toast from 'react-hot-toast';
import {useMutation, useQuery, useQueryClient} from 'react-query';
import ConfirmationModal from './ConfirmationModal';
import {api} from '../utils/api';

const AssignmentModal = ({
	                         isOpen,
	                         onClose,
	                         type, // 'project' or 'credential'
	                         itemId,
	                         itemName,
	                         assignedUsers = [],
	                         assignedTeams = [],
	                         initialTab = 'users'
                         }) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedTab, setSelectedTab] = useState('users'); // 'users' or 'teams'
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [selectedTeams, setSelectedTeams] = useState([]);
	const [removeConfirm, setRemoveConfirm] = useState({isOpen: false, type: null, item: null});
	const queryClient = useQueryClient();

	// Reset state when modal opens
	useEffect(() => {
		if (isOpen) {
			setSearchTerm('');
			setSelectedTab(initialTab);
			setSelectedUsers([]);
			setSelectedTeams([]);
		}
	}, [isOpen, initialTab]);

	// Fetch all users
	const {data: allUsers = []} = useQuery(
		'all-users',
		async () => {
			const response = await api.get('/users?limit=1000');
			return response.data.users;
		},
		{enabled: isOpen}
	);

	// Fetch all teams
	const {data: allTeams = []} = useQuery(
		'all-teams',
		async () => {
			const response = await api.get('/teams');
			return response.data.groups;
		},
		{enabled: isOpen}
	);

	// Filter out already assigned users and teams, then apply search filter
	const availableUsers = allUsers.filter(user =>
		!assignedUsers.some(assigned => assigned.id === user.id)
	);

	const availableTeams = allTeams.filter(team =>
		!assignedTeams.some(assigned => assigned.id === team.id)
	);

	// Filter users based on search term
	const filteredUsers = availableUsers.filter(user =>
		user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		user.email.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Filter teams based on search term
	const filteredTeams = availableTeams.filter(team =>
		team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
	);

	// Assign users mutation
	const assignUsersMutation = useMutation(
		async (userIds) => {
			const promises = userIds.map(userId =>
				api.post(`/${type}s/${itemId}/users`, {userId})
			);
			await Promise.all(promises);
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries([`${type}-users`, itemId]);
				queryClient.invalidateQueries([`${type}s`]);
				queryClient.invalidateQueries([`${type}s-page`]);
				toast.success('Users assigned successfully');
				setSelectedUsers([]);
			},
			onError: (error) => {
				toast.error(error.response?.data?.message || 'Failed to assign users');
			}
		}
	);

	// Assign teams mutation
	const assignTeamsMutation = useMutation(
		async (teamIds) => {
			const promises = teamIds.map(teamId =>
				api.post(`/${type}s/${itemId}/teams`, {teamId})
			);
			await Promise.all(promises);
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries([`${type}-teams`, itemId]);
				queryClient.invalidateQueries([`${type}s`]);
				queryClient.invalidateQueries([`${type}s-page`]);
				toast.success('Teams assigned successfully');
				setSelectedTeams([]);
			},
			onError: (error) => {
				toast.error(error.response?.data?.message || 'Failed to assign teams');
			}
		}
	);

	// Remove user mutation
	const removeUserMutation = useMutation(
		async (userId) => {
			await api.delete(`/${type}s/${itemId}/users/${userId}`);
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries([`${type}-users`, itemId]);
				queryClient.invalidateQueries([`${type}s`]);
				queryClient.invalidateQueries([`${type}s-page`]);
				toast.success('User removed successfully');
			},
			onError: (error) => {
				toast.error(error.response?.data?.message || 'Failed to remove user');
			}
		}
	);

	// Remove team mutation
	const removeTeamMutation = useMutation(
		async (teamId) => {
			await api.delete(`/${type}s/${itemId}/teams/${teamId}`);
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries([`${type}-teams`, itemId]);
				queryClient.invalidateQueries([`${type}s`]);
				queryClient.invalidateQueries([`${type}s-page`]);
				toast.success('Team removed successfully');
			},
			onError: (error) => {
				toast.error(error.response?.data?.message || 'Failed to remove team');
			}
		}
	);

	const handleUserSelect = (user) => {
		if (selectedUsers.find(u => u.id === user.id)) {
			setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
		} else {
			setSelectedUsers([...selectedUsers, user]);
		}
	};

	const handleTeamSelect = (team) => {
		if (selectedTeams.find(t => t.id === team.id)) {
			setSelectedTeams(selectedTeams.filter(t => t.id !== team.id));
		} else {
			setSelectedTeams([...selectedTeams, team]);
		}
	};

	const handleAssignUsers = () => {
		if (selectedUsers.length === 0 || assignUsersMutation.isLoading) return;
		assignUsersMutation.mutate(selectedUsers.map(u => u.id));
	};

	const handleAssignTeams = () => {
		if (selectedTeams.length === 0 || assignTeamsMutation.isLoading) return;
		assignTeamsMutation.mutate(selectedTeams.map(t => t.id));
	};

	const handleRemoveUser = (userId) => {
		const user = assignedUsers.find(u => u.id === userId);
		setRemoveConfirm({isOpen: true, type: 'user', item: user});
	};

	const handleRemoveTeam = (teamId) => {
		const team = assignedTeams.find(t => t.id === teamId);
		setRemoveConfirm({isOpen: true, type: 'team', item: team});
	};

	const confirmRemove = () => {
		if (removeConfirm.type === 'user' && removeConfirm.item) {
			removeUserMutation.mutate(removeConfirm.item.id);
		} else if (removeConfirm.type === 'team' && removeConfirm.item) {
			removeTeamMutation.mutate(removeConfirm.item.id);
		}
		setRemoveConfirm({isOpen: false, type: null, item: null});
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
				<div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}/>
				<div
					className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
					<div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-medium text-gray-900">
								Manage {type === 'project' ? 'Project' : 'Credential'} Access - {itemName}
							</h3>
							<button
								onClick={onClose}
								className="text-gray-400 hover:text-gray-600"
							>
								<X className="h-6 w-6"/>
							</button>
						</div>

						{/* Tabs */}
						<div className="mb-6">
							<div className="border-b border-gray-200">
								<nav className="-mb-px flex space-x-8">
									<button
										onClick={() => setSelectedTab('users')}
										className={`py-2 px-1 border-b-2 font-medium text-sm ${
											selectedTab === 'users'
												? 'border-primary-500 text-primary-600'
												: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
										}`}
									>
										<Users className="h-4 w-4 inline mr-2"/>
										Users ({assignedUsers.length})
									</button>
									<button
										onClick={() => setSelectedTab('teams')}
										className={`py-2 px-1 border-b-2 font-medium text-sm ${
											selectedTab === 'teams'
												? 'border-primary-500 text-primary-600'
												: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
										}`}
									>
										<Users className="h-4 w-4 inline mr-2"/>
										Teams ({assignedTeams.length})
									</button>
								</nav>
							</div>
						</div>

						{/* Search */}
						<div className="mb-4">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
								<input
									type="text"
									placeholder={`Search ${selectedTab}...`}
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="input pl-10 w-full"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Available Users/Teams */}
							<div>
								<h4 className="text-sm font-medium text-gray-900 mb-3">
									Available {selectedTab === 'users' ? 'Users' : 'Teams'}
								</h4>
								<div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
									{(selectedTab === 'users' ? filteredUsers : filteredTeams).map((item) => {
										const isSelected = selectedTab === 'users'
											? selectedUsers.some(u => u.id === item.id)
											: selectedTeams.some(t => t.id === item.id);

										return (
											<div
												key={item.id}
												className={`p-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 ${
													isSelected ? 'bg-primary-50' : ''
												}`}
												onClick={() => selectedTab === 'users' ? handleUserSelect(item) : handleTeamSelect(item)}
											>
												<div className="flex items-center justify-between">
													<div className="flex items-center space-x-3">
														<div className="flex-shrink-0">
															<div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600">
                                  {selectedTab === 'users'
	                                  ? `${item.first_name.charAt(0)}${item.last_name.charAt(0)}`
	                                  : item.name.charAt(0).toUpperCase()
                                  }
                                </span>
															</div>
														</div>
														<div>
															<p className="text-sm font-medium text-gray-900">
																{selectedTab === 'users'
																	? `${item.first_name} ${item.last_name}`
																	: item.name
																}
															</p>
															<p className="text-sm text-gray-500">
																{selectedTab === 'users' ? item.email : item.description}
															</p>
														</div>
													</div>
													<div className="flex items-center space-x-2">
														{isSelected && (
															<Check className="h-4 w-4 text-primary-600"/>
														)}
													</div>
												</div>
											</div>
										);
									})}
								</div>
								{selectedTab === 'users' && selectedUsers.length > 0 && (
									<button
										onClick={handleAssignUsers}
										disabled={assignUsersMutation.isLoading}
										className="btn btn-primary w-full mt-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<UserPlus className="h-4 w-4 mr-2"/>
										{assignUsersMutation.isLoading ? 'Assigning...' : `Assign ${selectedUsers.length} User${selectedUsers.length > 1 ? 's' : ''}`}
									</button>
								)}
								{selectedTab === 'teams' && selectedTeams.length > 0 && (
									<button
										onClick={handleAssignTeams}
										disabled={assignTeamsMutation.isLoading}
										className="btn btn-primary w-full mt-3 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<UserPlus className="h-4 w-4 mr-2"/>
										{assignTeamsMutation.isLoading ? 'Assigning...' : `Assign ${selectedTeams.length} Team${selectedTeams.length > 1 ? 's' : ''}`}
									</button>
								)}
							</div>

							{/* Assigned Users/Teams */}
							<div>
								<h4 className="text-sm font-medium text-gray-900 mb-3">
									Assigned {selectedTab === 'users' ? 'Users' : 'Teams'}
								</h4>
								<div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
									{(selectedTab === 'users' ? assignedUsers : assignedTeams).map((item) => (
										<div key={item.id} className="p-3 border-b border-gray-100 last:border-b-0">
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-3">
													<div className="flex-shrink-0">
														<div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600">
                                {selectedTab === 'users'
	                                ? `${item.first_name.charAt(0)}${item.last_name.charAt(0)}`
	                                : item.name.charAt(0).toUpperCase()
                                }
                              </span>
														</div>
													</div>
													<div>
														<p className="text-sm font-medium text-gray-900">
															{selectedTab === 'users'
																? `${item.first_name} ${item.last_name}`
																: item.name
															}
														</p>
														<p className="text-sm text-gray-500">
															{selectedTab === 'users' ? item.email : item.description}
														</p>
														{selectedTab === 'users' && item.assignmentType && (
															<p className="text-xs text-blue-600">
																{item.assignmentType === 'direct' ? 'Direct assignment' : `Via team: ${item.teamName}`}
															</p>
														)}
													</div>
												</div>
												<button
													onClick={() => selectedTab === 'users' ? handleRemoveUser(item.id) : handleRemoveTeam(item.id)}
													disabled={selectedTab === 'users' ? removeUserMutation.isLoading : removeTeamMutation.isLoading}
													className="text-red-600 hover:text-red-800"
												>
													<UserMinus className="h-4 w-4"/>
												</button>
											</div>
										</div>
									))}
								</div>
								{(selectedTab === 'users' ? assignedUsers : assignedTeams).length === 0 && (
									<div className="text-center py-8">
										<Users className="mx-auto h-12 w-12 text-gray-400"/>
										<h3 className="mt-2 text-sm font-medium text-gray-900">No {selectedTab} assigned</h3>
										<p className="mt-1 text-sm text-gray-500">
											Select {selectedTab} from the left to assign them.
										</p>
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
						<button
							type="button"
							onClick={onClose}
							className="btn btn-secondary sm:w-auto"
						>
							Close
						</button>
					</div>
				</div>
			</div>

			{/* Remove Confirmation Modal */}
			<ConfirmationModal
				isOpen={removeConfirm.isOpen}
				onClose={() => setRemoveConfirm({isOpen: false, type: null, item: null})}
				onConfirm={confirmRemove}
				title={removeConfirm.type === 'user' ? 'Remove User' : 'Remove Team'}
				message={removeConfirm.type === 'user' 
					? `Are you sure you want to remove "${removeConfirm.item?.first_name} ${removeConfirm.item?.last_name}" from this ${type}?`
					: `Are you sure you want to remove "${removeConfirm.item?.name}" from this ${type}?`
				}
				confirmText={removeConfirm.type === 'user' ? 'Remove User' : 'Remove Team'}
				type={removeConfirm.type === 'user' ? 'remove-user' : 'remove-team'}
				isLoading={removeConfirm.type === 'user' ? removeUserMutation.isLoading : removeTeamMutation.isLoading}
			/>
		</div>
	);
};

export default AssignmentModal;
