import {X} from 'lucide-react';
import React, {useEffect, useState} from 'react';
import toast from 'react-hot-toast';
import {useMutation, useQueryClient} from 'react-query';
import {api} from '../utils/api';

const EditProjectModal = ({isOpen, onClose, project, onSuccess}) => {
	const [formData, setFormData] = useState({
		name: '',
		description: ''
	});
	const [errors, setErrors] = useState({});
	const queryClient = useQueryClient();

	// Reset form when modal opens or project changes
	useEffect(() => {
		if (isOpen && project) {
			setFormData({
				name: project.name || '',
				description: project.description || ''
			});
			setErrors({});
		}
	}, [isOpen, project]);

	const updateProjectMutation = useMutation(
		async (data) => {
			const response = await api.put(`/projects/${project.id}`, data);
			return response.data;
		},
		{
			onSuccess: (data) => {
				toast.success('Project updated successfully');
				queryClient.invalidateQueries(['projects-page']);
				onSuccess && onSuccess(data);
				onClose();
			},
			onError: (error) => {
				const errorMessage = error.response?.data?.message || 'Failed to update project';
				toast.error(errorMessage);

				// Handle validation errors
				if (error.response?.data?.errors) {
					setErrors(error.response.data.errors);
				}
			}
		}
	);

	const handleSubmit = (e) => {
		e.preventDefault();

		// Clear previous errors
		setErrors({});

		// Basic validation
		const newErrors = {};
		if (!formData.name.trim()) {
			newErrors.name = 'Project name is required';
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		updateProjectMutation.mutate(formData);
	};

	const handleChange = (e) => {
		const {name, value} = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));

		// Clear error when user starts typing
		if (errors[name]) {
			setErrors(prev => ({
				...prev,
				[name]: ''
			}));
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
				<div
					className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
					onClick={onClose}
				/>

				<div
					className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
					<form onSubmit={handleSubmit}>
						<div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-medium text-gray-900">
									Edit Project
								</h3>
								<button
									type="button"
									onClick={onClose}
									className="text-gray-400 hover:text-gray-600"
								>
									<X className="h-6 w-6"/>
								</button>
							</div>

							<div className="space-y-4">
								<div>
									<label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
										Project Name *
									</label>
									<input
										type="text"
										id="name"
										name="name"
										value={formData.name}
										onChange={handleChange}
										className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
											errors.name ? 'border-red-300' : 'border-gray-300'
										}`}
										placeholder="Enter project name"
									/>
									{errors.name && (
										<p className="mt-1 text-sm text-red-600">{errors.name}</p>
									)}
								</div>

								<div>
									<label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
										Description
									</label>
									<textarea
										id="description"
										name="description"
										value={formData.description}
										onChange={handleChange}
										rows={3}
										className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
										placeholder="Enter project description (optional)"
									/>
								</div>
							</div>
						</div>

						<div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
							<button
								type="submit"
								disabled={updateProjectMutation.isLoading}
								className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{updateProjectMutation.isLoading ? 'Updating...' : 'Update Project'}
							</button>
							<button
								type="button"
								onClick={onClose}
								className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default EditProjectModal;
