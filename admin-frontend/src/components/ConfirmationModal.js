import React from 'react';
import {AlertTriangle, UserX, Users, FolderOpen, Key} from 'lucide-react';

const ConfirmationModal = ({ 
	isOpen, 
	onClose, 
	onConfirm, 
	title, 
	message, 
	confirmText = 'Confirm', 
	cancelText = 'Cancel',
	type = 'danger',
	isLoading = false 
}) => {
	if (!isOpen) return null;

	const getIcon = () => {
		switch (type) {
			case 'delete-team':
				return <Users className="h-6 w-6 text-red-600" />;
			case 'delete-project':
				return <FolderOpen className="h-6 w-6 text-red-600" />;
			case 'delete-credential':
				return <Key className="h-6 w-6 text-red-600" />;
			case 'remove-user':
				return <UserX className="h-6 w-6 text-red-600" />;
			case 'remove-team':
				return <Users className="h-6 w-6 text-red-600" />;
			default:
				return <AlertTriangle className="h-6 w-6 text-red-600" />;
		}
	};

	const getButtonColor = () => {
		switch (type) {
			case 'danger':
			case 'delete-team':
			case 'delete-project':
			case 'delete-credential':
			case 'remove-user':
			case 'remove-team':
				return 'bg-red-600 hover:bg-red-700';
			default:
				return 'bg-blue-600 hover:bg-blue-700';
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
				<div className="flex items-center mb-4">
					<div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
						{getIcon()}
					</div>
				</div>
				<div className="text-center">
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						{title}
					</h3>
					<p className="text-sm text-gray-500 mb-6">
						{message}
					</p>
					<div className="flex space-x-3">
						<button
							onClick={onClose}
							className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
							disabled={isLoading}
						>
							{cancelText}
						</button>
						<button
							onClick={onConfirm}
							disabled={isLoading}
							className={`flex-1 px-4 py-2 text-sm font-medium text-white ${getButtonColor()} rounded-md transition-colors disabled:opacity-50`}
						>
							{isLoading ? 'Processing...' : confirmText}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ConfirmationModal;
