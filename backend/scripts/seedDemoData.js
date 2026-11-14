// The former demo seed used fixed credentials and the obsolete licenses.user_id
// column. It is intentionally disabled to prevent account and license corruption.
console.error('Legacy demo seed is disabled. Create employees through the API and use an isolated test fixture for demos.');
process.exitCode = 1;
