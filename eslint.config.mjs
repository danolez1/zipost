import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
    // Options here will be passed to all configs
})
    .append(
        {
            ignores: [
                "**/.output",
                "**/.data",
                "**/.nuxt",
                "**/.nitro",
                "**/.cache",
                "**/dist",
                "**/node_modules",
                "**/tmp",
                "**/logs",
                "**/*.log",
                "**/.DS_Store",
                "**/.fleet",
                "**/.idea",
                "**/.env",
                "**/.env.*",
                "!**/.env.example",
                "**/build/",
                "**/temp/",
            ]
        },
        {
            rules: {
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-unused-vars': 'off',
                'no-unused-vars': 'off',
                'vue/no-multiple-template-root': 'off',
                'vue/require-default-prop': 'off'
            }

        }
    )