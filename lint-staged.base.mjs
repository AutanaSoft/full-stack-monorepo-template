const codeExtensions = '{cjs,cts,js,jsx,mjs,mts,ts,tsx}';
const markdownExtensions = '{md,mdx}';
const formattingExtensions = '{css,html,json,jsonc,yaml,yml}';
const prettierTask = 'pnpm --workspace-root exec prettier --write';
const markdownTask = [prettierTask, 'pnpm --workspace-root exec markdownlint-cli2'];

export default {
  [`*.${codeExtensions}`]: prettierTask,
  [`*.${markdownExtensions}`]: markdownTask,
  [`*.${formattingExtensions}`]: prettierTask,
};
