// Legacy one-off migration could introduce accounts with blank passwords.
// Use the transactional migrations/runMigration.js runner on an isolated fixture.
console.error('Legacy migrate.js is disabled. Use npm run migrate after reviewing the target database.');
process.exitCode = 1;
