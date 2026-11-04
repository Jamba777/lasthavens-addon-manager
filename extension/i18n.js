export const languages = {
  en: "English",
  uk: "Українська",
  ru: "Русский",
  es: "Español",
  fr: "Français",
  pt_BR: "Português",
};
let messages = {},
  locale = "en";
export function resolveLocale(value) {
  const v = String(value).replace("-", "_");
  return languages[v] ? v : languages[v.split("_")[0]] ? v.split("_")[0] : "en";
}
export async function setLocale(value) {
  locale = resolveLocale(value);
  messages = await (await fetch(`./_locales/${locale}/messages.json`)).json();
  document.documentElement.lang = locale.replace("_", "-");
  return locale;
}
export function t(key, params = {}) {
  let text = messages[key]?.message || key;
  for (const [name, value] of Object.entries(params))
    text = text.replaceAll(`{${name}}`, String(value));
  return text;
}
export function formatSize(n) {
  return new Intl.NumberFormat(locale.replace("_", "-"), {
    style: "unit",
    unit: n < 1024 ? "byte" : "megabyte",
    maximumFractionDigits: 2,
  }).format(n < 1024 ? n : n / 1024 / 1024);
}
