import React, {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from 'react-query';
import {Trash2, ExternalLink, Calendar, Users, Key, FolderOpen} from 'lucide-react';
import toast from 'react-hot-toast';
import {api} from '../utils/api';
import ConfirmationModal from './ConfirmationModal';

const AssignmentsTab = ({ userId = null }) => {
	const [showRemoveProjectModal, setShowRemoveProjectModal] = useState(false);
	const [showRemoveCredentialModal, setShowRemoveCredentialModal] = useState(false);
	const [selectedProject, setSelectedProject] = useState(null);
	const [selectedCredential, setSelectedCredential] = useState(null);
	const queryClient = useQueryClient();

	// Fetch user assignments
	const {data: assignments, isLoading, error} = useQuery(
		['userAssignments', userId],
		async () => {
			const endpoint = userId ? `/auth/users/${userId}/assignments` : '/auth/me/assignments';
			const response = await api.get(endpoint);
			return response.data;
		},
		{
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
				}
			}
		}
	);

	// Remove project access mutation
	const removeProjectMutation = useMutation(
		async (projectId) => {
			const endpoint = userId ? `/auth/users/${userId}/projects/${projectId}` : `/auth/me/projects/${projectId}`;
			const response = await api.delete(endpoint);
			return response.data;
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries(['userAssignments', userId]);
				setShowRemoveProjectModal(false);
				setSelectedProject(null);
				toast.success('Project access removed successfully');
			},
			onError: (error) => {
				if (error.response?.status === 429) {
					const retryAfter = error.response?.data?.retryAfter || '15 minutes';
					toast.error(`Too many requests. Please wait ${retryAfter} before trying again.`);
				} else {
					toast.error(error.response?.data?.message || 'Failed to remove project access');
				}
			}
		}
	);

	// Remove credential access mutation
	const removeCredentialMutation = useMutation(
		async (credentialId) => {
			const endpoint = userId ? `/auth/users/${userId}/credentials/${credentialId}` : `/auth/me/credentials/${credentialId}`;
			const response = await api.delete(endpoint);
			return response.data;
		},
		{
			onSuccess: () => {
				queryClient.invalidateQueries(['userAssignments', userId]);
				setShowRemoveCredentialModal(false);
				setSelectedCredential(null);
				toast.success('Credential access removed successfully');
			},
			onError: (error) => {
				if (error.response?.status === 429) {
					const retryAfter = error.response?.data?.retryAfter || '15 minutes';
					toast.error(`Too many requests. Please wait ${retryAfter} before trying again.`);
				} else {
					toast.error(error.response?.data?.message || 'Failed to remove credential access');
				}
			}
		}
	);

	const handleRemoveProject = (project) => {
		setSelectedProject(project);
		setShowRemoveProjectModal(true);
	};

	const handleRemoveCredential = (credential) => {
		setSelectedCredential(credential);
		setShowRemoveCredentialModal(true);
	};

	const confirmRemoveProject = () => {
		if (selectedProject) {
			removeProjectMutation.mutate(selectedProject.id);
		}
	};

	const confirmRemoveCredential = () => {
		if (selectedCredential) {
			removeCredentialMutation.mutate(selectedCredential.id);
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return 'Unknown';
		
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return 'Invalid date';
		}
		
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const getAssignmentTypeColor = (type) => {
		return type === 'direct' ? 'text-blue-600' : 'text-green-600';
	};

	const getAssignmentTypeIcon = (type) => {
		return type === 'direct' ? <Users className="h-4 w-4"/> : <Users className="h-4 w-4"/>;
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-8">
				<p className="text-red-600">Failed to load assignments. Please try again.</p>
				<p className="text-sm text-gray-500 mt-2">
					Error: {error.response?.data?.message || error.message || 'Unknown error'}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Projects Section */}
			<div>
				<div className="flex items-center mb-4">
					<FolderOpen className="h-5 w-5 text-blue-600 mr-2"/>
					<h3 className="text-lg font-medium text-gray-900">Assigned Projects</h3>
					<span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
						{assignments?.projects?.length || 0}
					</span>
				</div>

				{assignments?.projects?.length === 0 ? (
					<div className="text-center py-8 bg-gray-50 rounded-lg">
						<FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
						<p className="text-gray-500">No projects assigned to you</p>
					</div>
				) : (
					<div className="grid gap-4">
						{assignments?.projects?.map((project) => (
							<div key={project.id} className="card">
								<div className="p-4">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center mb-2">
												<h4 className="text-lg font-medium text-gray-900">{project.name}</h4>
												<span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAssignmentTypeColor(project.assignmentType)} bg-gray-100`}>
													{getAssignmentTypeIcon(project.assignmentType)}
													<span className="ml-1">
														{project.assignmentType === 'direct' ? 'Direct' : `Via ${project.assignedVia}`}
													</span>
												</span>
											</div>
											{project.description && (
												<p className="text-gray-600 mb-2">{project.description}</p>
											)}
											<div className="flex items-center text-sm text-gray-500 space-x-4">
												<div className="flex items-center">
													<Calendar className="h-4 w-4 mr-1"/>
													<span>Assigned {formatDate(project.assignedAt)}</span>
												</div>
												<div className="flex items-center">
													<Users className="h-4 w-4 mr-1"/>
													<span>Created by {project.createdBy?.first_name} {project.createdBy?.last_name}</span>
												</div>
											</div>
										</div>
										{project.assignmentType === 'direct' && (
											<button
												onClick={() => handleRemoveProject(project)}
												className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
												title="Remove access"
											>
												<Trash2 className="h-4 w-4"/>
											</button>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Credentials Section */}
			<div>
				<div className="flex items-center mb-4">
					<Key className="h-5 w-5 text-green-600 mr-2"/>
					<h3 className="text-lg font-medium text-gray-900">Assigned Credentials</h3>
					<span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
						{assignments?.credentials?.length || 0}
					</span>
				</div>

				{assignments?.credentials?.length === 0 ? (
					<div className="text-center py-8 bg-gray-50 rounded-lg">
						<Key className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
						<p className="text-gray-500">No credentials assigned to you</p>
					</div>
				) : (
					<div className="grid gap-4">
						{assignments?.credentials?.map((credential) => (
							<div key={credential.id} className="card">
								<div className="p-4">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<div className="flex items-center mb-2">
												<h4 className="text-lg font-medium text-gray-900">{credential.label}</h4>
												<span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAssignmentTypeColor(credential.assignmentType)} bg-gray-100`}>
													{getAssignmentTypeIcon(credential.assignmentType)}
													<span className="ml-1">
														{credential.assignmentType === 'direct' ? 'Direct' : `Via ${credential.assignedVia}`}
													</span>
												</span>
											</div>
											<div className="flex items-center mb-2">
												<ExternalLink className="h-4 w-4 text-gray-400 mr-2"/>
												<a
													href={credential.url}
													target="_blank"
													rel="noopener noreferrer"
													className="text-blue-600 hover:text-blue-800 text-sm"
												>
													{credential.url}
												</a>
											</div>
											{credential.description && (
												<p className="text-gray-600 mb-2">{credential.description}</p>
											)}
											{credential.project && (
												<div className="flex items-center mb-2">
													<FolderOpen className="h-4 w-4 text-gray-400 mr-2"/>
													<span className="text-sm text-gray-600">Project: {credential.project.name}</span>
												</div>
											)}
											<div className="flex items-center text-sm text-gray-500 space-x-4">
												<div className="flex items-center">
													<Calendar className="h-4 w-4 mr-1"/>
													<span>Assigned {formatDate(credential.assignedAt)}</span>
												</div>
												<div className="flex items-center">
													<Users className="h-4 w-4 mr-1"/>
													<span>Created by {credential.createdBy?.first_name} {credential.createdBy?.last_name}</span>
												</div>
												{credential.last_used && (
													<div className="flex items-center">
														<Calendar className="h-4 w-4 mr-1"/>
														<span>Last used {formatDate(credential.last_used)}</span>
													</div>
												)}
												{credential.use_count > 0 && (
													<div className="flex items-center">
														<span>Used {credential.use_count} times</span>
													</div>
												)}
											</div>
										</div>
										{credential.assignmentType === 'direct' && (
											<button
												onClick={() => handleRemoveCredential(credential)}
												className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
												title="Remove access"
											>
												<Trash2 className="h-4 w-4"/>
											</button>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Confirmation Modals */}
			<ConfirmationModal
				isOpen={showRemoveProjectModal}
				onClose={() => {
					setShowRemoveProjectModal(false);
					setSelectedProject(null);
				}}
				onConfirm={confirmRemoveProject}
				title="Remove Project Access"
				message={`Are you sure you want to remove your access to the project "${selectedProject?.name}"? This action cannot be undone.`}
				confirmText="Remove Access"
				confirmButtonClass="bg-red-600 hover:bg-red-700"
				isLoading={removeProjectMutation.isLoading}
			/>

			<ConfirmationModal
				isOpen={showRemoveCredentialModal}
				onClose={() => {
					setShowRemoveCredentialModal(false);
					setSelectedCredential(null);
				}}
				onConfirm={confirmRemoveCredential}
				title="Remove Credential Access"
				message={`Are you sure you want to remove your access to the credential "${selectedCredential?.label}"? This action cannot be undone.`}
				confirmText="Remove Access"
				confirmButtonClass="bg-red-600 hover:bg-red-700"
				isLoading={removeCredentialMutation.isLoading}
			/>
		</div>
	);
};

export default AssignmentsTab;
