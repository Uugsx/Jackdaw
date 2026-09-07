import tseslint from '@electron-toolkit/eslint-config-ts'
import prettier from '@electron-toolkit/eslint-config-prettier'
import svelte from 'eslint-plugin-svelte'

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/out/**', 'build/**'] },
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    files: ['**/*.svelte'],
    languageOptions: { parserOptions: { parser: tseslint.parser } }
  },
  prettier
)
