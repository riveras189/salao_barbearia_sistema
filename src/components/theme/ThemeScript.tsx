import Script from "next/script";

const script = `
(() => {
  try {
    const model = window.localStorage.getItem('system_model_preference') || 'barbearia_v1';
    const theme = window.localStorage.getItem('salao-rf-theme') || 'light';
    document.documentElement.setAttribute('data-model', model);
    document.body.classList.add(model === 'barbearia_v1' ? 'model-barbearia' : model === 'personalizado_v1' ? 'model-personalizado' : 'model-padrao');
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  } catch (error) {
    console.error('Falha ao aplicar tema inicial', error);
  }
})();
`;

export default function ThemeScript() {
  return (
    <Script
      id="theme-init"
      dangerouslySetInnerHTML={{ __html: script }}
      strategy="beforeInteractive"
    />
  );
}
