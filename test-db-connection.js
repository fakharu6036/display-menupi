// Quick database connection test
import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'menupi_db',
};

console.log('Testing database connection with config:');
console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`User: ${dbConfig.user}`);
console.log(`Database: ${dbConfig.database}`);
console.log('Password: ' + (dbConfig.password ? '***' : '(empty)'));

try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('\n✅ Database connection successful!');
    
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query test successful:', rows);
    
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📋 Existing tables:');
    console.log(tables);
    
    await connection.end();
    process.exit(0);
} catch (err) {
    console.error('\n❌ Database connection failed:');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('\n💡 Possible solutions:');
    console.error('1. Check if MySQL server is running');
    console.error('2. Verify database credentials in .env file');
    console.error('3. If using remote database, check firewall/network');
    console.error('4. Verify database exists: mysql -u ' + dbConfig.user + ' -p' + (dbConfig.password ? '***' : '') + ' -e "SHOW DATABASES;"');
    process.exit(1);
}

