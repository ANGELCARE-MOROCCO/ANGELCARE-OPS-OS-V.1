import fs from 'node:fs'
for (const dir of ['dist', '.build']) fs.rmSync(new URL(`../${dir}`, import.meta.url), { recursive: true, force: true })
