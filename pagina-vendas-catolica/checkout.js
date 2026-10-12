/**
 * CHECKOUT PROFISSIONAL - DEVOÇÃO MARIANA
 * Busca automática de CEP (ViaCEP), fallback manual, cálculo de frete dinâmico e pagamento Pix.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. BANCO DE DADOS DE PRODUTOS
  const produtos = {
    'kit-completo': {
      nome: 'Grande Kit Bênção Total do Lar 2026',
      subtitulo: 'A proteção sagrada completa para a sua família e seu lar.',
      descricao: 'Estátua 30cm com Coroa + Terço das Tulipas + Calendário 2026 + Livreto de Brinde',
      precoDe: 'R$ 220,00',
      economia: 'R$ 110,10',
      preco: 109.90,
      precoFormatado: 'R$ 109,90',
      imagem: 'assets/kit-completo.jpg',
      badgeTag: '3 Peças Sagradas Inclusas',
      isFreteGratis: true,
      isKitCompleto: true,
      itensInclusos: [
        {
          titulo: 'Estátua Nobre de 30cm de N. Sra. de Fátima',
          desc: 'Pintada à mão com manto perolado, coroa real com cruz e já benzida.',
          isGift: false
        },
        {
          titulo: 'Terço Sagrado das Tulipas Azuis',
          desc: 'Contas em cristal facetado azul de alto brilho e crucifixo nobre.',
          isGift: false
        },
        {
          titulo: 'Calendário Católico 2026 Oficial',
          desc: '12 meses ilustrados de parede com todos os Santos e orações diárias.',
          isGift: false
        },
        {
          titulo: 'Brinde Especial Gratuito: Livreto Devocional',
          desc: 'Guia das 7 Bênçãos para Consagração e Proteção do Lar.',
          isGift: true
        }
      ]
    },
    'estatua-30cm': {
      nome: 'Estátua de 30cm de Nossa Senhora de Fátima',
      subtitulo: 'Pintada artesanalmente à mão com manto perolado e coroa real.',
      descricao: 'Pintada artesanalmente à mão, coroa real com cruz e já benzida',
      precoDe: 'R$ 99,90',
      economia: 'R$ 40,00',
      preco: 59.90,
      precoFormatado: 'R$ 59,90',
      imagem: 'assets/estatua-hd.jpg',
      badgeTag: '1 Artigo Sagrado',
      isFreteGratis: false,
      isKitCompleto: false,
      itensInclusos: [
        {
          titulo: 'Estátua de 30cm de Nossa Senhora',
          desc: 'Peça nobre com coroa real com cruz, já benzida para abençoar seu lar.',
          isGift: false
        }
      ]
    },
    'terco-tulipas': {
      nome: 'Terço Sagrado das Tulipas Azuis',
      subtitulo: 'Contas em cristal facetado de alto brilho e crucifixo nobre.',
      descricao: 'Contas especiais em cristal azul em formato tulipa, medalha e crucifixo',
      precoDe: 'R$ 49,90',
      economia: 'R$ 20,00',
      preco: 29.90,
      precoFormatado: 'R$ 29,90',
      imagem: 'assets/terco-hd.jpg',
      badgeTag: '1 Artigo Sagrado',
      isFreteGratis: false,
      isKitCompleto: false,
      itensInclusos: [
        {
          titulo: 'Terço das Tulipas Azuis',
          desc: 'Contas especiais em cristal azul em formato tulipa, medalha e crucifixo.',
          isGift: false
        }
      ]
    },
    'calendario-2026': {
      nome: 'Calendário Católico 2026 de Bênçãos do Lar',
      subtitulo: '12 meses ilustrados com Aparições de Nossa Senhora e Santos.',
      descricao: '12 meses ilustrados com Aparição de Fátima, letras grandes e Santos do dia',
      precoDe: 'R$ 35,00',
      economia: 'R$ 15,10',
      preco: 19.90,
      precoFormatado: 'R$ 19,90',
      imagem: 'assets/calendario-hd.jpg',
      badgeTag: '1 Artigo Sagrado',
      isFreteGratis: false,
      isKitCompleto: false,
      itensInclusos: [
        {
          titulo: 'Calendário de Parede 2026',
          desc: '12 meses ilustrados com letras grandes, festas litúrgicas e orações diárias.',
          isGift: false
        }
      ]
    }
  };

  // Ler produto da URL (?produto=...)
  const urlParams = new URLSearchParams(window.location.search);
  const produtoKey = urlParams.get('produto') || 'kit-completo';
  const produtoAtual = produtos[produtoKey] || produtos['kit-completo'];

  // 2. RENDERIZAR RESUMO DO PRODUTO (FOCO NO KIT COMPLETO)
  const summaryImg = document.getElementById('summaryProdImg');
  const summaryName = document.getElementById('summaryProdName');
  const summaryDesc = document.getElementById('summaryProdDesc');
  const summaryFloatingTag = document.getElementById('summaryFloatingTag');
  const summaryOldPrice = document.getElementById('summaryOldPrice');
  const summaryOldPriceLine = document.getElementById('summaryOldPriceLine');
  const summarySavingsCallout = document.getElementById('summarySavingsCallout');
  const kitIncludedBox = document.getElementById('kitIncludedBox');
  const kitIncludedList = document.getElementById('kitIncludedList');
  const kitHighlightHeader = document.getElementById('kitHighlightHeader');
  const bannerProdTitle = document.getElementById('bannerProdTitle');
  const bannerProdDesc = document.getElementById('bannerProdDesc');
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryShipping = document.getElementById('summaryShipping');
  const summaryTotal = document.getElementById('summaryTotal');
  const btnSubmitOrder = document.getElementById('btnSubmitOrder');

  // Elementos do Resumo do Topo (Novo)
  const topOrderSummaryCard = document.getElementById('topOrderSummaryCard');
  const topSummaryProdName = document.getElementById('topSummaryProdName');
  const topSummaryPiecesTag = document.getElementById('topSummaryPiecesTag');
  const topSummaryOldPrice = document.getElementById('topSummaryOldPrice');
  const topSummaryDiscountTag = document.getElementById('topSummaryDiscountTag');
  const topSummaryPrice = document.getElementById('topSummaryPrice');
  const topSummaryItemsList = document.getElementById('topSummaryItemsList');

  if (summaryImg) summaryImg.src = produtoAtual.imagem;
  if (summaryName) summaryName.textContent = produtoAtual.nome;
  if (summaryDesc) summaryDesc.textContent = produtoAtual.subtitulo || produtoAtual.descricao;
  if (summaryFloatingTag) summaryFloatingTag.innerHTML = `<i class="fas fa-sparkles"></i> ${produtoAtual.badgeTag || 'Artigo Sagrado'}`;
  if (summarySubtotal) summarySubtotal.textContent = produtoAtual.precoFormatado;

  if (bannerProdTitle) bannerProdTitle.textContent = produtoAtual.nome;
  if (bannerProdDesc) bannerProdDesc.textContent = produtoAtual.descricao;

  // Atualizar Resumo do Topo
  if (topSummaryProdName) topSummaryProdName.textContent = produtoAtual.nome;
  if (topSummaryPiecesTag) {
    topSummaryPiecesTag.innerHTML = `<i class="fas fa-layer-group"></i> ${produtoAtual.badgeTag || 'Artigo Sagrado'}`;
  }
  if (topSummaryOldPrice) {
    if (produtoAtual.precoDe) {
      topSummaryOldPrice.textContent = `De ${produtoAtual.precoDe}`;
      topSummaryOldPrice.style.display = 'inline-block';
    } else {
      topSummaryOldPrice.style.display = 'none';
    }
  }
  if (topSummaryDiscountTag) {
    topSummaryDiscountTag.style.display = produtoAtual.precoDe ? 'inline-block' : 'none';
  }
  if (topSummaryItemsList && produtoAtual.itensInclusos) {
    topSummaryItemsList.innerHTML = produtoAtual.itensInclusos.map((item, idx) => `
      <div class="top-item-chip ${item.isGift ? 'chip-gift' : ''}">
        <span class="chip-num">${item.isGift ? '<i class="fas fa-gift"></i>' : (idx + 1)}</span>
        <div class="chip-text">
          <strong>${escapeHtml(item.titulo)}</strong>
          <span>${escapeHtml(item.desc ? '(' + item.desc.split('.')[0] + ')' : '')}</span>
        </div>
      </div>
    `).join('');
  }

  if (produtoAtual.precoDe && summaryOldPrice) {
    summaryOldPrice.textContent = produtoAtual.precoDe;
    if (summaryOldPriceLine) summaryOldPriceLine.style.display = 'flex';
  } else if (summaryOldPriceLine) {
    summaryOldPriceLine.style.display = 'none';
  }

  if (produtoAtual.economia && summarySavingsCallout) {
    summarySavingsCallout.innerHTML = `<i class="fas fa-piggy-bank"></i> Você está economizando <strong>${produtoAtual.economia}</strong> hoje!`;
    summarySavingsCallout.style.display = 'flex';
  } else if (summarySavingsCallout) {
    summarySavingsCallout.style.display = 'none';
  }

  if (kitHighlightHeader) {
    kitHighlightHeader.style.display = produtoAtual.isKitCompleto ? 'block' : 'none';
  }

  // Renderizar itens inclusos
  if (kitIncludedList && produtoAtual.itensInclusos) {
    kitIncludedList.innerHTML = produtoAtual.itensInclusos.map(item => `
      <li class="${item.isGift ? 'gift-item' : ''}">
        <i class="fas ${item.isGift ? 'fa-gift' : 'fa-circle-check'}"></i>
        <div>
          <strong>${item.titulo}:</strong>
          <span>${item.desc}</span>
        </div>
      </li>
    `).join('');
    if (kitIncludedBox) kitIncludedBox.style.display = 'block';
  }

  let valorFrete = 0;

  const pixBtnIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff" style="vertical-align: middle; margin-right: 6px; flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg"><path d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156"/></svg>`;

  function atualizarTotal() {
    const total = produtoAtual.preco + valorFrete;
    const formatted = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (summaryTotal) {
      summaryTotal.textContent = formatted;
    }
    if (topSummaryPrice) {
      topSummaryPrice.textContent = formatted;
    }
    if (btnSubmitOrder) {
      btnSubmitOrder.innerHTML = `${pixBtnIcon}<span>FINALIZAR NO PIX • ${formatted}</span>`;
    }
  }

  // Atualização inicial
  atualizarTotal();

  // Disparo dinâmico do evento InitiateCheckout no Facebook Pixel
  if (typeof fbq === 'function') {
    try {
      fbq('track', 'InitiateCheckout', {
        content_name: produtoAtual.nome,
        content_type: 'product',
        value: Number(produtoAtual.preco.toFixed(2)),
        currency: 'BRL'
      });
    } catch (e) {}
  }

  // Toggle do Carrinho (Expandir / Recolher)
  const carrinhoToggleBtn = document.getElementById('carrinhoToggleBtn');
  const carrinhoItemsList = document.getElementById('carrinhoItemsList');
  const carrinhoChevron = document.getElementById('carrinhoChevron');

  if (carrinhoToggleBtn && carrinhoItemsList && carrinhoChevron) {
    carrinhoToggleBtn.addEventListener('click', () => {
      const isCurrentlyHidden = window.getComputedStyle(carrinhoItemsList).display === 'none';
      carrinhoItemsList.style.display = isCurrentlyHidden ? 'flex' : 'none';
      carrinhoChevron.style.transform = isCurrentlyHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    });
  }

  // 3. MÁSCARAS DE ENTRADA (CEP, CPF, TELEFONE)
  const inputCep = document.getElementById('inputCep');
  const inputCpf = document.getElementById('inputCpf');
  const inputTelefone = document.getElementById('inputTelefone');

  if (inputCep) {
    inputCep.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 8) v = v.slice(0, 8);
      if (v.length > 5) {
        e.target.value = v.replace(/^(\d{5})(\d)/, '$1-$2');
      } else {
        e.target.value = v;
      }

      // Se completou 8 números, dispara a busca automática
      if (v.length === 8) {
        buscarCep(v);
      }
    });
  }

  if (inputCpf) {
    inputCpf.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = v;
    });
  }

  if (inputTelefone) {
    inputTelefone.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 6) {
        v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d)/, '($1) $2');
      }
      e.target.value = v;
    });
  }

  // 4. BUSCA AUTOMÁTICA DE CEP (ViaCEP) COM FALLBACK MANUAL
  const btnSearchCep = document.getElementById('btnSearchCep');
  const cepLoading = document.getElementById('cepLoadingHint');
  const cepFallback = document.getElementById('cepFallbackHint');
  const inputRua = document.getElementById('inputRua');
  const inputBairro = document.getElementById('inputBairro');
  const inputCidade = document.getElementById('inputCidade');
  const inputEstado = document.getElementById('inputEstado');
  const inputNumero = document.getElementById('inputNumero');
  const shippingStepBox = document.getElementById('shippingStepBox');
  const shippingOptionsContainer = document.getElementById('shippingOptionsContainer');

  if (btnSearchCep) {
    btnSearchCep.addEventListener('click', () => {
      const clean = inputCep.value.replace(/\D/g, '');
      if (clean.length === 8) {
        limparErroCampo(inputCep);
        buscarCep(clean);
      } else {
        mostrarErro(inputCep, 'Por favor, digite os 8 números do seu CEP.');
      }
    });
  }

  function buscarCep(cleanCep) {
    if (cepLoading) cepLoading.style.display = 'block';
    if (cepFallback) cepFallback.textContent = '';

    fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      .then(res => res.json())
      .then(data => {
        if (cepLoading) cepLoading.style.display = 'none';

        if (data.erro) {
          if (cepFallback) {
            cepFallback.innerHTML = '<span style="color: #dc2626;"><i class="fas fa-circle-exclamation"></i> CEP não localizado automaticamente. Por favor, digite seu endereço manualmente abaixo.</span>';
          }
          if (inputRua) inputRua.focus();
        } else {
          if (inputRua) inputRua.value = data.logradouro || '';
          if (inputBairro) inputBairro.value = data.bairro || '';
          if (inputCidade) inputCidade.value = data.localidade || '';
          if (inputEstado) inputEstado.value = data.uf || '';
          if (cepFallback) {
            cepFallback.innerHTML = '<span style="color: #16a34a;"><i class="fas fa-check-circle"></i> Endereço preenchido com sucesso! Digite o número da sua casa.</span>';
          }
          if (inputNumero) inputNumero.focus();
        }

        // Exibir opções de frete assim que o CEP é informado
        renderizarOpcoesFrete(data.uf || 'SP');
      })
      .catch(err => {
        if (cepLoading) cepLoading.style.display = 'none';
        if (cepFallback) {
          cepFallback.innerHTML = '<span style="color: #d97706;"><i class="fas fa-info-circle"></i> Não conseguimos buscar seu CEP no momento. Você pode digitar seu endereço normalmente abaixo!</span>';
        }
        renderizarOpcoesFrete('SP');
      });
  }

  // Se a pessoa preencher manualmente a rua e cidade, também abre o frete
  [inputRua, inputCidade].forEach(field => {
    if (field) {
      field.addEventListener('blur', () => {
        if (inputRua.value.trim() && inputCidade.value.trim()) {
          renderizarOpcoesFrete(inputEstado.value || 'SP');
        }
      });
    }
  });

  // 5. RENDERIZAR OPÇÕES DE FRETE DOS CORREIOS (Uma Grátis de 7 a 15 dias e Uma Paga de 1 a 7 dias)
  function renderizarOpcoesFrete(uf) {
    if (!shippingStepBox || !shippingOptionsContainer) return;

    shippingStepBox.style.display = 'block';

    // Se já estiver renderizado, mantém a escolha que o cliente já fez
    if (document.getElementById('cardGratis') && document.getElementById('cardExpresso')) {
      return;
    }

    const freteGratisPreco = 0.00;
    const freteExpressoPreco = 19.90; // Frete expresso prioritário

    shippingOptionsContainer.innerHTML = `
      <!-- Opção 1: Correios PAC (Grátis 7 a 15 dias) -->
      <label class="shipping-option-card selected" id="cardGratis">
        <div class="shipping-info-left">
          <div class="custom-radio-circle checked"></div>
          <input type="radio" name="shippingRadio" value="gratis" checked class="shipping-radio visually-hidden">
          <div class="shipping-content-wrap">
            <div class="shipping-top-row">
              <div class="carrier-badge-wrap correios-pac-theme">
                <svg class="correios-symbol-svg" viewBox="0 0 36 28" width="18" height="14" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#FFCC00" d="M12.5 4.5 L25 14 L12.5 23.5 L7.5 19.5 L15 14 L7.5 8.5 Z" />
                  <path fill="#003399" d="M23.5 23.5 L11 14 L23.5 4.5 L28.5 8.5 L21 14 L28.5 19.5 Z" />
                </svg>
                <span class="carrier-brand-name">CORREIOS</span>
                <span class="carrier-service-tag pac">PAC</span>
              </div>
              <span class="shipping-price-badge-free">GRÁTIS</span>
            </div>
            <div class="shipping-title">Correios - Envio Padrão Econômico</div>
            <div class="shipping-time">
              <i class="fas fa-calendar-check"></i> Prazo: <strong>7 a 15 dias úteis</strong> • Rastreamento oficial
            </div>
          </div>
        </div>
      </label>

      <!-- Opção 2: Correios SEDEX (Pago 1 a 7 dias) -->
      <label class="shipping-option-card" id="cardExpresso">
        <div class="shipping-info-left">
          <div class="custom-radio-circle"></div>
          <input type="radio" name="shippingRadio" value="expresso" class="shipping-radio visually-hidden">
          <div class="shipping-content-wrap">
            <div class="shipping-top-row">
              <div class="carrier-badge-wrap correios-sedex-theme">
                <svg class="correios-symbol-svg" viewBox="0 0 36 28" width="18" height="14" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#FFCC00" d="M12.5 4.5 L25 14 L12.5 23.5 L7.5 19.5 L15 14 L7.5 8.5 Z" />
                  <path fill="#003399" d="M23.5 23.5 L11 14 L23.5 4.5 L28.5 8.5 L21 14 L28.5 19.5 Z" />
                </svg>
                <span class="carrier-brand-name">CORREIOS</span>
                <span class="carrier-service-tag sedex">SEDEX</span>
              </div>
              <span class="shipping-price-value">R$ 19,90</span>
            </div>
            <div class="shipping-title">Correios - Sedex Expresso Prioritário</div>
            <div class="shipping-time">
              <i class="fas fa-bolt"></i> Prazo: <strong>1 a 7 dias úteis</strong> • Postagem prioritária
            </div>
          </div>
        </div>
      </label>

      <div class="shipping-peace-note">
        <i class="fas fa-box-archive"></i>
        <span><strong>Seguro Total Anti-Quebra Correios:</strong> Embalagem reforçada com múltiplas camadas de proteção. Se houver qualquer avaria no transporte, enviamos outra imagem nova imediatamente sem custo.</span>
      </div>
    `;

    // Por padrão seleciona o Frete Grátis (7 a 15 dias)
    valorFrete = freteGratisPreco;
    if (summaryShipping) {
      summaryShipping.textContent = 'GRÁTIS';
      summaryShipping.style.color = '#16a34a';
    }
    atualizarTotal();

    // Eventos de clique nas opções de frete
    const cardGratis = document.getElementById('cardGratis');
    const cardExpresso = document.getElementById('cardExpresso');

    cardGratis.addEventListener('click', () => {
      cardGratis.classList.add('selected');
      cardExpresso.classList.remove('selected');
      cardGratis.querySelector('.custom-radio-circle').classList.add('checked');
      cardExpresso.querySelector('.custom-radio-circle').classList.remove('checked');
      const radio = cardGratis.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      valorFrete = freteGratisPreco;
      if (summaryShipping) {
        summaryShipping.textContent = 'GRÁTIS';
        summaryShipping.style.color = '#16a34a';
      }
      atualizarTotal();
    });

    cardExpresso.addEventListener('click', () => {
      cardExpresso.classList.add('selected');
      cardGratis.classList.remove('selected');
      cardExpresso.querySelector('.custom-radio-circle').classList.add('checked');
      cardGratis.querySelector('.custom-radio-circle').classList.remove('checked');
      const radio = cardExpresso.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      valorFrete = freteExpressoPreco;
      if (summaryShipping) {
        summaryShipping.textContent = 'R$ 19,90';
        summaryShipping.style.color = '#1e293b';
      }
      atualizarTotal();
    });
  }

  // ==========================================
  // FUNÇÕES DE SEGURANÇA E HIGIENIZAÇÃO (ANTI-XSS)
  // ==========================================
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==========================================
  // VALIDAÇÕES PROFISSIONAIS DE FORMULÁRIO
  // ==========================================
  function validarNome(nome) {
    if (!nome) return false;
    const partes = nome.trim().split(/\s+/);
    return partes.length >= 2 && partes[0].length >= 2 && partes[1].length >= 2;
  }

  function validarCPF(cpf) {
    if (!cpf) return false;
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    // Rejeita dígitos repetidos (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(clean)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(clean.charAt(9), 10)) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(clean.charAt(i), 10) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(clean.charAt(10), 10)) return false;

    return true;
  }

  function validarTelefone(tel) {
    if (!tel) return false;
    const clean = tel.replace(/\D/g, '');
    if (clean.length < 10 || clean.length > 11) return false;
    const ddd = parseInt(clean.slice(0, 2), 10);
    if (ddd < 11 || ddd > 99) return false;
    return true;
  }

  function validarEmail(email) {
    if (!email) return true; // Campo opcional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validarCep(cep) {
    if (!cep) return false;
    const clean = cep.replace(/\D/g, '');
    return clean.length === 8;
  }

  function mostrarErro(inputElement, mensagem) {
    if (!inputElement) return;
    inputElement.classList.add('input-error');
    const parent = inputElement.closest('.form-group');
    if (parent) {
      let errorSpan = parent.querySelector('.form-field-error-msg');
      if (!errorSpan) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'form-field-error-msg';
        parent.appendChild(errorSpan);
      }
      errorSpan.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${escapeHtml(mensagem)}`;
    }
  }

  function limparErroCampo(inputElement) {
    if (!inputElement) return;
    inputElement.classList.remove('input-error');
    const parent = inputElement.closest('.form-group');
    if (parent) {
      const errorSpan = parent.querySelector('.form-field-error-msg');
      if (errorSpan) errorSpan.remove();
    }
  }

  function limparErros() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.form-field-error-msg').forEach(el => el.remove());
    const gatewayAlert = document.getElementById('checkoutGatewayAlert');
    if (gatewayAlert) gatewayAlert.remove();
  }

  // Remove o aviso de erro assim que o usuário digita no campo
  document.querySelectorAll('.checkout-form input, .checkout-form select').forEach(input => {
    input.addEventListener('input', () => limparErroCampo(input));
    input.addEventListener('change', () => limparErroCampo(input));
  });

  // 6. EXPERIÊNCIA SERENA E TRANQUILA (SEM PRESSÃO OU RELÓGIO DE ANSIEDADE)
  // O estoque fica reservado com tranquilidade e respeito pelo devoto.

  // 7. FINALIZAÇÃO DO PEDIDO VIA PIX (EXIBE TELA PROFISSIONAL DE PAGAMENTO)
  const checkoutForm = document.getElementById('checkoutMainForm');

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      limparErros();

      const inputNomeEl = document.getElementById('inputNome');
      const inputCpfEl = document.getElementById('inputCpf');
      const inputTelefoneEl = document.getElementById('inputTelefone');
      const inputEmailEl = document.getElementById('inputEmail');
      const inputCepEl = document.getElementById('inputCep');
      const inputRuaEl = document.getElementById('inputRua');
      const inputNumeroEl = document.getElementById('inputNumero');
      const inputComplementoEl = document.getElementById('inputComplemento');
      const inputBairroEl = document.getElementById('inputBairro');
      const inputCidadeEl = document.getElementById('inputCidade');
      const inputEstadoEl = document.getElementById('inputEstado');

      const nome = inputNomeEl ? inputNomeEl.value.trim() : '';
      const cpf = inputCpfEl ? inputCpfEl.value.trim() : '';
      const telefone = inputTelefoneEl ? inputTelefoneEl.value.trim() : '';
      const email = inputEmailEl ? inputEmailEl.value.trim() : '';
      const cep = inputCepEl ? inputCepEl.value.trim() : '';
      const rua = inputRuaEl ? inputRuaEl.value.trim() : '';
      const numero = inputNumeroEl ? inputNumeroEl.value.trim() : '';
      const complemento = inputComplementoEl ? inputComplementoEl.value.trim() : '';
      const bairro = inputBairroEl ? inputBairroEl.value.trim() : '';
      const cidade = inputCidadeEl ? inputCidadeEl.value.trim() : '';
      const estado = inputEstadoEl ? inputEstadoEl.value.trim() : '';

      // Validação estrita de cada campo
      let primeiroInvalido = null;

      if (!validarNome(nome)) {
        mostrarErro(inputNomeEl, 'Por favor, informe seu nome e sobrenome completos.');
        if (!primeiroInvalido) primeiroInvalido = inputNomeEl;
      }

      if (!validarCPF(cpf)) {
        mostrarErro(inputCpfEl, 'CPF inválido. Por favor, confira os números digitados.');
        if (!primeiroInvalido) primeiroInvalido = inputCpfEl;
      }

      if (!validarTelefone(telefone)) {
        mostrarErro(inputTelefoneEl, 'Por favor, informe um telefone celular válido com DDD.');
        if (!primeiroInvalido) primeiroInvalido = inputTelefoneEl;
      }

      if (email && !validarEmail(email)) {
        mostrarErro(inputEmailEl, 'Por favor, informe um e-mail válido.');
        if (!primeiroInvalido) primeiroInvalido = inputEmailEl;
      }

      if (!validarCep(cep)) {
        mostrarErro(inputCepEl, 'Por favor, informe um CEP válido com 8 dígitos.');
        if (!primeiroInvalido) primeiroInvalido = inputCepEl;
      }

      if (!rua) {
        mostrarErro(inputRuaEl, 'Por favor, informe o nome da sua rua ou avenida.');
        if (!primeiroInvalido) primeiroInvalido = inputRuaEl;
      }

      if (!numero) {
        mostrarErro(inputNumeroEl, 'Por favor, informe o número da sua residência (ou S/N).');
        if (!primeiroInvalido) primeiroInvalido = inputNumeroEl;
      }

      if (!bairro) {
        mostrarErro(inputBairroEl, 'Por favor, informe o seu bairro.');
        if (!primeiroInvalido) primeiroInvalido = inputBairroEl;
      }

      if (!cidade) {
        mostrarErro(inputCidadeEl, 'Por favor, informe a sua cidade.');
        if (!primeiroInvalido) primeiroInvalido = inputCidadeEl;
      }

      if (!estado) {
        mostrarErro(inputEstadoEl, 'Por favor, selecione o seu estado.');
        if (!primeiroInvalido) primeiroInvalido = inputEstadoEl;
      }

      // Se houver algum erro, focaliza e rola suavemente até o campo
      if (primeiroInvalido) {
        primeiroInvalido.focus();
        primeiroInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Higienização contra XSS
      const nomeSafe = escapeHtml(nome);
      const cpfSafe = escapeHtml(cpf);
      const telefoneSafe = escapeHtml(telefone);
      const emailSafe = escapeHtml(email);
      const cepSafe = escapeHtml(cep);
      const ruaSafe = escapeHtml(rua);
      const numeroSafe = escapeHtml(numero);
      const complementoSafe = escapeHtml(complemento);
      const bairroSafe = escapeHtml(bairro);
      const cidadeSafe = escapeHtml(cidade);
      const estadoSafe = escapeHtml(estado);

      const valorFinal = produtoAtual.preco + valorFrete;
      const valorFinalStr = valorFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      // Gerar número de pedido único e data atual
      const numPedido = 'DM-' + Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 90);
      const dataAtualStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      // Feedback visual no botão de finalizar
      const btnSubmitOrder = document.getElementById('btnSubmitOrder');
      const originalBtnHtml = btnSubmitOrder ? btnSubmitOrder.innerHTML : '';
      if (btnSubmitOrder) {
        btnSubmitOrder.disabled = true;
        btnSubmitOrder.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GERANDO SEU CÓDIGO PIX OFICIAL...';
      }

      const cleanDoc = cpf.replace(/\D/g, '');
      const cleanPhone = telefone.replace(/\D/g, '');

      let pixCode = '';
      let qrCodeUrl = '';
      let transactionId = '';

      try {
        const response = await fetch('/api/create-pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: numPedido,
            amount: Number(valorFinal.toFixed(2)),
            client: {
              name: nome,
              email: email,
              phone: cleanPhone,
              document: cleanDoc
            },
            shipping: {
              frete: valorFrete,
              modalidade: valorFrete === 0 ? 'PAC' : 'SEDEX',
              rua: rua,
              numero: numero,
              complemento: complemento,
              bairro: bairro,
              cidade: cidade,
              estado: estado,
              cep: cep.replace(/\D/g, '')
            },
            produto: produtoAtual.nome,
            meta: {
              fbp: (document.cookie.match(/(^|;)\s*_fbp\s*=\s*([^;]+)/) || [])[2] || '',
              fbc: (document.cookie.match(/(^|;)\s*_fbc\s*=\s*([^;]+)/) || [])[2] || ''
            }
          })
        });

        let data = null;
        try {
          const rawText = await response.text();
          data = rawText ? JSON.parse(rawText) : null;
        } catch (jsonErr) {
          throw new Error('O servidor de processamento de Pix não respondeu adequadamente. Verifique se o serviço está configurado como Web Service na hospedagem.');
        }

        if (!data || !response.ok || !data.success || !data.pix || !data.pix.code) {
          throw new Error((data && data.message) || 'Não foi possível gerar a chave Pix no momento. Tente novamente em instantes.');
        }

        pixCode = data.pix.code;
        qrCodeUrl = data.pix.base64 ? data.pix.base64 : `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(pixCode)}`;
        transactionId = data.transactionId || '';

        // Disparo do evento AddPaymentInfo no Facebook Pixel
        if (typeof fbq === 'function') {
          try {
            fbq('track', 'AddPaymentInfo', {
              content_name: 'Grande Kit Bênção Total do Lar 2026',
              content_type: 'product',
              value: Number(valorFinal.toFixed(2)),
              currency: 'BRL'
            });
          } catch (e) {}
        }

      } catch (err) {
        console.error('Erro ao gerar Pix:', err);
        if (btnSubmitOrder) {
          btnSubmitOrder.disabled = false;
          btnSubmitOrder.innerHTML = originalBtnHtml;
        }

        let existingAlert = document.getElementById('checkoutGatewayAlert');
        if (!existingAlert) {
          existingAlert = document.createElement('div');
          existingAlert.id = 'checkoutGatewayAlert';
          existingAlert.className = 'checkout-alert-error';
          const submitWrap = btnSubmitOrder ? btnSubmitOrder.parentElement : checkoutForm;
          submitWrap.insertBefore(existingAlert, btnSubmitOrder);
        }
        existingAlert.innerHTML = `<i class="fas fa-triangle-exclamation"></i> <div><strong>Não foi possível gerar a chave Pix:</strong> ${escapeHtml(err.message)}</div>`;
        existingAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Esconder grid de checkout e exibir tela completa de pagamento Pix
      // Esconder formulário e exibir tela minimalista de pagamento Pix
      const mainContainer = document.querySelector('.checkout-main');
      if (mainContainer) {
        mainContainer.innerHTML = `
          <div class="checkout-clean-container">
            <section class="checkout-card pix-card-clean">
              
              <!-- TOPO: SUCESSO E PROTOCOLO -->
              <div class="pix-clean-header">
                <div class="pix-clean-badge-success">
                  <i class="fas fa-circle-check"></i> Pedido Gerado com Sucesso!
                </div>
                <h2 class="pix-clean-title">Falta apenas pagar no Pix</h2>
                <p class="pix-clean-order-tag">
                  Pedido <strong>#${escapeHtml(numPedido)}</strong> • ${escapeHtml(dataAtualStr)}
                </p>
              </div>

              <!-- VALOR TOTAL EM DESTAQUE CLARO -->
              <div class="pix-clean-amount-box">
                <span class="pix-amount-label">Valor total a pagar:</span>
                <div class="pix-clean-amount-val">${valorFinalStr}</div>
                <span class="pix-amount-sub">Pix à vista • 3 Peças Sagradas Reservadas</span>
              </div>

              <!-- BOTÃO PRINCIPAL DE CÓPIA (HERO PARA IDOSOS NO CELULAR) -->
              <div class="pix-clean-copy-box">
                <button type="button" id="btnCopyPixFinal" class="btn-copy-pix-clean">
                  <i class="fas fa-copy"></i> COPIAR CÓDIGO PIX
                </button>
                <input type="text" id="pixCodeInput" readonly value="${pixCode}" class="pix-input-clean-hidden" aria-label="Código Pix Copia e Cola">
                <div id="copySuccessMsg" class="pix-clean-success-msg" style="display: none;">
                  <i class="fas fa-circle-check"></i> <strong>Código copiado com sucesso!</strong> Abra o app do seu banco e cole na opção <strong>Pix Copia e Cola</strong>.
                </div>
                <p class="pix-clean-instructions">
                  <i class="fas fa-hand-pointer"></i> <strong>Como pagar:</strong> Toque no botão verde acima para copiar. Depois abra o app do seu banco e escolha a opção <strong>Pix Copia e Cola</strong>.
                </p>
              </div>

              <!-- QR CODE CENTRALIZADO (OPCIONAL / COMPUTADOR) -->
              <div class="pix-clean-qr-box">
                <div class="pix-clean-divider">
                  <span>OU PAGUE COM A CÂMERA (QR CODE)</span>
                </div>
                <div class="pix-clean-qr-wrapper">
                  <img src="${qrCodeUrl}" alt="QR Code Pix" class="pix-clean-qr-image" onerror="this.src='https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=DEVOCAO_MARIANA_PIX';">
                </div>
                <p class="pix-clean-qr-hint">Se estiver no computador, aponte a câmera do aplicativo do seu banco para a imagem acima.</p>
              </div>

              <!-- TRANQUILIDADE E CONFIANÇA (NÃO ATRAPALHA A COMPRA) -->
              <div class="pix-clean-trust-box">
                <div class="trust-item">
                  <i class="fas fa-boxes-packing"></i>
                  <span><strong>3 Peças Reservadas:</strong> Seu kit já está separado para envio pelos Correios.</span>
                </div>
                <div class="trust-item">
                  <i class="fas fa-bolt-lightning"></i>
                  <span><strong>Confirmação Automática:</strong> O banco nos avisa na hora (não precisa enviar comprovante).</span>
                </div>
                <div class="trust-item">
                  <i class="fas fa-shield-halved"></i>
                  <span><strong>Seguro Total dos Correios:</strong> Entrega garantida e protegida em todo o Brasil.</span>
                </div>
              </div>

              <!-- BOTÕES DE AÇÃO -->
              <div class="pix-clean-buttons">
                <button type="button" id="btnConfirmPaid" class="btn-already-paid-clean">
                  <i class="fas fa-receipt"></i> Já Realizei o Pagamento
                </button>
                <a href="index.html" class="link-voltar-loja" id="btnBackStore">
                  <i class="fas fa-arrow-left"></i> Voltar à Loja
                </a>
              </div>

              <!-- STATUS EM TEMPO REAL -->
              <div class="pix-live-status-pill" id="pixLiveBadge">
                <span class="pix-status-pulse"></span> Aguardando identificação bancária...
              </div>

            </section>
          </div>
        `;

        // Ativar clique do botão Copiar Código Pix com compatibilidade total para celulares
        const btnCopyFinal = document.getElementById('btnCopyPixFinal');
        const pixInputFinal = document.getElementById('pixCodeInput');
        const copyMsg = document.getElementById('copySuccessMsg');

        if (btnCopyFinal && pixInputFinal) {
          btnCopyFinal.addEventListener('click', () => {
            pixInputFinal.select();
            pixInputFinal.setSelectionRange(0, 99999); // Suporte para navegadores mobile iOS e Android
            
            const handleCopySuccess = () => {
              if (copyMsg) copyMsg.style.display = 'block';
              btnCopyFinal.innerHTML = '<i class="fas fa-check"></i> CÓDIGO COPIADO!';
              btnCopyFinal.style.background = '#15803d';
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(pixInputFinal.value)
                .then(handleCopySuccess)
                .catch(() => {
                  try {
                    document.execCommand('copy');
                    handleCopySuccess();
                  } catch (err) {
                    console.error('Falha ao copiar:', err);
                  }
                });
            } else {
              try {
                document.execCommand('copy');
                handleCopySuccess();
              } catch (err) {
                console.error('Falha ao copiar:', err);
              }
            }
          });
        }

        // Função para renderizar o comprovante de pagamento
        const renderizarRecibo = (isApprovedAuto = false) => {
          mainContainer.innerHTML = `
            <div class="checkout-clean-container">
              <section class="checkout-card pix-card-clean" style="text-align: center;">
                <div class="pix-receipt-icon">
                  <i class="fas fa-${isApprovedAuto ? 'circle-check' : 'dove'}"></i>
                </div>
                <h2 style="font-size: 1.45rem; color: #0f172a; margin: 8px 0 4px 0; font-weight: 800;">
                  ${isApprovedAuto ? 'Pagamento Pix Confirmado!' : 'Pedido Registrado com Sucesso!'}
                </h2>
                <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 18px;">
                  ${isApprovedAuto ? 'Seu kit já foi liberado para expedição imediata.' : 'Aguardando compensação bancária.'}
                </p>

                <div class="receipt-summary-box">
                  <div class="receipt-row"><span>Pedido:</span><strong>#${escapeHtml(numPedido)}</strong></div>
                  <div class="receipt-row"><span>Data:</span><span>${escapeHtml(dataAtualStr)}</span></div>
                  <div class="receipt-row"><span>Destinatário:</span><strong>${nomeSafe}</strong></div>
                  <div class="receipt-row"><span>Itens:</span><span>3 Peças Sagradas + Brinde</span></div>
                  <div class="receipt-row receipt-total"><span>Total:</span><strong style="color: #15803d;">${valorFinalStr}</strong></div>
                  <div class="receipt-row"><span>Status:</span><strong style="color: #16a34a;"><i class="fas fa-check-circle"></i> ${isApprovedAuto ? 'Aprovado / Pago' : 'Aguardando Compensação'}</strong></div>
                  <div class="receipt-row"><span>Envio:</span><span>Correios (${ruaSafe}, nº ${numeroSafe} - ${cidadeSafe}/${estadoSafe})</span></div>
                </div>

                <div class="receipt-sms-notice">
                  <i class="fas fa-sms"></i> O rastreamento oficial dos Correios será enviado para o celular <strong>${telefoneSafe}</strong>.
                </div>

                <div class="pix-clean-buttons" style="margin-top: 18px;">
                  <button type="button" onclick="window.print();" class="btn-print-clean">
                    <i class="fas fa-print"></i> Imprimir Comprovante
                  </button>
                  <a href="index.html" class="link-voltar-loja" style="margin-top: 6px;">
                    <i class="fas fa-arrow-left"></i> Voltar à Loja
                  </a>
                </div>
              </section>
            </div>
          `;
          window.scrollTo({ top: 0, behavior: 'smooth' });

          // Disparo do evento Purchase no Facebook Pixel ESTRITAMENTE QUANDO O BANCO CONFIRMA
          if (isApprovedAuto && typeof fbq === 'function') {
            try {
              fbq('track', 'Purchase', {
                content_name: 'Grande Kit Bênção Total do Lar 2026',
                content_type: 'product',
                value: Number(valorFinal.toFixed(2)),
                currency: 'BRL',
                order_id: numPedido
              }, { eventID: numPedido });
            } catch (e) {}
          }
        };

        // Polling para checar se o Pix foi pago via Webhook em tempo real
        let pollInterval = setInterval(async () => {
          try {
            const checkRes = await fetch(`/api/order-status/${encodeURIComponent(numPedido)}`);
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (checkData.status === 'COMPLETED' || checkData.status === 'PAID') {
                clearInterval(pollInterval);
                renderizarRecibo(true);
              }
            }
          } catch (e) {
            // Silencioso em caso de oscilação momentânea
          }
        }, 3500);

        // Ativar botão de conferência de pagamento (valida com o banco antes de aprovar)
        const btnConfirmPaid = document.getElementById('btnConfirmPaid');
        if (btnConfirmPaid) {
          btnConfirmPaid.addEventListener('click', async () => {
            const originalPaidHtml = btnConfirmPaid.innerHTML;
            btnConfirmPaid.disabled = true;
            btnConfirmPaid.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conferindo com o banco...';

            try {
              const checkRes = await fetch(`/api/order-status/${encodeURIComponent(numPedido)}`);
              if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.status === 'COMPLETED' || checkData.status === 'PAID') {
                  clearInterval(pollInterval);
                  renderizarRecibo(true);
                  return;
                }
              }
            } catch (e) {}

            btnConfirmPaid.disabled = false;
            btnConfirmPaid.innerHTML = originalPaidHtml;
            alert('Aguardando identificação do Banco Central. Assim que você concluir a transferência no seu aplicativo do banco, esta tela atualizará automaticamente em instantes!');
          });
        }

        const btnBackStore = document.getElementById('btnBackStore');
        if (btnBackStore) {
          btnBackStore.addEventListener('click', () => {
            clearInterval(pollInterval);
          });
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
});
