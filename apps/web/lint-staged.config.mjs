import baseConfig from '../../lint-staged.base.mjs';

const codeExtensions = '{cjs,cts,js,jsx,mjs,mts,ts,tsx}';

export default {
  ...baseConfig,
  [`*.${codeExtensions}`]: [
    'pnpm exec eslint --fix',
    'pnpm --workspace-root exec prettier --write',
  ],
};
