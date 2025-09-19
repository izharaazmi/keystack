import React, {useState, useMemo, useCallback, useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from 'react-query';
import toast from 'react-hot-toast';
import {
	Search,
	Folder,
	Key,
	Grid3X3,
	List,
	ChevronUp,
	ChevronDown,
	Users,
	Settings,
	User,
	Edit,
	Trash2,
	Plus
} from 'lucide-react';
import {api} from '../utils/api';
import AssignmentModal from '../components/AssignmentModal';
import EditProjectModal from '../components/EditProjectModal';
import CreateProjectModal from '../components/CreateProjectModal';

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('projects-viewMode') || 'cards';
  });
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [assignedTeams, setAssignedTeams] = useState([]);
  const [initialTab, setInitialTab] = useState('users');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  // Debounce search term to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: projects, isLoading } = useQuery(
    ['projects-page'],
    async () => {
      const response = await api.get('/projects');
      return response.data.projects;
    }
  );

  // Fetch assigned users for selected project
  const { data: projectUsers } = useQuery(
    ['project-users', selectedProject?.id],
    async () => {
      if (!selectedProject?.id) return [];
      const response = await api.get(`/projects/${selectedProject.id}/users`);
      return response.data.users;
    },
    { enabled: !!selectedProject?.id }
  );

  // Fetch assigned teams for selected project
  const { data: projectTeams } = useQuery(
    ['project-teams', selectedProject?.id],
    async () => {
      if (!selectedProject?.id) return [];
      const response = await api.get(`/projects/${selectedProject.id}/teams`);
      return response.data.teams;
    },
    { enabled: !!selectedProject?.id }
  );

  // Update assigned users and teams when data changes
  useEffect(() => {
    if (projectUsers) setAssignedUsers(projectUsers);
  }, [projectUsers]);

  useEffect(() => {
    if (projectTeams) setAssignedTeams(projectTeams);
  }, [projectTeams]);


  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('projects-viewMode', mode);
  };

  const handleManageAccess = (project, tab = 'users') => {
    setSelectedProject(project);
    setInitialTab(tab);
    setShowAssignmentModal(true);
  };

  const handleAssignmentModalClose = () => {
    setShowAssignmentModal(false);
  };

  const deleteMutation = useMutation(
    (id) => api.delete(`/projects/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects-page');
        toast.success('Project deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete project');
      },
    }
  );

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteMutation.mutate(id);
    }
  };

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

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    let filtered = projects.filter(project =>
      project.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      if (sortField === 'id') {
        aValue = parseInt(a.id) || 0;
        bValue = parseInt(b.id) || 0;
      } else if (sortField === 'name') {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else if (sortField === 'credentialCount') {
        aValue = a.credentialCount || 0;
        bValue = b.credentialCount || 0;
      } else {
        return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [projects, debouncedSearchTerm, sortField, sortDirection]);

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
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all projects and their credential counts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewModeChange('cards')}
            className={`p-2 rounded-md relative group ${
              viewMode === 'cards'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Grid3X3 className="h-5 w-5" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Card view
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
            </div>
          </button>
          <button
            onClick={() => handleViewModeChange('table')}
            className={`p-2 rounded-md relative group ${
              viewMode === 'table'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List className="h-5 w-5" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Table view
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
            </div>
          </button>
          <button
            onClick={handleCreate}
            className="btn btn-primary flex items-center space-x-2 relative group"
          >
            <Plus className="h-4 w-4" />
            <span>Add Project</span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Create new project
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Projects Content */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects?.map((project) => (
            <div key={project.name} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      <Folder className="h-5 w-5 text-primary-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500">Project</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {project.credentialsCount} {project.credentialsCount === 1 ? 'credential' : 'credentials'}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-4 text-sm">
                    <button
                      onClick={() => handleManageAccess(project, 'users')}
                      className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 transition-colors relative group"
                    >
                      <User className="h-4 w-4" />
                      <span>{project.user_count || 0}</span>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Manage user access
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleManageAccess(project, 'teams')}
                      className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 transition-colors relative group"
                    >
                      <Users className="h-4 w-4" />
                      <span>{project.team_count || 0}</span>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Manage team access
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="text-primary-600 hover:text-primary-800 relative group"
                    >
                      <Edit className="h-4 w-4" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        Edit
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={project.credentialsCount > 0}
                      className={`relative group ${
                        project.credentialsCount > 0 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-red-600 hover:text-red-800'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {project.credentialsCount > 0 ? 'Not Empty' : 'Delete'}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <SortableHeader field="id" align="center" className="w-16">ID</SortableHeader>
                  <SortableHeader field="name" className="w-auto">Project</SortableHeader>
                  <SortableHeader field="credentialCount" align="center" className="w-32">Credentials</SortableHeader>
                  <th className="w-32 text-center !text-center">Access</th>
                  <th className="w-32 text-center !text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects?.map((project) => (
                  <tr key={project.id || project.name}>
                    <td className="text-center text-sm text-gray-500">
                      {project.id}
                    </td>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
                            <Folder className="h-4 w-4 text-primary-600" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-500">Project</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center space-x-2 justify-center">
                        <Key className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {project.credentialsCount} {project.credentialsCount <= 1 ? 'credential' : 'credentials'}
                        </span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center space-x-6 text-sm">
                        <button
                          onClick={() => handleManageAccess(project, 'users')}
                          className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 transition-colors relative group"
                        >
                          <User className="h-4 w-4" />
                          <span>{project.user_count || 0}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Manage user access
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleManageAccess(project, 'teams')}
                          className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 transition-colors relative group"
                        >
                          <Users className="h-4 w-4" />
                          <span>{project.team_count || 0}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Manage team access
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                          </div>
                        </button>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex space-x-4 justify-center">
                        <button
                          onClick={() => handleEdit(project)}
                          className="text-primary-600 hover:text-primary-800 relative group"
                        >
                          <Edit className="h-4 w-4" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Edit
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          disabled={project.credentialsCount > 0}
                          className={`relative group ${
                            project.credentialsCount > 0 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-red-600 hover:text-red-800'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {project.credentialsCount > 0 ? 'Not Empty' : 'Delete'}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                      </div>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredProjects?.length === 0 && (
        <div className="text-center py-12">
          <Folder className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search terms.'
              : 'Projects will appear here when credentials are created.'
            }
          </p>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
        }}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        project={editingProject}
        onSuccess={() => {
          setEditingProject(null);
          setShowModal(false);
        }}
      />

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={handleAssignmentModalClose}
        type="project"
        itemId={selectedProject?.id}
        itemName={selectedProject?.name}
        assignedUsers={assignedUsers}
        assignedTeams={assignedTeams}
        initialTab={initialTab}
      />
    </div>
  );
};

export default Projects;
