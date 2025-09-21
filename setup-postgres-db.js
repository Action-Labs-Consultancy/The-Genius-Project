const { exec } = require('child_process');

// Try connecting with default postgres setup
const connectAndSetup = () => {
  // Try with no password first (fresh install)
  const command = `psql -U postgres -d postgres -c "ALTER USER postgres PASSWORD 'duediligence123'; CREATE DATABASE IF NOT EXISTS due_diligence_db;"`;
  
  exec(command, {env: {...process.env, PGPASSWORD: ''}}, (error, stdout, stderr) => {
    if (error) {
      console.log('Trying with password...');
      // Try with the password we expect
      const command2 = `psql -U postgres -d postgres -c "CREATE DATABASE IF NOT EXISTS due_diligence_db;"`;
      exec(command2, {env: {...process.env, PGPASSWORD: 'duediligence123'}}, (error2, stdout2, stderr2) => {
        if (error2) {
          console.error('Error:', error2.message);
          console.error('STDERR:', stderr2);
        } else {
          console.log('✅ Database setup successful!');
          console.log('STDOUT:', stdout2);
        }
      });
    } else {
      console.log('✅ Password set and database created!');
      console.log('STDOUT:', stdout);
    }
  });
};

connectAndSetup();
