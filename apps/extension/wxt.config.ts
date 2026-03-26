import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  manifest: {
    name: '__MSG_ext_name__',
    description: '__MSG_ext_description__',
    default_locale: 'en',
    permissions: ['contextMenus', 'storage', 'tabs'],
    action: {},
  },
})
