import React from 'react';
import {Toaster} from 'react-hot-toast';
import {QueryClient, QueryClientProvider} from 'react-query';
import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import {AuthProvider} from './contexts/AuthContext';
import Credentials from './pages/Credentials';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProfilePage from './pages/ProfilePage';
import Projects from './pages/Projects';
import Teams from './pages/Teams';
import Users from './pages/Users';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<Router>
					<div className="min-h-screen bg-gray-50">
						<Routes>
							<Route path="/login" element={<Login/>}/>
							<Route
								path="/"
								element={
									<ProtectedRoute>
										<Layout/>
									</ProtectedRoute>
								}
							>
								<Route index element={<Navigate to="/dashboard" replace/>}/>
								<Route path="dashboard" element={<Dashboard/>}/>
								<Route path="credentials" element={<Credentials/>}/>
								<Route path="projects" element={<Projects/>}/>
								<Route path="users" element={<Users/>}/>
								<Route path="teams" element={<Teams/>}/>
								<Route path="profile" element={<ProfilePage/>}/>
							</Route>
						</Routes>
						<Toaster position="top-right"/>
					</div>
				</Router>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;
