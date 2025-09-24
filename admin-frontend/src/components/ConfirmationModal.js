import React from 'react';
import {X, AlertTriangle} from 'lucide-react';
import Modal from './Modal';

const ConfirmationModal = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	confirmButtonClass = 'bg-blue-600 hover:bg-blue-700',
	isLoading = false
}) => {
	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<AlertTriangle className="h-6 w-6 text-yellow-600"/>
						</div>
						<h3 className="ml-3 text-lg font-medium text-gray-900">
							{title}
						</h3>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors"
						disabled={isLoading}
					>
						<X className="h-6 w-6"/>
					</button>
				</div>

				<div className="p-6">
					<p className="text-sm text-gray-600 mb-6">
						{message}
					</p>

					<div className="flex justify-end space-x-3">
						<button
							onClick={onClose}
							disabled={isLoading}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{cancelText}
						</button>
						<button
							onClick={onConfirm}
							disabled={isLoading}
							className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonClass}`}
						>
							{isLoading ? (
								<div className="flex items-center">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
									Processing...
								</div>
							) : (
								confirmText
							)}
						</button>
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default ConfirmationModal;
