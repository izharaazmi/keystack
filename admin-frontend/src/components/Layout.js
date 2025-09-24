import {Folder, Key, LayoutDashboard, LogOut, Menu, User, UserCheck, Users, X, ChevronLeft, ChevronRight} from 'lucide-react';
import React, {useState, useEffect, useRef} from 'react';
import {Link, Outlet, useLocation} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

const Layout = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
		const saved = localStorage.getItem('sidebarCollapsed');
		return saved ? JSON.parse(saved) : false;
	});
	const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
	const {user, logout} = useAuth();
	const location = useLocation();

	// Save sidebar state to localStorage
	useEffect(() => {
		localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
	}, [sidebarCollapsed]);

	// Tooltip component
	const Tooltip = () => {
		if (!tooltip.show) return null;
		
		return (
			<div 
				className="fixed px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none whitespace-nowrap z-50"
				style={{ 
					left: tooltip.x, 
					top: tooltip.y,
					transform: 'translateY(-50%)'
				}}
			>
				{tooltip.text}
				<div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-0.5 w-0 h-0 border-t-2 border-b-2 border-r-2 border-transparent border-r-gray-900"></div>
			</div>
		);
	};

	const navigation = [
		{name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard},
		{name: 'Teams', href: '/teams', icon: UserCheck},
		{name: 'Users', href: '/users', icon: Users},
		{name: 'Projects', href: '/projects', icon: Folder},
		{name: 'Credentials', href: '/credentials', icon: Key},
	];

	const isActive = (path) => location.pathname === path;

	// Tooltip handlers
	const showTooltip = (text, event) => {
		if (!sidebarCollapsed) return;
		const rect = event.currentTarget.getBoundingClientRect();
		setTooltip({
			show: true,
			text,
			x: rect.right + 8, // 8px to the right of the sidebar
			y: rect.top + rect.height / 2
		});
	};

	const hideTooltip = () => {
		setTooltip({ show: false, text: '', x: 0, y: 0 });
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<Tooltip />
			{/* Mobile sidebar */}
			<div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
				<div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}/>
				<div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
					<div className="absolute top-0 right-0 -mr-12 pt-2">
						<button
							type="button"
							className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
							onClick={() => setSidebarOpen(false)}
						>
							<X className="h-6 w-6 text-white"/>
						</button>
					</div>
					<div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
						<div className="flex-shrink-0 flex items-center px-4">
							<h1 className="text-xl font-bold text-gray-900">Chrome Pass Admin</h1>
						</div>
						<nav className="mt-5 px-2 space-y-1">
							{navigation.map((item) => {
								const Icon = item.icon;
								return (
									<Link
										key={item.name}
										to={item.href}
										className={`${
											isActive(item.href)
												? 'bg-primary-100 text-primary-900'
												: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
										} group flex items-center px-2 py-2 text-base font-medium rounded-md`}
										onClick={() => setSidebarOpen(false)}
									>
										<Icon className="mr-4 h-6 w-6"/>
										{item.name}
									</Link>
								);
							})}
						</nav>
					</div>
				</div>
			</div>

			{/* Desktop sidebar */}
			<div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
				<div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
					<div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
						<div className="flex items-center justify-between flex-shrink-0 px-4">
							{!sidebarCollapsed && (
								<h1 className="text-xl font-bold text-gray-900">Chrome Pass Admin</h1>
							)}
							<button
								onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
								className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
								title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
							>
								{sidebarCollapsed ? (
									<ChevronRight className="h-5 w-5" />
								) : (
									<ChevronLeft className="h-5 w-5" />
								)}
							</button>
						</div>
						<nav className="mt-5 flex-1 px-2 space-y-1">
							{navigation.map((item) => {
								const Icon = item.icon;
								return (
									<Link
										key={item.name}
										to={item.href}
										className={`${
											isActive(item.href)
												? 'bg-primary-100 text-primary-900'
												: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
										} group flex items-center px-2 py-2 text-sm font-medium rounded-md relative`}
										onMouseEnter={(e) => showTooltip(item.name, e)}
										onMouseLeave={hideTooltip}
									>
										<Icon className={`h-6 w-6 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`}/>
										{!sidebarCollapsed && item.name}
									</Link>
								);
							})}
						</nav>
					</div>
					<div className={`flex-shrink-0 border-t border-gray-200 p-4 ${sidebarCollapsed ? 'flex flex-col space-y-2' : 'flex'}`}>
						<div className={`${sidebarCollapsed ? 'flex justify-center' : 'flex items-center flex-1'}`}>
							<Link
								to="/profile"
								className={`flex items-center hover:bg-gray-50 rounded-md p-2 -m-2 relative ${sidebarCollapsed ? 'justify-center' : 'flex-1'}`}
								onMouseEnter={(e) => showTooltip('Profile', e)}
								onMouseLeave={hideTooltip}
							>
								<User className="h-5 w-5 text-gray-400"/>
								{!sidebarCollapsed && (
									<div className="ml-3">
										<p className="text-sm font-medium text-gray-700">{user?.first_name} {user?.last_name}</p>
										<p className="text-xs text-gray-500">{user?.email}</p>
									</div>
								)}
							</Link>
						</div>
						<div className={`${sidebarCollapsed ? 'flex justify-center' : ''}`}>
							<button
								onClick={logout}
								className="flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md relative group"
								onMouseEnter={(e) => showTooltip('Logout', e)}
								onMouseLeave={hideTooltip}
							>
								<LogOut className="h-5 w-5"/>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
				<div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
					<button
						type="button"
						className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
						onClick={() => setSidebarOpen(true)}
					>
						<Menu className="h-6 w-6"/>
					</button>
				</div>
				<main className="flex-1">
					<div className="py-6">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<Outlet/>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default Layout;
