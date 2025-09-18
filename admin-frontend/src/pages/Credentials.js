import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  ExternalLink,
  Filter
} from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const Credentials = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: credentials, isLoading } = useQuery(
    ['credentials', searchTerm, selectedProject],
    async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedProject) params.append('project', selectedProject);
      
      const response = await api.get(`/credentials?${params.toString()}`);
      return response.data.credentials;
    }
  );

  const { data: projects } = useQuery('projects', async () => {
    const response = await api.get('/credentials/projects/list');
    return response.data.projects;
  });

  const { data: users } = useQuery('users', async () => {
    const response = await api.get('/users');
    return response.data.users;
  });

  const { data: teams } = useQuery('teams', async () => {
    const response = await api.get('/teams');
    return response.data.groups;
  });

  const createMutation = useMutation(
    (data) => api.post('/credentials', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('credentials');
        setShowModal(false);
        reset();
        toast.success('Credential created successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create credential');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => api.put(`/credentials/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('credentials');
        setShowModal(false);
        setEditingCredential(null);
        reset();
        toast.success('Credential updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update credential');
      },
    }
  );

  const deleteMutation = useMutation(
    (id) => api.delete(`/credentials/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('credentials');
        toast.success('Credential deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete credential');
      },
    }
  );

  const onSubmit = (data) => {
    if (editingCredential) {
      updateMutation.mutate({ id: editingCredential.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (credential) => {
    setEditingCredential(credential);
    reset({
      label: credential.label,
      url: credential.url,
      urlPattern: credential.urlPattern || '',
      username: credential.username,
      password: credential.password,
      description: credential.description || '',
      project: credential.project || '',
      accessType: credential.accessType,
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this credential?')) {
      deleteMutation.mutate(id);
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const openUrl = (url) => {
    window.open(url, '_blank');
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
          <h1 className="text-2xl font-bold text-gray-900">Credentials</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage shared credentials and access permissions
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCredential(null);
            reset();
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search credentials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="input"
          >
            <option value="">All Projects</option>
            {projects?.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Credentials Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Label</th>
                <th>URL</th>
                <th>Username</th>
                <th>Password</th>
                <th>Project</th>
                <th>Access Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {credentials?.map((credential) => (
                <tr key={credential.id}>
                  <td className="font-medium">{credential.label}</td>
                  <td>
                    <div className="flex items-center">
                      <span className="truncate max-w-xs">{credential.url}</span>
                      <button
                        onClick={() => openUrl(credential.url)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td>{credential.username}</td>
                  <td>
                    <div className="flex items-center">
                      <span className="font-mono text-sm">
                        {showPasswords[credential.id] 
                          ? credential.password 
                          : '•'.repeat(8)
                        }
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(credential.id)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords[credential.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {credential.project}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      credential.accessType === 'all' 
                        ? 'bg-green-100 text-green-800'
                        : credential.accessType === 'group'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {credential.accessType}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(credential)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(credential.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingCredential ? 'Edit Credential' : 'Add New Credential'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Label</label>
                      <input
                        {...register('label', { required: 'Label is required' })}
                        className="input mt-1"
                        placeholder="e.g., Production Database"
                      />
                      {errors.label && <p className="mt-1 text-sm text-red-600">{errors.label.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL</label>
                      <input
                        {...register('url', { required: 'URL is required' })}
                        type="url"
                        className="input mt-1"
                        placeholder="https://example.com"
                      />
                      {errors.url && <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL Pattern (optional)</label>
                      <input
                        {...register('urlPattern')}
                        className="input mt-1"
                        placeholder="*.example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <input
                        {...register('username', { required: 'Username is required' })}
                        className="input mt-1"
                        placeholder="admin"
                      />
                      {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input
                        {...register('password', { required: 'Password is required' })}
                        type="password"
                        className="input mt-1"
                        placeholder="••••••••"
                      />
                      {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
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
                      <label className="block text-sm font-medium text-gray-700">Project</label>
                      <input
                        {...register('project')}
                        className="input mt-1"
                        placeholder="default"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Access Type</label>
                      <select
                        {...register('accessType')}
                        className="input mt-1"
                      >
                        <option value="individual">Individual</option>
                        <option value="group">Group</option>
                        <option value="all">All Users</option>
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
                      editingCredential ? 'Update' : 'Create'
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

export default Credentials;
