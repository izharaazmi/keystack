import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from 'react-query';
import {Toaster} from 'react-hot-toast';
import {AuthProvider} from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Credentials from './pages/Credentials';
import Users from './pages/Users';
import Teams from './pages/Teams';
import Layout from './components/Layout';

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
							<Route path="/login" element={<Login />} />
							<Route
								path="/"
								element={
									<ProtectedRoute>
										<Layout />
									</ProtectedRoute>
								}
							>
								<Route index element={<Navigate to="/dashboard" replace />} />
								<Route path="dashboard" element={<Dashboard />} />
								<Route path="credentials" element={<Credentials />} />
								<Route path="users" element={<Users />} />
								<Route path="teams" element={<Teams />} />
							</Route>
						</Routes>
						<Toaster position="top-right" />
					</div>
				</Router>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;
