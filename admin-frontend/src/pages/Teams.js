import {ChevronDown, ChevronUp, Edit, Grid3X3, List, Plus, Search, Trash2, Users} from 'lucide-react';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import toast from 'react-hot-toast';
import {useMutation, useQuery, useQueryClient} from 'react-query';
import {useNavigate} from 'react-router-dom';
import {api} from '../utils/api';
import ConfirmationModal from '../components/ConfirmationModal';

const Teams = () => {
	const navigate = useNavigate();
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
	const [viewMode, setViewMode] = useState(() => {
		return localStorage.getItem('teams-viewMode') || 'cards';
	});
	const [showModal, setShowModal] = useState(false);
	const [editingTeam, setEditingTeam] = useState(null);
	const [sortField, setSortField] = useState('name');
	const [sortDirection, setSortDirection] = useState('asc');
	const [deleteConfirm, setDeleteConfirm] = useState({isOpen: false, team: null});
	const queryClient = useQueryClient();

	const {register, handleSubmit, reset, formState: {errors}} = useForm();

	// Debounce search term to prevent excessive filtering
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 150);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	const handleTeamClick = (teamId) => {
		navigate(`/users?team=${teamId}`);
	};

	const handleViewModeChange = (mode) => {
		setViewMode(mode);
		localStorage.setItem('teams-viewMode', mode);
	};

	const handleSort = useCallback((field) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortField(field);
			setSortDirection('asc');
		}
	}, [sortField, sortDirection]);

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

	const {data: teams, isLoading} = useQuery(
		['teams'],
		async () => {
			const response = await api.get('/teams');
			return response.data.groups;
		}
	);

	const filteredTeams = useMemo(() => {
		if (!teams) return [];

		let filtered = teams.filter(team =>
			team.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
		);

		// Sort the filtered results
		filtered.sort((a, b) => {
			let aValue, bValue;

			if (sortField === 'id') {
				aValue = parseInt(a.id) || 0;
				bValue = parseInt(b.id) || 0;
			} else if (sortField === 'name') {
				aValue = a.name.toLowerCase();
				bValue = b.name.toLowerCase();
			} else if (sortField === 'userCount') {
				aValue = a.userCount || 0;
				bValue = b.userCount || 0;
			} else {
				return 0;
			}

			if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
			if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});

		return filtered;
	}, [teams, debouncedSearchTerm, sortField, sortDirection]);


	const createMutation = useMutation(
		(data) => api.post('/teams', data),
		{
			onSuccess: () => {
				queryClient.invalidateQueries('teams');
				handleCloseModal();
				toast.success('Team created successfully');
			},
			onError: (error) => {
				const errorData = error.response?.data;
				if (errorData?.duplicate) {
					toast.error(`${errorData.message}\nSimilar team: "${errorData.duplicate}"`);
				} else {
					toast.error(errorData?.message || 'Failed to create team');
				}
			},
		}
	);

	const updateMutation = useMutation(
		({id, data}) => api.put(`/teams/${id}`, data),
		{
			onSuccess: () => {
				queryClient.invalidateQueries('teams');
				handleCloseModal();
				toast.success('Team updated successfully');
			},
			onError: (error) => {
				const errorData = error.response?.data;
				if (errorData?.duplicate) {
					toast.error(`${errorData.message}\nSimilar team: "${errorData.duplicate}"`);
				} else {
					toast.error(errorData?.message || 'Failed to update team');
				}
			},
		}
	);

	const deleteMutation = useMutation(
		(id) => api.delete(`/teams/${id}`),
		{
			onSuccess: () => {
				queryClient.invalidateQueries('teams');
				toast.success('Team deleted successfully');
			},
			onError: (error) => {
				toast.error(error.response?.data?.message || 'Failed to delete team');
			},
		}
	);


	const onSubmit = (data) => {
		if (editingTeam) {
			updateMutation.mutate({id: editingTeam.id, data});
		} else {
			createMutation.mutate(data);
		}
	};

	const handleEdit = (team) => {
		setEditingTeam(team);
		reset({
			name: team.name,
			description: team.description || '',
			members: team.members?.map(member => member.id) || [],
		});
		setShowModal(true);
	};

	const handleCloseModal = () => {
		setShowModal(false);
		setEditingTeam(null);
		reset({
			name: '',
			description: '',
			members: []
		});
	};

	const handleDelete = (id) => {
		const team = teams?.find(t => t.id === id);
		if (team?.userCount > 0) {
			toast.error(`Cannot delete team "${team.name}" because it has ${team.userCount} user(s). Remove all users first.`);
			return;
		}

		setDeleteConfirm({isOpen: true, team});
	};

	const confirmDelete = () => {
		if (deleteConfirm.team) {
			deleteMutation.mutate(deleteConfirm.team.id);
			setDeleteConfirm({isOpen: false, team: null});
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
			<div className="mb-8 flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Teams</h1>
					<p className="mt-1 text-sm text-gray-500">
						Manage user groups and team memberships
					</p>
				</div>
				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-2">
						<button
							onClick={() => handleViewModeChange('cards')}
							className={`p-2 rounded-md relative group ${
								viewMode === 'cards'
									? 'bg-primary-100 text-primary-600'
									: 'text-gray-400 hover:text-gray-600'
							}`}
						>
							<Grid3X3 className="h-5 w-5"/>
							<div
								className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
								Card view
								<div
									className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
							</div>
						</button>
						<button
							onClick={() => handleViewModeChange('table')}
							className={`p-2 rounded-md relative group ${
								viewMode === 'table'
									? 'bg-primary-100 text-primary-600'
									: 'text-gray-400 hover:text-gray-600'
							}`}
						>
							<List className="h-5 w-5"/>
							<div
								className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
								Table view
								<div
									className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
							</div>
						</button>
					</div>
					<button
						onClick={() => {
							setEditingTeam(null);
							setShowModal(true);
						}}
						className="btn btn-primary flex items-center"
					>
						<Plus className="h-4 w-4 mr-2"/>
						Add Team
					</button>
				</div>
			</div>

			{/* Search */}
			<div className="mb-6">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
					<input
						key="search-input"
						type="text"
						placeholder="Search teams..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="input pl-10"
					/>
				</div>
			</div>

			{/* Teams Content */}
			{viewMode === 'cards' ? (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{filteredTeams?.map((team) => (
						<div key={team.id} className="card p-6">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center space-x-3">
									<div className="flex-shrink-0">
										<div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
											<Users className="h-5 w-5 text-primary-600"/>
										</div>
									</div>
									<div>
										<h3
											className="text-lg font-medium text-gray-900 cursor-pointer hover:text-primary-600 transition-colors"
											onClick={() => handleTeamClick(team.id)}
										>
											{team.name}
										</h3>
										<p className="text-sm text-gray-500">Team</p>
									</div>
								</div>
								<div className="flex space-x-2">
									<button
										onClick={() => handleEdit(team)}
										className="text-primary-600 hover:text-primary-800"
									>
										<Edit className="h-4 w-4"/>
									</button>
									<button
										onClick={() => handleDelete(team.id)}
										disabled={team.userCount > 0}
										className={`relative group ${
											team.userCount > 0
												? 'text-gray-400 cursor-not-allowed'
												: 'text-red-600 hover:text-red-800'
										}`}
									>
										<Trash2 className="h-4 w-4"/>
										<div
											className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
											{team.userCount > 0 ? 'Not Empty' : 'Delete team'}
											<div
												className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
										</div>
									</button>
								</div>
							</div>

							{team.description && (
								<p className="text-sm text-gray-600 mb-4">{team.description}</p>
							)}

							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-2">
									<Users className="h-4 w-4 text-gray-400"/>
									<span className="text-sm text-gray-600">Members</span>
								</div>
								<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
									(team.userCount || 0) > 0
										? 'bg-green-100 text-green-800'
										: 'bg-gray-100 text-gray-600'
								}`}>
                  {(team.userCount || 0) > 0
	                  ? `${team.userCount} member${team.userCount === 1 ? '' : 's'}`
	                  : 'No members'
                  }
                </span>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="card overflow-hidden">
					<div className="overflow-x-auto">
						<table className="table">
							<thead>
							<tr>
								<SortableHeader field="id" align="center">ID</SortableHeader>
								<SortableHeader field="name">Team</SortableHeader>
								<th>Description</th>
								<SortableHeader field="userCount" align="center">Members</SortableHeader>
								<th className="text-center">Actions</th>
							</tr>
							</thead>
							<tbody>
							{filteredTeams?.map((team) => (
								<tr key={team.id}>
									<td className="text-center text-sm text-gray-500">
										{team.id}
									</td>
									<td>
										<div className="flex items-center space-x-3">
											<div className="flex-shrink-0">
												<div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
													<Users className="h-4 w-4 text-primary-600"/>
												</div>
											</div>
											<div>
												<div
													className="font-medium text-gray-900 cursor-pointer hover:text-primary-600 transition-colors"
													onClick={() => handleTeamClick(team.id)}
												>
													{team.name}
												</div>
												<div className="text-sm text-gray-500">Team</div>
											</div>
										</div>
									</td>
									<td>
										<div className="text-sm text-gray-600">
											{team.description || 'No description'}
										</div>
									</td>
									<td className="text-center">
										<div className="flex items-center space-x-2 justify-center">
											<Users className="h-4 w-4 text-gray-400"/>
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
												(team.userCount || 0) > 0
													? 'bg-green-100 text-green-800'
													: 'bg-gray-100 text-gray-600'
											}`}>
                          {(team.userCount || 0) > 0
	                          ? `${team.userCount} member${team.userCount === 1 ? '' : 's'}`
	                          : 'No members'
                          }
                        </span>
										</div>
									</td>
									<td className="text-center">
										<div className="flex space-x-2 justify-center">
											<button
												onClick={() => handleEdit(team)}
												className="text-primary-600 hover:text-primary-800"
											>
												<Edit className="h-4 w-4"/>
											</button>
											<button
												onClick={() => handleDelete(team.id)}
												disabled={team.userCount > 0}
												className={`relative group ${
													team.userCount > 0
														? 'text-gray-400 cursor-not-allowed'
														: 'text-red-600 hover:text-red-800'
												}`}
											>
												<Trash2 className="h-4 w-4"/>
												<div
													className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
													{team.userCount > 0 ? 'Not Empty' : 'Delete team'}
													<div
														className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
												</div>
											</button>
										</div>
									</td>
								</tr>
							))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{filteredTeams?.length === 0 && (
				<div className="text-center py-12">
					<Users className="mx-auto h-12 w-12 text-gray-400"/>
					<h3 className="mt-2 text-sm font-medium text-gray-900">
						{searchTerm ? 'No teams found' : 'No teams yet'}
					</h3>
					<p className="mt-1 text-sm text-gray-500">
						{searchTerm
							? 'Try adjusting your search terms.'
							: 'Get started by creating a new team.'
						}
					</p>
				</div>
			)}

			{/* Modal */}
			{showModal && (
				<div className="fixed inset-0 z-50 overflow-y-auto">
					<div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
						<div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseModal}/>
						<div
							className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
							<form key={editingTeam ? `edit-${editingTeam.id}` : 'add'} onSubmit={handleSubmit(onSubmit)}>
								<div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
									<h3 className="text-lg font-medium text-gray-900 mb-4">
										{editingTeam ? 'Edit Team' : 'Add New Team'}
									</h3>

									<div className="space-y-4">
										<div>
											<label className="block text-sm font-medium text-gray-700">Team Name</label>
											<input
												{...register('name', {required: 'Team name is required'})}
												className="input mt-1"
												placeholder="e.g., Development Team"
											/>
											{errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700">Description</label>
											<textarea
												{...register('description')}
												rows={3}
												className="input mt-1"
												placeholder="Optional description"
											/>
										</div>

									</div>
								</div>

								<div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
									<button
										type="submit"
										disabled={createMutation.isLoading || updateMutation.isLoading}
										className="btn btn-primary sm:ml-3 sm:w-auto"
									>
										{createMutation.isLoading || updateMutation.isLoading ? (
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
										) : (
											editingTeam ? 'Update' : 'Create'
										)}
									</button>
									<button
										type="button"
										onClick={handleCloseModal}
										className="btn btn-secondary sm:w-auto"
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			<ConfirmationModal
				isOpen={deleteConfirm.isOpen}
				onClose={() => setDeleteConfirm({isOpen: false, team: null})}
				onConfirm={confirmDelete}
				title="Delete Team"
				message={`Are you sure you want to delete "${deleteConfirm.team?.name}"? This action cannot be undone.`}
				confirmText="Delete Team"
				type="delete-team"
				isLoading={deleteMutation.isLoading}
			/>
		</div>
	);
};

export default Teams;
