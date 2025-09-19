import {Eye, EyeOff, Key} from 'lucide-react';
import React, {useEffect, useState} from 'react';
import {useForm} from 'react-hook-form';
import toast from 'react-hot-toast';
import {Navigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

const Login = () => {
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const {user, login} = useAuth();

	const {
		register,
		handleSubmit,
		formState: {errors},
	} = useForm();

	useEffect(() => {
		if (user) {
			return <Navigate to="/dashboard" replace/>;
		}
	}, [user]);

	const onSubmit = async (data) => {
		setIsLoading(true);
		try {
			const result = await login(data.email, data.password);
			if (result.success) {
				toast.success('Login successful!');
			} else {
				toast.error(result.message || 'Login failed');
			}
		} catch (error) {
			toast.error('An unexpected error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	if (user) {
		return <Navigate to="/dashboard" replace/>;
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
						<Key className="h-6 w-6 text-primary-600"/>
					</div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
						Chrome Pass Admin
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						Sign in to your admin account
					</p>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
					<div className="rounded-md shadow-sm -space-y-px">
						<div>
							<label htmlFor="email" className="sr-only">
								Email address
							</label>
							<input
								{...register('email', {
									required: 'Email is required',
									pattern: {
										value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
										message: 'Invalid email address',
									},
								})}
								type="email"
								autoComplete="email"
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
								placeholder="Email address"
							/>
							{errors.email && (
								<p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
							)}
						</div>
						<div className="relative">
							<label htmlFor="password" className="sr-only">
								Password
							</label>
							<input
								{...register('password', {
									required: 'Password is required',
									minLength: {
										value: 6,
										message: 'Password must be at least 6 characters',
									},
								})}
								type={showPassword ? 'text' : 'password'}
								autoComplete="current-password"
								className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
								placeholder="Password"
							/>
							<button
								type="button"
								className="absolute inset-y-0 right-0 pr-3 flex items-center"
								onClick={() => setShowPassword(!showPassword)}
							>
								{showPassword ? (
									<EyeOff className="h-5 w-5 text-gray-400"/>
								) : (
									<Eye className="h-5 w-5 text-gray-400"/>
								)}
							</button>
							{errors.password && (
								<p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
							)}
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={isLoading}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isLoading ? (
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
							) : (
								'Sign in'
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Login;
