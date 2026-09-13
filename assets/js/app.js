document.addEventListener('DOMContentLoaded', () => {
    const numRods = 7;
    const abacusRodsContainer = document.getElementById('abacus-rods-container');
    const totalValueDisplay = document.getElementById('total-value');
    const mathNotationDisplay = document.getElementById('math-notation');
    const rodValues = Array(numRods).fill(0);
    const tutorialToggleBtn = document.getElementById('tutorial-toggle');
    const tutorialContentDiv = document.getElementById('tutorial-content');
    const sumToggleBtn = document.getElementById('sum-toggle');
    const sumContentDiv = document.getElementById('sum-content');
    const subToggleBtn = document.getElementById('sub-toggle');
    const subContentDiv = document.getElementById('sub-content');
    const sorobanToggleBtn = document.getElementById('soroban-toggle');
    const sorobanContentDiv = document.getElementById('soroban-content');
    const clearButton = document.getElementById('clear-button');
    const invertButton = document.getElementById('invert-button');
    const translationBtn = document.getElementById('translation-button');
    const githubLink = document.querySelector('.github-link');
    const decimalForm = document.getElementById('decimal-form');
    const decimalInput = document.getElementById('decimal-input');
    const decimalInputLabel = document.getElementById('decimal-input-label');
    const applyDecimalBtn = document.getElementById('apply-decimal-button');

    // Hide top-corner icons when the page is scrolled down; show them only at the very top
    const updateTopIconsVisibility = () => {
        const atTop = (window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0) <= 0;
        if (translationBtn) translationBtn.style.display = atTop ? '' : 'none';
        if (githubLink) githubLink.style.display = atTop ? '' : 'none';
    };
    // Initialize and bind scroll listener
    updateTopIconsVisibility();
    window.addEventListener('scroll', updateTopIconsVisibility, { passive: true });

    // Constants for bead colors with high WCAG contrast
    const COLOR_DEFAULT = '#48bb78';
    const COLOR_TOP_ACTIVE = '#38bdf8';
    const COLOR_BOTTOM_ACTIVE = '#f87171';
    const COLOR_BOTH_ACTIVE = '#ffffff';

    // Precompute powers of 3 to avoid repeated Math.pow in updates
    const POW3 = Array.from({ length: numRods }, (_, i) => 3 ** i);

    const updateBeadAria = (bead, rodIndex, val, isActive) => {
        const lang = currentLang || 'pt';
        const sign = val > 0 ? '+1' : '-1';
        const stateText = isActive
            ? (lang === 'pt' ? 'ativada' : 'active')
            : (lang === 'pt' ? 'desativada' : 'inactive');
        const label = lang === 'pt'
            ? `Haste com potência 3 elevado a ${rodIndex}, valor ${sign}, ${stateText}`
            : `Rod with power 3 to the ${rodIndex}, value ${sign}, ${stateText}`;
        bead.setAttribute('aria-label', label);
        bead.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    };

    // Helper to apply the visual/logic state of a rod after a click
    const applyRodState = (i, topBead, bottomBead) => {
        const isTopActive = topBead.classList.contains('active');
        const isBottomActive = bottomBead.classList.contains('active');

        if (isTopActive && isBottomActive) {
            topBead.style.borderTopColor = COLOR_BOTH_ACTIVE;
            bottomBead.style.borderBottomColor = COLOR_BOTH_ACTIVE;
            rodValues[i] = 0;
        } else if (isTopActive) {
            topBead.style.borderTopColor = COLOR_TOP_ACTIVE;
            bottomBead.style.borderBottomColor = COLOR_DEFAULT;
            rodValues[i] = 1;
        } else if (isBottomActive) {
            bottomBead.style.borderBottomColor = COLOR_BOTTOM_ACTIVE;
            topBead.style.borderTopColor = COLOR_DEFAULT;
            rodValues[i] = -1;
        } else {
            topBead.style.borderTopColor = COLOR_DEFAULT;
            bottomBead.style.borderBottomColor = COLOR_DEFAULT;
            rodValues[i] = 0;
        }

        updateBeadAria(topBead, i, 1, isTopActive);
        updateBeadAria(bottomBead, i, -1, isBottomActive);
    };

    // Lazy-load MathJax and typeset only needed containers
    let mathJaxLoaded = false;
    const loadMathJax = () => {
        if (mathJaxLoaded || window.MathJax) return Promise.resolve();
        return new Promise((resolve, reject) => {
            window.MathJax = {
                startup: { typeset: false }
            };
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
            s.async = true;
            s.onload = () => { mathJaxLoaded = true; resolve(); };
            s.onerror = reject;
            document.head.appendChild(s);
        });
    };
    const typesetElements = async (elements) => {
        await loadMathJax();
        const arr = Array.isArray(elements) ? elements : [elements];
        return window.MathJax.typesetPromise(arr);
    };

    // Utility to wire a simple show/hide toggle and typeset MathJax when shown
    const wireToggle = (btn, content) => {
        btn.addEventListener('click', async () => {
            const isCurrentlyHidden = content.classList.contains('hidden');
            content.classList.toggle('hidden');
            btn.setAttribute('aria-expanded', isCurrentlyHidden ? 'true' : 'false');
            if (isCurrentlyHidden) {
                await typesetElements(content);
            }
        }, { passive: true });
    };

    const translations = {
        'pt': {
            'main-title': 'Ábaco Ternário Balanceado',
            'description': 'Mova as contas para somar (+1) ou subtrair (-1). Observe a notação polinomial se transformar instantaneamente a cada movimento.',
            'total-title': 'Valor Decimal',
            'tutorial-toggle': '👉 Guia Passo a Passo do Ábaco',
            'sum-toggle': '➕ Como Somar na Base 3',
            'sub-toggle': '➖ Como Subtrair na Base 3',
            'tutorial-title': 'Guia de Aprendizado do Ábaco Ternário Balanceado',
            'tutorial-p1': 'Domine a aritmética posicional operando valores simétricos: <b>+1</b> (positivo), <b>0</b> (neutro) e <b>-1</b> (negativo). Esse método simplifica o cálculo mental ao dispensar regras separadas para sinais.',
            'tutorial-p2': 'Cada haste vertical representa uma potência posicional de 3, ordenadas da direita para a esquerda:',
            'tutorial-li1': '<strong class="text-teal-300">Primeira haste (da direita):</strong> \\(3^0\\) (valor 1)',
            'tutorial-li2': '<strong class="text-teal-300">Segunda haste:</strong> \\(3^1\\) (valor 3)',
            'tutorial-li3': '<strong class="text-teal-300">Terceira haste:</strong> \\(3^2\\) (valor 9)',
            'tutorial-li4': 'Hastes subsequentes: potências crescentes \\(3^3\\) (27), \\(3^4\\) (81), \\(3^5\\) (243) e \\(3^6\\) (729).',
            'tutorial-h3-1': 'Representando Valores com as Contas',
            'tutorial-p3': 'Cada haste possui duas contas móveis alinhadas à barra horizontal central de referência:',
            'tutorial-li5': 'Para registrar <b>+1</b>: Aproxime a conta superior da barra central.',
            'tutorial-li6': 'Para registrar <b>-1</b>: Aproxime a conta inferior da barra central.',
            'tutorial-li7': 'Para registrar <b>0</b>: Mantenha ambas as contas afastadas da barra central.',
            'tutorial-li8': 'O sistema oferece duas configurações perfeitamente equilibradas para o valor <b>0</b>:',
            'tutorial-li9': '<strong class="text-teal-300">Posição Neutra:</strong> Nenhuma conta toca a barra central.',
            'tutorial-li10': '<strong class="text-teal-300">Posição Balanceada:</strong> Ambas as contas tocam a barra central simultaneamente, demonstrando fisicamente que \\(1 + (-1) = 0\\).',
            'tutorial-h3-2': 'Lendo o Valor Total',
            'tutorial-p4': 'O valor final do ábaco resulta da soma ponderada de cada haste. O simulador calcula o valor decimal correspondente de forma instantânea e detalha a notação matemática expandida para consolidar o aprendizado.',

            'footer-sum-title': 'Como somar no ábaco',
            'footer-sum-p1': 'Execute adições com precisão mecânica posicionando o primeiro número e somando a segunda parcela haste por haste, da direita para a esquerda.',
            'footer-sum-li1': '<strong class="text-teal-300">1. Posicione a primeira parcela:</strong> Mova as contas até registrar o primeiro valor. O total decimal correspondente surge na tela.',
            'footer-sum-li2': '<strong class="text-teal-300">2. Adicione a segunda parcela:</strong> Inicie pela haste das unidades (\\(3^0\\)). Acione a conta superior (\\(+1\\)) para somar unidades ou a inferior (\\(-1\\)) para subtrair unidades.',
            'footer-sum-li3': '<strong class="text-teal-300">3. Execute o transporte ternário:</strong> Quando uma haste acumular valor local \\(+2\\), registre \\(-1\\) nessa posição e adicione \\(+1\\) na haste imediatamente à esquerda (\\(+2 = -1 + 1\\cdot 3\\)). Para valor local \\(-2\\), registre \\(+1\\) e deduza \\(1\\) na haste à esquerda (\\(-2 = 1 - 1\\cdot 3\\)).',
            'footer-sum-note': 'Dica prática: Duas contas tocando a barra na mesma haste anulam-se mutuamente gerando \\(0\\). Acompanhe essa simplificação em tempo real no visor de notação matemática.',

            'footer-sum-table-title': 'Tabela de combinações para somar',
            'footer-sum-col1': 'Alvo (+n)',
            'footer-sum-col2': 'Combinação em potências de 3',

            'footer-sub-title': 'Como subtrair no ábaco',
            'footer-sub-p1': 'Subtrair na base ternária balanceada consiste em somar o inverso aritmético do subtraendo. Cada dígito \\(+1\\) transforma-se em \\(-1\\) e cada \\(-1\\) torna-se \\(+1\\).',
            'footer-sub-li1': '<strong class="text-teal-300">1. Registre o minuendo:</strong> Componha o valor inicial no ábaco.',
            'footer-sub-li2': '<strong class="text-teal-300">2. Aplique a inversão:</strong> Mude o sinal dos dígitos da segunda parcela e aplique-os haste por haste.',
            'footer-sub-li3': '<strong class="text-teal-300">3. Conclua as compensações:</strong> Resolva excessos locais convertendo \\(-2\\) em \\(+1\\) na haste atual com transporte de \\(-1\\) para a haste à esquerda.',
            'footer-sub-note': 'Dica de agilidade: O botão Inverter Sinais (+/-) no painel inverte todos os dígitos ativados com um único toque, agilizando subtrações sequenciais.',

            'footer-sub-table-title': 'Tabela de combinações para subtrair',
            'footer-sub-col1': 'Alvo (-n)',
            'footer-sub-col2': 'Combinação em potências de 3',

            /* Soroban-inspired tips */
            'soroban-toggle': '💡 Princípios Ergonômicos do Soroban',
            'soroban-title': 'Técnicas Ergonômicas do Soroban Tradicional',
            'soroban-p1': 'A engenharia secular do Soroban oferece técnicas ergonômicas comprovadas que elevam a precisão e o ritmo de cálculo no ábaco ternário balanceado.',
            'soroban-li1': '<strong class="text-teal-300">Agrupamento ternário:</strong> Hastes separadas em blocos de 3 facilitam a identificação visual imediata das ordens de grandeza.',
            'soroban-li2': '<strong class="text-teal-300">Regiões Céu e Terra:</strong> O contraste sutil entre os planos superior e inferior ancora o foco e acelera a conferência dos sinais.',
            'soroban-li3': '<strong class="text-teal-300">Varredura de reinicialização:</strong> O botão Zerar Contas reproduz o gesto clássico de limpeza do Soroban, preparando o instrumento para o cálculo seguinte.',
            'soroban-li4': '<strong class="text-teal-300">Sequência natural:</strong> Conduza operações sempre a partir da haste inicial \\(3^0\\) à direita, garantindo cadência mental constante.',
            'soroban-li5': '<strong class="text-teal-300">Harmonização contínua:</strong> Ao encontrar saturação \\(+2\\) ou \\(-2\\), faça a compensação posicional imediata rumo à haste seguinte.',
            'clear-button': 'Zerar Contas',
            'invert-button': 'Inverter Sinais (+/-)',
            'decimal-input-label': 'Insira um valor decimal (-1093 a 1093):',
            'apply-decimal-button': 'Converter no Ábaco'
        },
        'en': {
            'main-title': 'Balanced Ternary Abacus',
            'description': 'Move the beads to add (+1) or subtract (-1). Watch the polynomial notation update instantly with every move.',
            'total-title': 'Decimal Value',
            'tutorial-toggle': '👉 Abacus Step-by-Step Guide',
            'sum-toggle': '➕ How to Add in Base 3',
            'sub-toggle': '➖ How to Subtract in Base 3',
            'tutorial-title': 'Balanced Ternary Abacus Learning Guide',
            'tutorial-p1': 'Master positional arithmetic using symmetric values: <b>+1</b> (positive), <b>0</b> (neutral), and <b>-1</b> (negative). This method streamlines mental math by unifying positive and negative operations into a single set of movements.',
            'tutorial-p2': 'Each vertical rod represents a positional power of 3, arranged from right to left:',
            'tutorial-li1': '<strong class="text-teal-300">First rod (on the right):</strong> \\(3^0\\) (value 1)',
            'tutorial-li2': '<strong class="text-teal-300">Second rod:</strong> \\(3^1\\) (value 3)',
            'tutorial-li3': '<strong class="text-teal-300">Third rod:</strong> \\(3^2\\) (value 9)',
            'tutorial-li4': 'Subsequent rods: expanding powers \\(3^3\\) (27), \\(3^4\\) (81), \\(3^5\\) (243), and \\(3^6\\) (729).',
            'tutorial-h3-1': 'Representing Values with the Beads',
            'tutorial-p3': 'Each rod features two movable beads aligned with the central reference beam:',
            'tutorial-li5': 'To enter <b>+1</b>: Slide the top bead against the central beam.',
            'tutorial-li6': 'To enter <b>-1</b>: Slide the bottom bead against the central beam.',
            'tutorial-li7': 'To enter <b>0</b>: Keep both beads away from the central beam.',
            'tutorial-li8': 'The abacus provides two valid configurations to express the value <b>0</b>:',
            'tutorial-li9': '<strong class="text-teal-300">Neutral State:</strong> Neither bead touches the central beam.',
            'tutorial-li10': '<strong class="text-teal-300">Balanced State:</strong> Both beads touch the central beam together, visually proving that \\(1 + (-1) = 0\\).',
            'tutorial-h3-2': 'Reading the Total Value',
            'tutorial-p4': 'The total abacus value is the sum of every rod. The application computes the decimal value immediately and displays the expanded mathematical formula to reinforce your understanding.',

            'footer-sum-title': 'How to add using the abacus',
            'footer-sum-p1': 'Perform addition with mechanical clarity by entering your first number and applying the second term rod by rod, starting from the right.',
            'footer-sum-li1': '<strong class="text-teal-300">1. Set the first term:</strong> Move the beads to form your initial number. The decimal total updates instantly on screen.',
            'footer-sum-li2': '<strong class="text-teal-300">2. Add the second term:</strong> Begin at the rightmost rod (\\(3^0\\)). Activate the top bead (\\(+1\\)) to add or the bottom bead (\\(-1\\)) to subtract units.',
            'footer-sum-li3': '<strong class="text-teal-300">3. Apply ternary carries:</strong> Whenever a rod reaches \\(+2\\), register \\(-1\\) on the current rod and carry \\(+1\\) to the rod to the left (\\(+2 = -1 + 1\\cdot 3\\)). For \\(-2\\), register \\(+1\\) and pass \\(-1\\) to the left (\\(-2 = 1 - 1\\cdot 3\\)).',
            'footer-sum-note': 'Practical tip: Two beads touching the beam on the same rod cancel each other out to make \\(0\\). Follow this real-time reduction directly in the mathematical notation display.',

            'footer-sum-table-title': 'Addition combinations table',
            'footer-sum-col1': 'Target (+n)',
            'footer-sum-col2': 'Combination in powers of 3',

            'footer-sub-title': 'How to subtract using the abacus',
            'footer-sub-p1': 'Subtracting in balanced ternary means adding the arithmetic inverse of the subtrahend. Each \\(+1\\) digit becomes \\(-1\\) and each \\(-1\\) becomes \\(+1\\).',
            'footer-sub-li1': '<strong class="text-teal-300">1. Set the minuend:</strong> Position your starting value on the abacus.',
            'footer-sub-li2': '<strong class="text-teal-300">2. Apply sign inversion:</strong> Flip the signs of your second number\'s digits and enter them rod by rod.',
            'footer-sub-li3': '<strong class="text-teal-300">3. Complete carries:</strong> Resolve local surpluses by converting \\(-2\\) into \\(+1\\) on the current rod while carrying \\(-1\\) to the left.',
            'footer-sub-note': 'Speed tip: The Invert Signs (+/-) button flips every active digit with a single click, making multi-step subtractions fast and effortless.',

            'footer-sub-table-title': 'Subtraction combinations table',
            'footer-sub-col1': 'Target (-n)',
            'footer-sub-col2': 'Combination in powers of 3',

            /* Soroban-inspired tips */
            'soroban-toggle': '💡 Soroban Ergonomic Principles',
            'soroban-title': 'Tips inspired by the Soroban (Japanese abacus)',
            'soroban-p1': 'Centuries of Soroban engineering provide proven ergonomic methods that increase calculating speed and precision on your balanced ternary abacus.',
            'soroban-li1': '<strong class="text-teal-300">Ternary Grouping:</strong> Rods organized in groups of 3 speed up recognition of magnitude orders.',
            'soroban-li2': '<strong class="text-teal-300">Heaven and Earth Decks:</strong> Subtle visual contrast between upper and lower decks anchors your eyes and speeds up sign checks.',
            'soroban-li3': '<strong class="text-teal-300">Reset Sweep:</strong> The Reset Beads button mirrors the traditional Soroban sweeping gesture, clearing the instrument for your next problem.',
            'soroban-li4': '<strong class="text-teal-300">Natural Flow:</strong> Always begin calculating from the unit rod \\(3^0\\) on the right to preserve a steady mental cadence.',
            'soroban-li5': '<strong class="text-teal-300">Continuous Harmonization:</strong> Whenever a rod encounters \\(+2\\) or \\(-2\\), execute the positional carry promptly to sustain calculating momentum.',
            'clear-button': 'Reset Beads',
            'invert-button': 'Invert Signs (+/-)',
            'decimal-input-label': 'Enter a decimal value (-1093 to 1093):',
            'apply-decimal-button': 'Plot on Abacus'
        }
    };

    // Language routing helpers: map URL segments to internal language keys and update document/URL
    const KNOWN_LANG_SEGMENTS = new Set(['en', 'en-us', 'pt', 'pt-br']);
    const normalizeLangSeg = (seg) => (seg || '').toLowerCase();
    const segToLang = (seg) => {
        const s = normalizeLangSeg(seg);
        if (s === 'en' || s === 'en-us') return 'en';
        if (s === 'pt' || s === 'pt-br') return 'pt';
        return null;
    };
    const langToSeg = (lang) => lang === 'en' ? 'en-us' : 'pt-br';

    // Read language from multiple URL shapes: ?lang=, #hash, or path segment (last resort)
    const findLangFromUrl = () => {
        try {
            // 1) Query string
            const params = new URLSearchParams(location.search || '');
            const qLang = segToLang(params.get('lang'));
            if (qLang) return qLang;
            // 2) Hash fragment (supports #en-us or #/en-us)
            const hash = (location.hash || '').replace(/^#\/?/, '');
            const hLang = segToLang(hash);
            if (hLang) return hLang;
            // 3) Path segments (best-effort, may 404 on static hosting if used for writing)
            const parts = (location.pathname || '/').split('/').filter(Boolean);
            for (let i = parts.length - 1; i >= 0; i--) {
                const seg = normalizeLangSeg(parts[i]);
                if (KNOWN_LANG_SEGMENTS.has(seg)) {
                    return segToLang(seg);
                }
            }
        } catch (_) { /* ignore */ }
        return null;
    };

    const applyDocumentLangMeta = () => {
        const htmlLang = currentLang === 'en' ? 'en-us' : 'pt-br';
        const ogLocale = currentLang === 'en' ? 'en_US' : 'pt_BR';
        document.documentElement.lang = htmlLang;
        const ogMeta = document.querySelector('meta[property="og:locale"]');
        if (ogMeta) ogMeta.setAttribute('content', ogLocale);
    };

    // Update URL in a static-host friendly way: prefer query param (?lang=...), fallback to hash
    const updateUrlForLang = (lang, usePush = false) => {
        try {
            const url = new URL(location.href);
            url.searchParams.set('lang', langToSeg(lang));
            const fn = usePush ? history.pushState.bind(history) : history.replaceState.bind(history);
            fn(null, '', url.toString());
        } catch (e) {
            try {
                // Fallback: hash only
                const suffix = langToSeg(lang);
                const newHash = '#' + suffix;
                if (usePush) {
                    history.pushState && history.pushState(null, '', newHash);
                } else {
                    location.hash = newHash;
                }
            } catch (_) { /* ignore */ }
        }
    };

    let currentLang = findLangFromUrl() || 'pt';

    const updateLanguage = async () => {
        // Reflect language in <html lang> and social meta
        applyDocumentLangMeta();
        // Ensure button label reflects active language
        if (translationBtn) translationBtn.textContent = currentLang.toUpperCase();

        const lang = translations[currentLang];
        document.title = lang['main-title'];
        document.getElementById('main-title').textContent = lang['main-title'];
        document.getElementById('description').textContent = lang['description'];
        document.getElementById('total-title').textContent = lang['total-title'];
        document.getElementById('tutorial-toggle').textContent = lang['tutorial-toggle'];
        document.getElementById('sum-toggle').textContent = lang['sum-toggle'];
        document.getElementById('sub-toggle').textContent = lang['sub-toggle'];
        document.getElementById('soroban-toggle').textContent = lang['soroban-toggle'];
        document.getElementById('tutorial-title').textContent = lang['tutorial-title'];
        document.getElementById('tutorial-p1').innerHTML = lang['tutorial-p1'];
        document.getElementById('tutorial-p2').innerHTML = lang['tutorial-p2'];
        document.getElementById('tutorial-li1').innerHTML = lang['tutorial-li1'];
        document.getElementById('tutorial-li2').innerHTML = lang['tutorial-li2'];
        document.getElementById('tutorial-li3').innerHTML = lang['tutorial-li3'];
        document.getElementById('tutorial-li4').textContent = lang['tutorial-li4'];
        document.getElementById('tutorial-h3-1').textContent = lang['tutorial-h3-1'];
        document.getElementById('tutorial-p3').innerHTML = lang['tutorial-p3'];
        document.getElementById('tutorial-li5').innerHTML = lang['tutorial-li5'];
        document.getElementById('tutorial-li6').innerHTML = lang['tutorial-li6'];
        document.getElementById('tutorial-li7').innerHTML = lang['tutorial-li7'];
        document.getElementById('tutorial-li8').innerHTML = lang['tutorial-li8'];
        document.getElementById('tutorial-li9').innerHTML = lang['tutorial-li9'];
        document.getElementById('tutorial-li10').innerHTML = lang['tutorial-li10'];
        document.getElementById('tutorial-h3-2').textContent = lang['tutorial-h3-2'];
        document.getElementById('tutorial-p4').innerHTML = lang['tutorial-p4'];

        // Footer: How to add section
        document.getElementById('footer-sum-title').textContent = lang['footer-sum-title'];
        document.getElementById('footer-sum-p1').innerHTML = lang['footer-sum-p1'];
        document.getElementById('footer-sum-li1').innerHTML = lang['footer-sum-li1'];
        document.getElementById('footer-sum-li2').innerHTML = lang['footer-sum-li2'];
        document.getElementById('footer-sum-li3').innerHTML = lang['footer-sum-li3'];
        document.getElementById('footer-sum-note').innerHTML = lang['footer-sum-note'];

        // Sum combinations table headers
        document.getElementById('footer-sum-table-title').textContent = lang['footer-sum-table-title'];
        document.getElementById('footer-sum-col1').textContent = lang['footer-sum-col1'];
        document.getElementById('footer-sum-col2').textContent = lang['footer-sum-col2'];

        // Footer: How to subtract section
        document.getElementById('footer-sub-title').textContent = lang['footer-sub-title'];
        document.getElementById('footer-sub-p1').innerHTML = lang['footer-sub-p1'];
        document.getElementById('footer-sub-li1').innerHTML = lang['footer-sub-li1'];
        document.getElementById('footer-sub-li2').innerHTML = lang['footer-sub-li2'];
        document.getElementById('footer-sub-li3').innerHTML = lang['footer-sub-li3'];
        document.getElementById('footer-sub-note').innerHTML = lang['footer-sub-note'];
        // Subtraction combinations table headers
        document.getElementById('footer-sub-table-title').textContent = lang['footer-sub-table-title'];
        document.getElementById('footer-sub-col1').textContent = lang['footer-sub-col1'];
        document.getElementById('footer-sub-col2').textContent = lang['footer-sub-col2'];

        // Soroban tips section
        document.getElementById('soroban-title').textContent = lang['soroban-title'];
        document.getElementById('soroban-p1').innerHTML = lang['soroban-p1'];
        document.getElementById('soroban-li1').innerHTML = lang['soroban-li1'];
        document.getElementById('soroban-li2').innerHTML = lang['soroban-li2'];
        document.getElementById('soroban-li3').innerHTML = lang['soroban-li3'];
        document.getElementById('soroban-li4').innerHTML = lang['soroban-li4'];
        document.getElementById('soroban-li5').innerHTML = lang['soroban-li5'];

        // Clear/invert buttons label
        document.getElementById('clear-button').textContent = lang['clear-button'];
        const invertBtnEl = document.getElementById('invert-button');
        if (invertBtnEl) invertBtnEl.textContent = lang['invert-button'];

        if (decimalInputLabel && lang['decimal-input-label']) {
            decimalInputLabel.textContent = lang['decimal-input-label'];
        }
        if (applyDecimalBtn && lang['apply-decimal-button']) {
            applyDecimalBtn.textContent = lang['apply-decimal-button'];
        }

        // Typeset only visible sections and the math notation line if present
        const toTypeset = [];
        const tutorialVisible = !document.getElementById('tutorial-content').classList.contains('hidden');
        const sumVisible = !document.getElementById('sum-content').classList.contains('hidden');
        const subVisible = !document.getElementById('sub-content').classList.contains('hidden');
        const sorobanVisible = !document.getElementById('soroban-content').classList.contains('hidden');
        if (tutorialVisible) toTypeset.push(document.getElementById('tutorial-content'));
        if (sumVisible) toTypeset.push(document.getElementById('sum-content'));
        if (subVisible) toTypeset.push(document.getElementById('sub-content'));
        if (sorobanVisible) toTypeset.push(document.getElementById('soroban-content'));
        const notationText = document.getElementById('math-notation').textContent || '';
        if (notationText.includes('\\(')) toTypeset.push(document.getElementById('math-notation'));
        if (toTypeset.length) await typesetElements(toTypeset);
    };

    translationBtn.addEventListener('click', () => {
        currentLang = currentLang === 'pt' ? 'en' : 'pt';
        updateLanguage();
        // Update the URL to reflect the selected language
        updateUrlForLang(currentLang, true);
    });

    // Wire foldable sections with a small helper (behavior unchanged)
    wireToggle(tutorialToggleBtn, tutorialContentDiv);
    wireToggle(sumToggleBtn, sumContentDiv);
    wireToggle(subToggleBtn, subContentDiv);
    wireToggle(sorobanToggleBtn, sorobanContentDiv);

    clearButton.addEventListener('click', () => {
        rodValues.fill(0);
        createAbacus();
    });

    // Invert the abacus: flip signs (+1 <-> -1) per rod while preserving both-active and both-inactive as 0
    const invertAbacus = () => {
        for (let i = 0; i < numRods; i++) {
            const rodEl = abacusRodsContainer.querySelector(`.rod[data-index="${i}"]`);
            if (!rodEl) continue;
            const topBead = rodEl.querySelector('.bead.top');
            const bottomBead = rodEl.querySelector('.bead.bottom');
            if (!topBead || !bottomBead) continue;

            const topActive = topBead.classList.contains('active');
            const bottomActive = bottomBead.classList.contains('active');

            // If exactly one side is active, swap; if both or none, keep as-is (still represents 0)
            if (topActive && !bottomActive) {
                topBead.classList.remove('active');
                bottomBead.classList.add('active');
            } else if (!topActive && bottomActive) {
                bottomBead.classList.remove('active');
                topBead.classList.add('active');
            }
            // Re-apply state to update colors and rodValues[i]
            applyRodState(i, topBead, bottomBead);
        }
        updateDisplay();
    };

    if (invertButton) {
        invertButton.addEventListener('click', invertAbacus);
    }

    const updateDisplay = () => {
        let total = 0;
        const terms = [];
        for (let i = 0; i < numRods; i++) {
            const value = rodValues[i];
            total += value * POW3[i];
            if (value !== 0) {
                const signStr = value === -1 ? '(-1)' : '1';
                terms.unshift(`${signStr} &middot; 3<sup>${i}</sup>`);
            }
        }

        totalValueDisplay.textContent = total;
        mathNotationDisplay.innerHTML = terms.length ? terms.join(' + ') : '';
    };

    // Expose a global setter so the new <select id="lang-select"> can drive page translations too
    window.setPageLanguage = function(lang, opts) {
        try {
            const safe = (lang === 'en' || lang === 'pt') ? lang : 'en';
            if (currentLang !== safe) {
                currentLang = safe;
                updateLanguage();
            } else {
                updateLanguage();
            }
            if (!opts || !opts.suppressUrl) {
                updateUrlForLang(currentLang, false);
            }
        } catch (_) { /* no-op */ }
    };

    const setAbacusFromDecimal = (decimalVal) => {
        let trits;
        if (typeof window !== 'undefined' && window.TernaryMath && typeof window.TernaryMath.decimalToBalanced === 'function') {
            trits = window.TernaryMath.decimalToBalanced(decimalVal, numRods);
        } else {
            trits = new Array(numRods).fill(0);
            let n = Math.trunc(Number(decimalVal) || 0);
            let idx = 0;
            while (n !== 0 && idx < numRods) {
                let rem = ((n % 3) + 3) % 3;
                if (rem === 0) {
                    trits[idx] = 0;
                    n = Math.trunc(n / 3);
                } else if (rem === 1) {
                    trits[idx] = 1;
                    n = Math.trunc((n - 1) / 3);
                } else if (rem === 2) {
                    trits[idx] = -1;
                    n = Math.trunc((n + 1) / 3);
                }
                idx++;
            }
        }

        for (let i = 0; i < numRods; i++) {
            const rodEl = abacusRodsContainer.querySelector(`.rod[data-index="${i}"]`);
            if (!rodEl) continue;
            const topBead = rodEl.querySelector('.bead.top');
            const bottomBead = rodEl.querySelector('.bead.bottom');
            if (!topBead || !bottomBead) continue;

            const trit = trits[i] || 0;
            if (trit === 1) {
                topBead.classList.add('active');
                bottomBead.classList.remove('active');
            } else if (trit === -1) {
                bottomBead.classList.add('active');
                topBead.classList.remove('active');
            } else {
                topBead.classList.remove('active');
                bottomBead.classList.remove('active');
            }
            applyRodState(i, topBead, bottomBead);
        }
        updateDisplay();
    };

    if (decimalForm && decimalInput) {
        decimalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = parseInt(decimalInput.value, 10);
            if (Number.isNaN(val)) return;
            const clamped = Math.max(-1093, Math.min(1093, val));
            decimalInput.value = clamped;
            setAbacusFromDecimal(clamped);
        });
    }

    const createAbacus = () => {
        abacusRodsContainer.innerHTML = '';
        for (let i = 0; i < numRods; i++) {
            const rod = document.createElement('div');
            rod.classList.add('rod');
            rod.setAttribute('data-index', i);

            const rodLine = document.createElement('div');
            rodLine.classList.add('rod-line');
            rod.appendChild(rodLine);

            const topBead = document.createElement('div');
            topBead.classList.add('bead', 'top');
            topBead.setAttribute('role', 'button');
            topBead.setAttribute('tabindex', '0');
            topBead.style.borderTopColor = COLOR_DEFAULT;
            updateBeadAria(topBead, i, 1, false);

            const handleTopAction = () => {
                topBead.classList.toggle('active');
                applyRodState(i, topBead, bottomBead);
                updateDisplay();
            };
            topBead.addEventListener('click', handleTopAction);
            topBead.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTopAction();
                }
            });

            const bottomBead = document.createElement('div');
            bottomBead.classList.add('bead', 'bottom');
            bottomBead.setAttribute('role', 'button');
            bottomBead.setAttribute('tabindex', '0');
            bottomBead.style.borderBottomColor = COLOR_DEFAULT;
            updateBeadAria(bottomBead, i, -1, false);

            const handleBottomAction = () => {
                bottomBead.classList.toggle('active');
                applyRodState(i, topBead, bottomBead);
                updateDisplay();
            };
            bottomBead.addEventListener('click', handleBottomAction);
            bottomBead.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBottomAction();
                }
            });

            const topLabel = document.createElement('div');
            topLabel.classList.add('power-label-top');
            topLabel.textContent = String(Math.pow(3, i));

            const powerLabel = document.createElement('div');
            powerLabel.classList.add('power-label');
            powerLabel.innerHTML = `3<sup>${i}</sup>`;

            rod.appendChild(topBead);
            rod.appendChild(bottomBead);
            rod.appendChild(topLabel);
            rod.appendChild(powerLabel);
            abacusRodsContainer.prepend(rod);
        }
        updateDisplay();
    };

    updateLanguage();
    createAbacus();
});