/**
 * JAVASCRIPT DA PÁGINA DE VENDAS - DEVOÇÃO MARIANA
 * FAQ Accordion, Prova Social ao Vivo e Redirecionamento para Checkout
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. FAQ ACCORDION (PERGUNTAS FREQUENTES)
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // 2. PROVA SOCIAL TRANQUILA E FRATERNA (SEM POPUPS ARTIFICIAIS QUE CAUSAM DESCONFIANÇA)
  // Removemos alertas piscantes para manter a paz e a dignidade de uma autêntica loja sacra.

  // 3. BARRA FLUTUANTE INFERIOR MOBILE AO ROLAR
  const stickyBar = document.getElementById('mobileStickyBar');
  if (stickyBar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        stickyBar.classList.add('visible');
      } else {
        stickyBar.classList.remove('visible');
      }
    });
  }

  // 4. FACEBOOK PIXEL TRACKING - CLIQUES NOS BOTÕES DE COMPRA
  const ctaLinks = document.querySelectorAll('a[href*="checkout.html"]');
  ctaLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (typeof fbq === 'function') {
        fbq('track', 'InitiateCheckout', {
          content_name: 'Grande Kit Bênção Total do Lar 2026',
          content_type: 'product',
          value: 109.90,
          currency: 'BRL'
        });
      }
    });
  });
});
