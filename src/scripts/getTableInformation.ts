// import pool from '../utils/db';

// async function addSpecialityField() {
//     let connection = null;
//     try {
//         console.log('Connecting to database...');
//         connection = await pool.getConnection();
        
//         console.log('Adding speciality column to doctor table...');
//         await connection.query(`
//              UPDATE booking_service
//              SET status = 'SCHEDULED'
//         `);
//         console.log('✓ Speciality column added successfully');
        
//     } catch (error: any) {
//         if (error.code === 'ER_DUP_FIELDNAME') {
//             console.log('✓ Column already exists, skipping...');
//         } else {
//             console.error('Error running migration:', error.message);
//             throw error;
//         }
//     } finally {
//         if (connection) {
//             connection.release();
//         }
//         await pool.end();
//     }
// }

// addSpecialityField();

// async function getTableInformation() {
//   let connection = null;
//   try {
//     console.log('Connecting to database...');
//     connection = await pool.getConnection();
    
//     console.log('Fetching table information...');
//     const [columns] = await connection.query(`
//       DESCRIBE booking_service
//     `);
    
//     console.log('\n=== booking_service Table Structure ===');
//     console.table(columns);
    
//     const [rows] = await connection.query(`
//       SELECT * FROM booking_service
//     `);
    
//     console.log('\n=== booking_service Table Data ===');
//     console.table(rows);
    
//   } catch (error: any) {
//     console.error('Error fetching table information:', error.message);
//     throw error;
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// }


//  getTableInformation();