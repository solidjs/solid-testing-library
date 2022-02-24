const fs = require('fs/promises');

(async () => {
  await fs.rename('dist/index.js', 'dist/index.cjs');
  await fs.rename('dist/esm/index.js', 'dist/index.mjs');
  await fs.rm('dist/esm', { recursive: true });
  await fs.rm('dist/types.js');
})();
