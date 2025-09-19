import React, {useState} from 'react';
import Modal from './Modal';

const TeamRemovalModal = ({
	                          isOpen,
	                          onClose,
	                          selectedUsers,
	                          teams,
	                          onRemove,
	                          isLoading
                          }) => {
	const [selectedTeam, setSelectedTeam] = useState('');

	const handleRemove = () => {
		if (selectedTeam) {
			onRemove(selectedTeam);
		}
	};

	const handleClose = () => {
		setSelectedTeam('');
		onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={handleClose}
			title={`Remove ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''} from Team`}
			size="sm"
		>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Select Team
					</label>
					<select
						value={selectedTeam}
						onChange={(e) => setSelectedTeam(e.target.value)}
						className="input w-full"
					>
						<option value="">Choose a team...</option>
						{teams?.map((team) => (
							<option key={team.id} value={team.id}>
								{team.name}
							</option>
						))}
					</select>
				</div>

				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
					<div className="flex">
						<div className="flex-shrink-0">
							<svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
								<path fillRule="evenodd"
								      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
								      clipRule="evenodd"/>
							</svg>
						</div>
						<div className="ml-3">
							<p className="text-sm text-yellow-800">
								This will remove the selected users from the chosen team. This action cannot be undone.
							</p>
						</div>
					</div>
				</div>

				<div className="flex justify-end space-x-3">
					<button
						onClick={handleClose}
						className="btn btn-secondary"
					>
						Cancel
					</button>
					<button
						onClick={handleRemove}
						disabled={!selectedTeam || isLoading}
						className="btn btn-danger"
					>
						{isLoading ? 'Removing...' : 'Remove from Team'}
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default TeamRemovalModal;
