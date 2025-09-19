import React, {useState} from 'react';
import Modal from './Modal';

const TeamAssignmentModal = ({
	                             isOpen,
	                             onClose,
	                             selectedUsers,
	                             teams,
	                             onAssign,
	                             isLoading
                             }) => {
	const [selectedTeam, setSelectedTeam] = useState('');

	const handleAssign = () => {
		if (selectedTeam) {
			onAssign(selectedTeam);
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
			title={`Assign ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''} to Team`}
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

				<div className="flex justify-end space-x-3">
					<button
						onClick={handleClose}
						className="btn btn-secondary"
					>
						Cancel
					</button>
					<button
						onClick={handleAssign}
						disabled={!selectedTeam || isLoading}
						className="btn btn-primary"
					>
						{isLoading ? 'Assigning...' : 'Assign to Team'}
					</button>
				</div>
			</div>
		</Modal>
	);
};

export default TeamAssignmentModal;
