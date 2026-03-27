import { createI18n } from '@wxt-dev/i18n'

export const { useI18n } = createI18n<
  typeof import('../public/_locales/en/messages.json')
>()
