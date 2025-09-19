import React, {useState, useMemo, useCallback, useEffect} from 'react';
import {useQuery} from 'react-query';
import {
	Search,
	Folder,
	Key,
	Grid3X3,
	List,
	ChevronUp,
	ChevronDown,
	Users,
	Settings
} from 'lucide-react';
import {api} from '../utils/api';
import AssignmentModal from '../components/AssignmentModal';

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
  const [projectStats, setProjectStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);

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

  // Fetch user and team counts for all projects
  const fetchProjectStats = async () => {
    if (!projects) return;
    
    setStatsLoading(true);
    const stats = {};
    for (const project of projects) {
      try {
        const [usersResponse, teamsResponse] = await Promise.all([
          api.get(`/projects/${project.id}/users`),
          api.get(`/projects/${project.id}/teams`)
        ]);
        
        stats[project.id] = {
          userCount: usersResponse.data.users.length,
          teamCount: teamsResponse.data.teams.length
        };
      } catch (error) {
        console.error(`Error fetching stats for project ${project.id}:`, error);
        stats[project.id] = { userCount: 0, teamCount: 0 };
      }
    }
    setProjectStats(stats);
    setStatsLoading(false);
  };

  useEffect(() => {
    fetchProjectStats();
  }, [projects]);

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

  const handleManageAccess = (project) => {
    setSelectedProject(project);
    setShowAssignmentModal(true);
  };

  const handleAssignmentModalClose = () => {
    setShowAssignmentModal(false);
    // Refresh project stats when modal closes
    fetchProjectStats();
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
            className={`p-2 rounded-md ${
              viewMode === 'cards'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Card view"
          >
            <Grid3X3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleViewModeChange('table')}
            className={`p-2 rounded-md ${
              viewMode === 'table'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Table view"
          >
            <List className="h-5 w-5" />
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
                <button
                  onClick={() => handleManageAccess(project)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Manage user and team access"
                >
                  <Users className="h-4 w-4" />
                </button>
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
                  <SortableHeader field="id" align="center">ID</SortableHeader>
                  <SortableHeader field="name">Project</SortableHeader>
                  <SortableHeader field="credentialCount" align="center">Credentials</SortableHeader>
                  <th className="text-center">Users</th>
                  <th className="text-center">Teams</th>
                  <th className="text-center">Actions</th>
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
                      {statsLoading ? (
                        <div className="animate-pulse bg-gray-200 h-4 w-16 mx-auto rounded"></div>
                      ) : (
                        <span className="text-sm text-gray-600">
                          {projectStats[project.id]?.userCount || 0} {projectStats[project.id]?.userCount === 1 ? 'user' : 'users'}
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      {statsLoading ? (
                        <div className="animate-pulse bg-gray-200 h-4 w-16 mx-auto rounded"></div>
                      ) : (
                        <span className="text-sm text-gray-600">
                          {projectStats[project.id]?.teamCount || 0} {projectStats[project.id]?.teamCount === 1 ? 'team' : 'teams'}
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleManageAccess(project)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Manage user and team access"
                      >
                        <Users className="h-4 w-4" />
                      </button>
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

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={handleAssignmentModalClose}
        type="project"
        itemId={selectedProject?.id}
        itemName={selectedProject?.name}
        assignedUsers={assignedUsers}
        assignedTeams={assignedTeams}
      />
    </div>
  );
};

export default Projects;
