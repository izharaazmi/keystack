import React, {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from 'react-query';
import {useForm} from 'react-hook-form';
import {
	Plus,
	Search,
	Edit,
	Trash2,
	UserMinus,
	Users
} from 'lucide-react';
import {api} from '../utils/api';
import toast from 'react-hot-toast';

const Teams = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: teams, isLoading } = useQuery(
    ['teams', searchTerm],
    async () => {
      const response = await api.get('/teams');
      return response.data.groups;
    }
  );

  const { data: users } = useQuery('users', async () => {
    const response = await api.get('/users');
    return response.data.users;
  });

  const createMutation = useMutation(
    (data) => api.post('/teams', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams');
        setShowModal(false);
        reset();
        toast.success('Team created successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create team');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/teams/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams');
        setShowModal(false);
        setEditingTeam(null);
        reset();
        toast.success('Team updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update team');
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

  const addMemberMutation = useMutation(
    ({ teamId, userId }) => api.post(`/teams/${teamId}/members`, { userId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams');
        toast.success('Member added successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add member');
      },
    }
  );

  const removeMemberMutation = useMutation(
    ({ teamId, userId }) => api.delete(`/teams/${teamId}/members/${userId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams');
        toast.success('Member removed successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to remove member');
      },
    }
  );

  const onSubmit = (data) => {
    if (editingTeam) {
      updateMutation.mutate({ id: editingTeam.id, data });
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

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddMember = (teamId, userId) => {
    addMemberMutation.mutate({ teamId, userId });
  };

  const handleRemoveMember = (teamId, userId) => {
    removeMemberMutation.mutate({ teamId, userId });
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
        <button
          onClick={() => {
            setEditingTeam(null);
            reset();
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Team
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teams?.map((team) => (
          <div key={team.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(team)}
                  className="text-primary-600 hover:text-primary-800"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {team.description && (
              <p className="text-sm text-gray-600 mb-4">{team.description}</p>
            )}
            
            <div className="mb-4">
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <Users className="h-4 w-4 mr-1" />
                {team.members?.length || 0} members
              </div>
              
              {team.members && team.members.length > 0 && (
                <div className="space-y-1">
                  {team.members.slice(0, 3).map((member) => (
                    <div key={member.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-900">
                        {member.firstName} {member.lastName}
                      </span>
                      <button
                        onClick={() => handleRemoveMember(team.id, member.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <UserMinus className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {team.members.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{team.members.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddMember(team.id, e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="">Add member...</option>
                {users?.filter(user => 
                  !team.members?.some(member => member.id === user.id)
                ).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {teams?.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No teams found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new team.
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingTeam ? 'Edit Team' : 'Add New Team'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Team Name</label>
                      <input
                        {...register('name', { required: 'Team name is required' })}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Members</label>
                      <select
                        {...register('members')}
                        multiple
                        className="input mt-1"
                        size={5}
                      >
                        {users?.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </option>
                        ))}
                      </select>
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
                    onClick={() => setShowModal(false)}
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
    </div>
  );
};

export default Teams;
