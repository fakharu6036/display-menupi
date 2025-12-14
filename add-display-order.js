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

async function addDisplayOrderColumn() {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        // Check if column exists
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? 
             AND TABLE_NAME = 'screen_media' 
             AND COLUMN_NAME = 'display_order'`,
            [dbConfig.database]
        );
        
        if (columns.length > 0) {
            console.log('✅ display_order column already exists');
            return;
        }
        
        // Add the column
        console.log('Adding display_order column...');
        await connection.execute(
            'ALTER TABLE screen_media ADD COLUMN display_order INT DEFAULT 0 AFTER play_value'
        );
        
        // Update existing records
        console.log('Updating existing records...');
        await connection.execute(`
            UPDATE screen_media sm
            INNER JOIN (
                SELECT id, 
                       (@row_number := CASE 
                           WHEN @screen_id = screen_id THEN @row_number + 1 
                           ELSE 0 
                       END) AS new_order,
                       @screen_id := screen_id
                FROM screen_media, (SELECT @row_number := 0, @screen_id := 0) AS r
                ORDER BY screen_id, id
            ) ordered ON sm.id = ordered.id
            SET sm.display_order = ordered.new_order
        `);
        
        // Add index
        console.log('Adding index...');
        await connection.execute(
            'CREATE INDEX idx_display_order ON screen_media(display_order)'
        );
        
        console.log('✅ Successfully added display_order column!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await connection.end();
    }
}

addDisplayOrderColumn();
