import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { User, Mail, Shield, Calendar, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import ProfileEditModal from '../components/ProfileEditModal';

const Profile = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current user profile
  const { data: profileData, isLoading: profileLoading } = useQuery(
    'profile',
    async () => {
      const response = await api.get('/auth/me');
      return response.data.user;
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
        toast.error(error.response?.data?.message || 'Failed to update profile');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
            <Edit3 className="h-4 w-4 mr-2" />
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
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {profileData?.email || 'N/A'}
                    {profileData?.is_email_verified ? (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    ) : (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Unverified
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-gray-400" />
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
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Account Status</p>
                    <p className="text-sm text-gray-500">Active</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Mail className="h-5 w-5 text-gray-400" />
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
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Member Since</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(profileData?.created_at)}
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
                <div>
                  <p className="text-sm font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-500">Last updated when you change it</p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full btn btn-outline"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={profileData}
        onUpdate={handleUpdateProfile}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Profile;
