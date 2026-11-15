// Run the repository's isolated browser checks with the authentication copy
// introduced in Task 08C-5. The backend harness stays unchanged.
import { readFile } from 'node:fs/promises';
const sourceUrl = new URL('../../backend/scripts/browserQa.mjs', import.meta.url);
let source = await readFile(sourceUrl, 'utf8');
source = source.replace("from '../app.js'", `from '${new URL('../../backend/app.js', import.meta.url).href}'`);
source = source.replace("from '../config/db.js'", `from '${new URL('../../backend/config/db.js', import.meta.url).href}'`);
source = source.replace("fill('Jane Doe'", "fill('fullName'");
source = source.replace("fill('you@company.com'", "fill('email'");
source = source.replace("await clickButton('Create account');", "await clickButton('Create viewer account');");
source = source.replace("await clickButton('Sign In'); await waitFor(() => location.pathname === '/dashboard');", "await clickButton('Sign in'); await waitFor(() => location.pathname === '/dashboard');");
await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
