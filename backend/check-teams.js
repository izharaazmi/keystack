import { sequelize } from './src/config/database.js';
import { Group } from './src/models/index.js';

async function checkTeams() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    const teams = await Group.findAll({
      where: { is_active: true },
      order: [['created_at', 'DESC']]
    });
    
    console.log('📊 Teams found:', teams.length);
    teams.forEach(team => {
      console.log(`- ${team.name} (ID: ${team.id}, Active: ${team.is_active})`);
    });
    
    // Also check all teams regardless of active status
    const allTeams = await Group.findAll();
    console.log('\n📊 All teams (including inactive):', allTeams.length);
    allTeams.forEach(team => {
      console.log(`- ${team.name} (ID: ${team.id}, Active: ${team.is_active})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTeams();
