import React, {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import Profile from './Profile';

const ProfilePage = () => {
	const [searchParams] = useSearchParams();
	const [userId, setUserId] = useState(null);

	// Get user ID from URL params
	useEffect(() => {
		const userIdParam = searchParams.get('userId');
		setUserId(userIdParam);
	}, [searchParams]);

	return <Profile userId={userId} />;
};

export default ProfilePage;
