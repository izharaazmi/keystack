import React from 'react';
import {useQuery} from 'react-query';
import {useNavigate} from 'react-router-dom';
import {
	Users,
	Key,
	UserCheck,
	Activity,
	Shield
} from 'lucide-react';
import {api} from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery('dashboard-stats', async () => {
    const [usersRes, credentialsRes, teamsRes] = await Promise.all([
      api.get('/users/stats/overview'),
      api.get('/credentials/projects/list'),
      api.get('/teams')
    ]);
    
    return {
      users: usersRes.data,
      projects: credentialsRes.data.projects,
      teams: teamsRes.data.groups
    };
  });

  const statCards = [
    {
      name: 'Projects',
      value: stats?.projects?.length || 0,
      icon: Key,
      color: 'bg-indigo-500',
      path: '/projects',
    },
    {
      name: 'Teams',
      value: stats?.teams?.length || 0,
      icon: UserCheck,
      color: 'bg-pink-500',
      path: '/teams',
    },
    {
      name: 'Total Users',
      value: stats?.users?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      path: '/users',
    },
    {
      name: 'Admin Users',
      value: stats?.users?.adminUsers || 0,
      icon: Shield,
      color: 'bg-orange-500',
      path: '/users?role=1',
    },
    {
      name: 'Active Users',
      value: stats?.users?.activeUsers || 0,
      icon: Activity,
      color: 'bg-purple-500',
      path: '/users?status=1',
    },
    {
      name: 'Pending Users',
      value: stats?.users?.pendingUsers || 0,
      icon: Users,
      color: 'bg-yellow-500',
      path: '/users?status=0',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your Chrome Pass system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.name} 
              className="card p-6 cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => navigate(stat.path)}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} p-3 rounded-md`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Users */}
      {stats?.users?.recentUsers && stats.users.recentUsers.length > 0 && (
        <div className="mt-8">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
            </div>
            <div className="overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.users.recentUsers.map((user) => (
                    <tr key={user.email}>
                      <td className="font-medium">
                        {user.first_name} {user.last_name}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Projects */}
      {stats?.projects && stats.projects.length > 0 && (
        <div className="mt-8">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Projects</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {stats.projects.map((project) => (
                  <span
                    key={project}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                  >
                    {project}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
