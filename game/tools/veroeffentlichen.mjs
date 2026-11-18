// Baut das Spiel und lädt den Ordner dist/ in den Zweig gh-pages hoch.
// Aufruf: npm run veroeffentlichen
import { execSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';

const run = (cmd, cwd = '.') => execSync(cmd, { cwd, stdio: 'inherit' });
const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();

run('npm run build');
writeFileSync('dist/.nojekyll', '');
rmSync('dist/.git', { recursive: true, force: true });
run('git init -q -b gh-pages', 'dist');
run('git add -A', 'dist');
run('git -c user.name="Schmelz-Spiel" -c user.email="noreply@github.com" commit -q -m "Veröffentlichung"', 'dist');
run(`git push -f -q ${remote} gh-pages`, 'dist');
rmSync('dist/.git', { recursive: true, force: true });
console.log('Veröffentlicht auf gh-pages.');
