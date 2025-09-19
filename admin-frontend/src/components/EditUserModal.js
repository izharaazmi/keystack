import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const EditUserModal = ({
  isOpen, 
  onClose, 
  user, 
  onUpdate, 
  isLoading 
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    new_password: '',
    confirm_password: ''
  });

  const [errors, setErrors] = useState({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Update form data when user prop changes or modal opens
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        new_password: '',
        confirm_password: ''
      });
      setErrors({});
      setShowPasswordFields(false);
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation only if changing password
    if (showPasswordFields) {
      if (!formData.new_password) {
        newErrors.new_password = 'New password is required';
      } else if (formData.new_password.length < 6) {
        newErrors.new_password = 'Password must be at least 6 characters';
      }

      if (!formData.confirm_password) {
        newErrors.confirm_password = 'Please confirm the new password';
      } else if (formData.new_password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Only include password fields if user is changing password
      const submitData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email
      };

      if (showPasswordFields) {
        submitData.new_password = formData.new_password;
        submitData.confirm_password = formData.confirm_password;
      }

      onUpdate(submitData);
    }
  };

  const handleClose = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      new_password: '',
      confirm_password: ''
    });
    setErrors({});
    setShowPasswordFields(false);
    onClose();
  };

  const togglePasswordFields = () => {
    setShowPasswordFields(!showPasswordFields);
    // Clear password fields when toggling
    setFormData(prev => ({
      ...prev,
      new_password: '',
      confirm_password: ''
    }));
    // Clear password errors
    setErrors(prev => ({
      ...prev,
      new_password: '',
      confirm_password: ''
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit User - ${user?.first_name} ${user?.last_name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={`input w-full ${errors.first_name ? 'border-red-500' : ''}`}
              placeholder="Enter first name"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={`input w-full ${errors.last_name ? 'border-red-500' : ''}`}
              placeholder="Enter last name"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
            placeholder="Enter email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>


        {formData.email !== user?.email && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  Changing the email address will require the user to verify their new email.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Section */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
            <button
              type="button"
              onClick={togglePasswordFields}
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              {showPasswordFields ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordFields && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  className={`input w-full ${errors.new_password ? 'border-red-500' : ''}`}
                  placeholder="Enter new password"
                />
                {errors.new_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className={`input w-full ${errors.confirm_password ? 'border-red-500' : ''}`}
                  placeholder="Confirm new password"
                />
                {errors.confirm_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;
