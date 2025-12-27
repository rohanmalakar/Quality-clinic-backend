import pool from '../utils/db';

async function addSpecialityField() {
    let connection = null;
    try {
        console.log('Connecting to database...');
        connection = await pool.getConnection();
        
        console.log('Adding speciality column to doctor table...');
        await connection.query(`
            ALTER TABLE doctor 
            ADD COLUMN speciality ENUM('DENTIST', 'DERMATOLOGIST') NOT NULL DEFAULT 'DENTIST'
        `);
        console.log('✓ Speciality column added successfully');
        
        console.log('Updating existing records to have DENTIST as speciality...');
        await connection.query(`
            UPDATE doctor 
            SET speciality = 'DENTIST' 
            WHERE speciality IS NULL OR speciality = ''
        `);
        console.log('✓ Existing records updated successfully');
        
        console.log('Removing default constraint from speciality column...');
        await connection.query(`
            ALTER TABLE doctor 
            MODIFY COLUMN speciality ENUM('DENTIST', 'DERMATOLOGIST') NOT NULL
        `);
        console.log('✓ Default constraint removed - field is now required without default');
        
        console.log('\n✓ Migration completed successfully!');
        console.log('All existing doctors have been set to DENTIST speciality.');
        console.log('New doctors will require a speciality to be specified.');
    } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('✓ Column already exists, skipping...');
        } else {
            console.error('Error running migration:', error.message);
            throw error;
        }
    } finally {
        if (connection) {
            connection.release();
        }
        await pool.end();
    }
}

addSpecialityField();
