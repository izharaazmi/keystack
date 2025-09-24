import dotenv from 'dotenv';
import {connectDB, sequelize} from '../config/database.js';
import {Credential, CredentialGroup, CredentialUser, Group, User} from '../models/index.js';

dotenv.config();

const sampleCredentials = [
	{
		label: 'GitHub - Development Team',
		url: 'https://github.com',
		urlPattern: 'github.com/*',
		username: 'dev-team@company.com',
		password: 'GitHubDev2024!',
		description: 'Main GitHub account for development team',
		project: 'Development',
		accessType: 'group'
	},
	{
		label: 'AWS Production Environment',
		url: 'https://console.aws.amazon.com',
		urlPattern: 'console.aws.amazon.com/*',
		username: 'aws-admin@company.com',
		password: 'AWSProd2024!Secure',
		description: 'AWS production environment access',
		project: 'Infrastructure',
		accessType: 'individual'
	},
	{
		label: 'Company Slack',
		url: 'https://company.slack.com',
		urlPattern: 'company.slack.com/*',
		username: 'team@company.com',
		password: 'SlackTeam2024!',
		description: 'Main company Slack workspace',
		project: 'Communication',
		accessType: 'all'
	},
	{
		label: 'JIRA - Project Management',
		url: 'https://company.atlassian.net',
		urlPattern: 'company.atlassian.net/*',
		username: 'pm@company.com',
		password: 'JiraPM2024!',
		description: 'Project management and issue tracking',
		project: 'Project Management',
		accessType: 'group'
	},
	{
		label: 'Docker Hub Registry',
		url: 'https://hub.docker.com',
		urlPattern: 'hub.docker.com/*',
		username: 'docker-team@company.com',
		password: 'DockerHub2024!',
		description: 'Container registry access',
		project: 'DevOps',
		accessType: 'group'
	},
	{
		label: 'Stripe Dashboard',
		url: 'https://dashboard.stripe.com',
		urlPattern: 'dashboard.stripe.com/*',
		username: 'payments@company.com',
		password: 'StripePay2024!',
		description: 'Payment processing dashboard',
		project: 'Finance',
		accessType: 'individual'
	},
	{
		label: 'Google Workspace Admin',
		url: 'https://admin.google.com',
		urlPattern: 'admin.google.com/*',
		username: 'admin@company.com',
		password: 'GoogleAdmin2024!',
		description: 'Google Workspace administration',
		project: 'IT Administration',
		accessType: 'individual'
	},
	{
		label: 'Salesforce CRM',
		url: 'https://company.salesforce.com',
		urlPattern: 'company.salesforce.com/*',
		username: 'sales@company.com',
		password: 'Salesforce2024!',
		description: 'Customer relationship management',
		project: 'Sales',
		accessType: 'group'
	}
];

const sampleGroups = [
	{
		name: 'Development Team',
		description: 'Software development team members'
	},
	{
		name: 'DevOps Team',
		description: 'DevOps and infrastructure team'
	},
	{
		name: 'Project Management',
		description: 'Project managers and coordinators'
	},
	{
		name: 'Sales Team',
		description: 'Sales and business development'
	},
	{
		name: 'Finance Team',
		description: 'Finance and accounting team'
	},
	{
		name: 'IT Administration',
		description: 'IT administrators and support'
	}
];

const seedCredentials = async () => {
	try {
		await connectDB();
		console.log('Connected to database');

		// Get the admin user
		const adminUser = await User.findOne({where: {email: 'admin@chromepass.com'}});
		if (!adminUser) {
			console.log('Admin user not found. Please run create-admin script first.');
			return;
		}

		// Create sample groups
		console.log('Creating sample groups...');
		const createdGroups = [];
		for (const groupData of sampleGroups) {
			const [group, created] = await Group.findOrCreate({
				where: {name: groupData.name},
				defaults: {
					...groupData,
					createdById: adminUser.id,
					isActive: true
				}
			});
			createdGroups.push(group);
			console.log(`${created ? 'Created' : 'Found existing'} group: ${group.name}`);
		}

		// Create sample credentials
		console.log('Creating sample credentials...');
		for (const credData of sampleCredentials) {
			const [credential, created] = await Credential.findOrCreate({
				where: {
					label: credData.label,
					url: credData.url
				},
				defaults: {
					...credData,
					createdById: adminUser.id,
					lastUsed: null,
					useCount: 0
				}
			});

			if (created) {
				console.log(`Created credential: ${credential.label}`);

				// Assign access based on access type
				if (credential.accessType === 'all') {
					// For 'all' access, we don't need to create specific assignments
					console.log(`  - Assigned to all users`);
				} else if (credential.accessType === 'group') {
					// Find matching group by project name
					const matchingGroup = createdGroups.find(g =>
						g.name.toLowerCase().includes(credential.project.toLowerCase()) ||
						credential.project.toLowerCase().includes(g.name.toLowerCase())
					);

					if (matchingGroup) {
						await CredentialGroup.create({
							credentialId: credential.id,
							groupId: matchingGroup.id
						});
						console.log(`  - Assigned to group: ${matchingGroup.name}`);
					}
				} else if (credential.accessType === 'individual') {
					// Assign to admin user for individual access
					await CredentialUser.create({
						credentialId: credential.id,
						userId: adminUser.id
					});
					console.log(`  - Assigned to admin user`);
				}
			} else {
				console.log(`Credential already exists: ${credential.label}`);
			}
		}

		console.log('\n✅ Sample credentials and groups created successfully!');
		console.log('You can now:');
		console.log('1. Login to the admin panel with admin@chromepass.com / admin123');
		console.log('2. View and manage the created credentials');
		console.log('3. Assign users to groups');
		console.log('4. Test the Chrome extension with these credentials');

	} catch (error) {
		console.error('Error seeding credentials:', error);
	} finally {
		await sequelize.close();
	}
};

seedCredentials();
