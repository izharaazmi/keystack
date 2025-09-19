import React, {useState, useMemo, useEffect, useCallback} from 'react';
import {useQuery, useMutation, useQueryClient} from 'react-query';
import {useForm} from 'react-hook-form';
import {
	Plus,
	Search,
	Edit,
	Trash2,
	Eye,
	EyeOff,
	ExternalLink,
	Users,
	X,
	Settings,
	ChevronUp,
	ChevronDown
} from 'lucide-react';
import {api} from '../utils/api';
import toast from 'react-hot-toast';
import AssignmentModal from '../components/AssignmentModal';

const Credentials = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [assignedTeams, setAssignedTeams] = useState([]);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Debounce search term to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const SortableHeader = useCallback(({ field, children, align = 'left' }) => {
    const alignmentClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
    return (
      <th 
        className={`cursor-pointer hover:bg-gray-50 select-none ${alignmentClass}`}
        onClick={() => handleSort(field)}
      >
        <div className={`flex items-center space-x-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span>{children}</span>
          {sortField === field && (
            sortDirection === 'asc' ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </th>
    );
  }, [handleSort, sortField, sortDirection]);

  const { data: credentials, isLoading } = useQuery(
    ['credentials', selectedProject],
    async () => {
      const params = new URLSearchParams();
      if (selectedProject) params.append('project', selectedProject);
      
      const response = await api.get(`/credentials?${params.toString()}`);
      return response.data.credentials;
    }
  );

  const { data: projects } = useQuery('credentials-projects', async () => {
    const response = await api.get('/projects');
    return response.data.projects;
  });

  const { data: projectNames } = useQuery('project-names', async () => {
    const response = await api.get('/projects');
    return response.data.projects;
  });

  const filteredCredentials = useMemo(() => {
    if (!credentials) return [];
    
    let filtered = credentials;
    
    // Apply search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(credential =>
        credential.label.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        credential.url.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        credential.username.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (credential.project && credential.project.name && credential.project.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
    }

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (sortField === 'id') {
        aValue = parseInt(a.id) || 0;
        bValue = parseInt(b.id) || 0;
      } else if (sortField === 'label') {
        aValue = a.label.toLowerCase();
        bValue = b.label.toLowerCase();
      } else if (sortField === 'url') {
        aValue = a.url.toLowerCase();
        bValue = b.url.toLowerCase();
      } else if (sortField === 'username') {
        aValue = a.username.toLowerCase();
        bValue = b.username.toLowerCase();
      } else if (sortField === 'project') {
        aValue = (a.project && a.project.name) ? a.project.name.toLowerCase() : '';
        bValue = (b.project && b.project.name) ? b.project.name.toLowerCase() : '';
      } else {
        return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [credentials, debouncedSearchTerm, sortField, sortDirection]);

  const { data: credentialUsers, isLoading: assignedUsersLoading } = useQuery(
    ['credential-users', selectedCredential?.id],
    async () => {
      if (!selectedCredential?.id) return [];
      const response = await api.get(`/credentials/${selectedCredential.id}/users`);
      return response.data.users;
    },
    {
      enabled: !!selectedCredential?.id
    }
  );

  // Fetch assigned teams for selected credential
  const { data: credentialTeams } = useQuery(
    ['credential-teams', selectedCredential?.id],
    async () => {
      if (!selectedCredential?.id) return [];
      const response = await api.get(`/credentials/${selectedCredential.id}/teams`);
      return response.data.teams;
    },
    {
      enabled: !!selectedCredential?.id
    }
  );

  // Update assigned users and teams when data changes
  useEffect(() => {
    if (credentialUsers) setAssignedUsers(credentialUsers);
  }, [credentialUsers]);

  useEffect(() => {
    if (credentialTeams) setAssignedTeams(credentialTeams);
  }, [credentialTeams]);



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
    // Handle project assignment - only allow existing projects
    const submitData = { ...data };
    
    if (data.project_id && data.project_id !== '') {
      submitData.project_id = parseInt(data.project_id);
    } else {
      submitData.project_id = null;
    }
    
    if (editingCredential) {
      updateMutation.mutate({ id: editingCredential.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (credential) => {
    setEditingCredential(credential);
    reset({
      label: credential.label,
      url: credential.url,
      url_pattern: credential.url_pattern || '',
      username: credential.username,
      password: credential.password,
      description: credential.description || '',
      project_id: credential.project?.id || '',
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

  const handleViewAssignments = (credential) => {
    setSelectedCredential(credential);
    setShowAssignmentModal(true);
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
        <div className="sm:w-64">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="input w-full"
          >
            <option value="">All Projects</option>
            {projectNames?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
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
                <SortableHeader field="id" align="center">ID</SortableHeader>
                <SortableHeader field="label">Label</SortableHeader>
                <SortableHeader field="url">URL</SortableHeader>
                <SortableHeader field="username">Username</SortableHeader>
                <th>Password</th>
                <SortableHeader field="project">Project</SortableHeader>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCredentials?.map((credential) => (
                <tr key={credential.id}>
                  <td className="text-center text-sm text-gray-500">
                    {credential.id}
                  </td>
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
                      {credential.project?.name || 'No Project'}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex space-x-2 justify-center">
                      <button
                        onClick={() => handleViewAssignments(credential)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Manage user and team access"
                      >
                        <Users className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(credential)}
                        className="text-primary-600 hover:text-primary-800"
                        title="Edit credential"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(credential.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete credential"
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
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full lg:max-w-5xl">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingCredential ? 'Edit Credential' : 'Add New Credential'}
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Basic Information Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Label *</label>
                        <input
                          {...register('label', { required: 'Label is required' })}
                          className="input mt-1"
                          placeholder="e.g., Production Database"
                        />
                        {errors.label && <p className="mt-1 text-sm text-red-600">{errors.label.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Project <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <select
                          {...register('project_id')}
                          className="input mt-1 w-full"
                          defaultValue=""
                        >
                          <option value="">No Project</option>
                          {projects?.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Select an existing project or leave as "No Project"
                        </p>
                      </div>
                    </div>

                    {/* URL Information Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">URL *</label>
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
                          {...register('url_pattern')}
                          className="input mt-1"
                          placeholder="*.example.com"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Used for pattern matching in the browser extension
                        </p>
                      </div>
                    </div>

                    {/* Credentials Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Username *</label>
                        <input
                          {...register('username', { required: 'Username is required' })}
                          className="input mt-1"
                          placeholder="admin"
                        />
                        {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Password *</label>
                        <input
                          {...register('password', { required: 'Password is required' })}
                          type="password"
                          className="input mt-1"
                          placeholder="••••••••"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                      </div>
                    </div>

                    {/* Description Row - Full Width */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="input mt-1"
                        placeholder="Optional description or notes about this credential"
                      />
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

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        type="credential"
        itemId={selectedCredential?.id}
        itemName={selectedCredential?.label}
        assignedUsers={assignedUsers}
        assignedTeams={assignedTeams}
      />
    </div>
  );
};

export default Credentials;
