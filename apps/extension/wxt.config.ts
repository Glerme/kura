import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/i18n/module"],
  manifest: {
    name: "__MSG_ext_name__",
    description: "__MSG_ext_description__",
    default_locale: "en",
    permissions: ["contextMenus", "tabs"],
    action: {},
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; connect-src 'self' https://www.google.com;",
    },
    browser_specific_settings: {
      gecko: {
        id: "guiggff@gmail.com",
        strict_min_version: "109.0",
      },
    },
    data_collection_permissions: {
      required: [],
      optional: [],
    },
  },
});
