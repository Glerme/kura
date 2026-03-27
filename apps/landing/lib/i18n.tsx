"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

type Locale = "en" | "pt_BR";

const dictionaries = {
  en: {
    // Navbar
    nav_features: "Features",
    nav_faq: "FAQ",
    nav_install: "Install",

    // Hero
    hero_badge: "Free forever · No account required",
    hero_headline: "Save links the way you think.",
    hero_sub:
      "Right-click any link. Add a comment, tags, and share instantly. Your reading list, organized — entirely offline.",
    hero_cta_chrome: "Install on Chrome",
    hero_cta_firefox: "Install on Firefox",
    hero_cta_note: "Chrome Web Store · Firefox Add-ons",

    // Demo
    demo_title: "See it in action",
    demo_sub: "Save, tag, and share — all without leaving the page.",
    demo_placeholder: "Demo coming soon",
    demo_placeholder_sub: "GIF / short video of the full flow",

    // Features
    features_title: "Everything you need, nothing you don't.",
    features_sub: "Built for speed. Built to last offline.",
    feat1_title: "Save anywhere",
    feat1_desc:
      "Right-click any link and it's saved instantly — no popup, no friction.",
    feat2_title: "Tags & comments",
    feat2_desc:
      "Annotate every link with a free-form comment and lowercase tags.",
    feat3_title: "Share in one tap",
    feat3_desc: "Send to WhatsApp, Twitter/X, or copy the link — your choice.",
    feat4_title: "Cloud sync (coming soon)",
    feat4_desc: "Access your links on every device with Kura Pro.",

    // Waitlist
    waitlist_tag: "Coming soon",
    waitlist_title: "Kura Pro",
    waitlist_sub:
      "Cloud sync, full-text search, and automatic backups — across all your devices.",
    waitlist_placeholder: "your@email.com",
    waitlist_btn: "Notify me",
    waitlist_success: "You're on the list! We'll be in touch.",
    waitlist_features: [
      "Cloud sync across devices",
      "Full-text search",
      "Automatic backup",
      "Shared public collections",
    ],

    // FAQ
    faq_title: "Frequently asked questions",
    faq: [
      {
        q: "Is Kura free?",
        a: "Yes. Kura is free forever for core features: saving links, tags, comments, search, and sharing. Kura Pro (sync + advanced features) will be optional.",
      },
      {
        q: "Where are my links stored?",
        a: "Entirely in your browser's IndexedDB — no server, no account required. Your data never leaves your device in the free tier.",
      },
      {
        q: "Does Kura work offline?",
        a: "Yes. Kura is 100% offline-first. Everything works without an internet connection.",
      },
      {
        q: "What is Kura Pro?",
        a: "Kura Pro is an upcoming premium tier with cloud sync, full-text search, and automatic backups. Enter your email above to get notified at launch.",
      },
      {
        q: "Which browsers are supported?",
        a: "Chrome (Manifest V3) and Firefox (Manifest V2). Edge and other Chromium-based browsers should work too.",
      },
    ],

    // Footer
    footer_tagline: "Your links, your way.",
    footer_chrome: "Chrome Web Store",
    footer_firefox: "Firefox Add-ons",
    footer_github: "GitHub",
    footer_rights: "All rights reserved.",
  },

  pt_BR: {
    nav_features: "Funcionalidades",
    nav_faq: "FAQ",
    nav_install: "Instalar",

    hero_badge: "Gratuito para sempre · Sem conta",
    hero_headline: "Salve links do jeito que você pensa.",
    hero_sub:
      "Clique com o botão direito em qualquer link. Adicione comentário, tags e compartilhe na hora. Sua lista de leitura, organizada — totalmente offline.",
    hero_cta_chrome: "Instalar no Chrome",
    hero_cta_firefox: "Instalar no Firefox",
    hero_cta_note: "Chrome Web Store · Firefox Add-ons",

    demo_title: "Veja em ação",
    demo_sub: "Salve, organize com tags e compartilhe — sem sair da página.",
    demo_placeholder: "Demo em breve",
    demo_placeholder_sub: "GIF / vídeo curto do fluxo completo",

    features_title: "Tudo que você precisa, nada que não precisa.",
    features_sub: "Feito para velocidade. Feito para durar offline.",
    feat1_title: "Salve em qualquer lugar",
    feat1_desc:
      "Clique com o botão direito em qualquer link e ele é salvo na hora — sem popup, sem fricção.",
    feat2_title: "Tags & comentários",
    feat2_desc:
      "Anote cada link com um comentário livre e tags em minúsculas.",
    feat3_title: "Compartilhe em um toque",
    feat3_desc:
      "Envie pelo WhatsApp, Twitter/X ou copie o link — você escolhe.",
    feat4_title: "Sync na nuvem (em breve)",
    feat4_desc: "Acesse seus links em todos os dispositivos com o Kura Pro.",

    waitlist_tag: "Em breve",
    waitlist_title: "Kura Pro",
    waitlist_sub:
      "Sync na nuvem, busca full-text e backups automáticos — em todos os seus dispositivos.",
    waitlist_placeholder: "seu@email.com",
    waitlist_btn: "Me avise",
    waitlist_success: "Você está na lista! Entraremos em contato.",
    waitlist_features: [
      "Sync entre dispositivos",
      "Busca full-text",
      "Backup automático",
      "Coleções públicas compartilháveis",
    ],

    faq_title: "Perguntas frequentes",
    faq: [
      {
        q: "O Kura é gratuito?",
        a: "Sim. O Kura é gratuito para sempre para funcionalidades principais: salvar links, tags, comentários, busca e compartilhamento. O Kura Pro (sync + funcionalidades avançadas) será opcional.",
      },
      {
        q: "Onde meus links são armazenados?",
        a: "Inteiramente no IndexedDB do seu navegador — sem servidor, sem conta necessária. Seus dados nunca saem do seu dispositivo no plano gratuito.",
      },
      {
        q: "O Kura funciona offline?",
        a: "Sim. O Kura é 100% offline-first. Tudo funciona sem conexão à internet.",
      },
      {
        q: "O que é o Kura Pro?",
        a: "O Kura Pro é um plano premium em desenvolvimento com sync na nuvem, busca full-text e backups automáticos. Insira seu e-mail acima para ser notificado no lançamento.",
      },
      {
        q: "Quais navegadores são suportados?",
        a: "Chrome (Manifest V3) e Firefox (Manifest V2). Edge e outros navegadores baseados no Chromium também devem funcionar.",
      },
    ],

    footer_tagline: "Seus links, do seu jeito.",
    footer_chrome: "Chrome Web Store",
    footer_firefox: "Firefox Add-ons",
    footer_github: "GitHub",
    footer_rights: "Todos os direitos reservados.",
  },
} as const;

type Dict = typeof dictionaries.en;
type I18nContextType = { t: Dict; locale: Locale; toggle: () => void };

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kura-locale") as Locale | null;
      if (saved && (saved === "en" || saved === "pt_BR")) {
        setLocale(saved);
      } else {
        const browser = navigator.language;
        if (browser.startsWith("pt")) setLocale("pt_BR");
      }
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setLocale((prev) => {
      const next = prev === "en" ? "pt_BR" : "en";
      try { localStorage.setItem("kura-locale", next); } catch {}
      return next;
    });
  }, []);

  return (
    <I18nContext.Provider value={{ t: dictionaries[locale] as Dict, locale, toggle }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}
