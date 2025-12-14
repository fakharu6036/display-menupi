import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

try {
    const connection = await mysql.createConnection(dbConfig);
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('✅ Connected to database!');
    console.log(`📋 Found ${tables.length} tables:`);
    tables.forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
    });
    
    // Check if schema needs to be applied
    const requiredTables = ['restaurants', 'users', 'media', 'screens', 'screen_media', 'schedules'];
    const existingTables = tables.map(t => Object.values(t)[0]);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
        console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
        console.log('   Run: mysql -h srv653.hstgr.io -u u859590789_disys -p u859590789_disys < database/schema.sql');
    } else {
        console.log('\n✅ All required tables exist!');
    }
    
    await connection.end();
} catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('   Check your database credentials');
    } else if (err.code === 'ECONNREFUSED') {
        console.error('   Check if your IP (212.1.208.151) is whitelisted in Hostinger');
    }
}
