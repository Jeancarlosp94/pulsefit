import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

/** Configuración flat para PulseFit. Sigue las reglas: 3 espacios, comillas simples, sin punto y coma. */
export default tseslint.config(
   {
      ignores: ['dist', 'dev-dist', 'node_modules', 'build', 'coverage', 'playwright-report', '*.config.js']
   },
   js.configs.recommended,
   ...tseslint.configs.recommended,
   {
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
         ecmaVersion: 2022,
         sourceType: 'module',
         globals: {
            ...globals.browser,
            ...globals.es2021,
            ...globals.node
         }
      },
      plugins: {
         'react-hooks': reactHooks,
         'react-refresh': reactRefresh
      },
      rules: {
         ...reactHooks.configs.recommended.rules,
         'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true }
         ],
         /* Coherencia con la convención del proyecto. */
         'indent': ['error', 3, { SwitchCase: 1 }],
         'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
         'semi': ['error', 'never'],
         'comma-dangle': ['error', 'never'],
         'jsx-quotes': ['error', 'prefer-single'],
         /* TS: cero `any` no justificado. */
         '@typescript-eslint/no-explicit-any': 'warn',
         '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
         '@typescript-eslint/consistent-type-imports': 'warn'
      }
   },
   /* Tests: relajamos el `no-explicit-any` y permitimos imports sin restricciones. */
   {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'tests/**/*.ts'],
      rules: {
         '@typescript-eslint/no-explicit-any': 'off'
      }
   },
   prettierConfig
)
