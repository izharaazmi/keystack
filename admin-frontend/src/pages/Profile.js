import {Calendar, Edit3, Mail, Shield, User} from 'lucide-react';
import React, {useState} from 'react';
import toast from 'react-hot-toast';
import {useMutation, useQuery, useQueryClient} from 'react-query';
import ProfileEditModal from '../components/ProfileEditModal';
import {api} from '../utils/api';

const Profile = () => {
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const queryClient = useQueryClient();

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

	const handleUpdateProfile = async (formData) => {
		setIsLoading(true);
		try {
			await updateProfileMutation.mutateAsync(formData);
		} catch (error) {
			console.error('Profile update error:', error);
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
		}

		return new Date(dateString).toLocaleDateString('en-US', options);
	};

	if (profileLoading) {
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

	return (
		<div>
			<div className="mb-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
						<p className="mt-1 text-sm text-gray-500">
							Manage your account information and security settings
						</p>
					</div>
					<button
						onClick={() => setIsEditModalOpen(true)}
						className="btn btn-primary flex items-center"
					>
						<Edit3 className="h-4 w-4 mr-2"/>
						Edit Profile
					</button>
				</div>
			</div>

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
									<dd className="mt-1 text-sm text-gray-900">{profileData?.first_name || 'N/A'}</dd>
								</div>
								<div>
									<dt className="text-sm font-medium text-gray-500">Last Name</dt>
									<dd className="mt-1 text-sm text-gray-900">{profileData?.last_name || 'N/A'}</dd>
								</div>
								<div className="sm:col-span-2">
									<dt className="text-sm font-medium text-gray-500">Email Address</dt>
									<dd className="mt-1 text-sm text-gray-900 flex items-center">
										<Mail className="h-4 w-4 mr-2 text-gray-400"/>
										{profileData?.email || 'N/A'}
										{profileData?.is_email_verified ? (
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
										{profileData?.role === 1 ? 'Administrator' : 'User'}
									</dd>
								</div>
								<div>
									<dt className="text-sm font-medium text-gray-500">User ID</dt>
									<dd className="mt-1 text-sm text-gray-900">{profileData?.id || 'N/A'}</dd>
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
											{profileData?.is_email_verified ? 'Verified' : 'Unverified'}
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
											{formatDate(profileData?.created_at, false)}
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
										<p className="text-sm font-medium text-gray-900">Security Updates</p>
										<p className="text-sm text-gray-500">Any security updates or information will be published here</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Profile Edit Modal */}
			{profileData && (
				<ProfileEditModal
					isOpen={isEditModalOpen}
					onClose={() => setIsEditModalOpen(false)}
					user={profileData}
					onUpdate={handleUpdateProfile}
					isLoading={isLoading}
				/>
			)}
		</div>
	);
};

export default Profile;
