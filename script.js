// script.js (corrigido: reimplementa temas + mantém play/pause e foto)
(() => {
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  // páginas
  const pageLanding = qs('#page-landing');
  const pageForm = qs('#page-form');
  const pageResult = qs('#page-result');

  // controles principais
  const startBtn = qs('#startBtn');
  const backToLanding = qs('#backToLanding');
  const birthdayForm = qs('#birthdayForm');

  // mini preview
  const miniName = qs('#miniName');
  const miniPhrase = qs('#miniPhrase');
  const miniEmoji = qs('#miniEmoji');
  const miniPhotoImg = qs('#miniPhotoImg');

  // resultado
  const resultTitle = qs('#resultTitle'); // "Feliz Aniversário!" (sempre acima)
  const resultName = qs('#resultName');   // nome da pessoa (abaixo)
  const resultAge = qs('#resultAge');
  const resultPhrase = qs('#resultPhrase');
  const resultLetter = qs('#resultLetter');
  const resultPhoto = qs('#resultPhoto');
  const resultPhotoWrapper = qs('#resultPhotoWrapper');
  const celebrationCard = qs('#celebration-card');

  // ações externas (fora do card)
  const shareWhats = qs('#shareWhats');
  const copyLinkBtn = qs('#copyLink');
  const downloadPNGBtn = qs('#downloadPNG');
  const backToForm = qs('#backToForm');

  // temas container
  const themesContainer = qs('#themes');

  // temas (restaurados: 7)
  const THEMES = {
    disco:  { name: 'Retro Disco', bg: 'linear-gradient(120deg,#7C3AED,#FF007F,#FFD700)', textDark: false },
    neon:   { name: 'Neon Night', bg: 'linear-gradient(120deg,#0F172A,#00F5FF,#A78BFA)', textDark: false },
    tropical:{ name: 'Tropical Vibes', bg: 'linear-gradient(120deg,#FF8A00,#00C853,#FFD600)', textDark: true },
    ocean:  { name: 'Ocean Breeze', bg: 'linear-gradient(120deg,#BEE3F8,#2DD4BF,#FFFFFF)', textDark: true },
    candy:  { name: 'Candy Party', bg: 'linear-gradient(135deg,#ff9a9e,#fecfef,#fe99ff)', textDark: true },
    redblack:{ name: 'Red & Black', bg: 'linear-gradient(135deg, #000000ff, #d42222ff, #ec0000ff,#1c1c1c)', textDark: false },
    pro:    { name: 'Profissional', bg: 'linear-gradient(135deg,#1c92d2,#2DD4BF,#f2fcfe)', textDark: true },
    kids: { name: 'Infantil', bg: 'linear-gradient(135deg,#ffdde1,#ee9ca7,#a1c4fd,#c2e9fb)', textDark: true}
  };

  const themeKeys = Object.keys(THEMES);

  // cria botões de tema dinamicamente (mantém seleção)
  (function injectThemes(){
    themeKeys.forEach((key, idx) => {
      const t = THEMES[key];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'flex flex-col items-center justify-center p-3 border rounded-lg text-sm bg-white/60 min-w-0 w-full sm:w-auto text-center';
      btn.dataset.key = key;
      // pega até 3 cores do gradiente ou gera fallback
let swatches = t.bg.match(/#[0-9A-Fa-f]{3,6}/g) || [];
if(swatches.length < 3){
  while(swatches.length < 3){
    swatches.push(swatches[swatches.length-1] || '#ccc');
  }
}
const swHtml = swatches.slice(0,3).map(c => `<span class="w-4 h-4 rounded-full" style="background:${c}"></span>`).join('');

      btn.innerHTML = `
        <div class="flex gap-1 justify-center mb-2">
          ${swHtml}
        </div>
        <span class="text-xs font-medium">${t.name}</span>
      `;
      btn.onclick = () => {
        qsa('#themes button').forEach(b => {
          b.classList.remove('ring-4','ring-indigo-300','bg-indigo-100');
          delete b.dataset.selected;
        });
        btn.classList.add('ring-4','ring-indigo-300','bg-indigo-100');
        btn.dataset.selected = '1';
      };
      themesContainer.appendChild(btn);

      // marcar primeiro tema como selecionado por padrão
      if(idx === 0){
        btn.click();
      }
    });
  })();

  

  // áudio
  let audio;
  function initAudio(){
    try {
      audio = new Audio('./music.mp3');
      audio.loop = true;
      audio.volume = 0.5;
    } catch(e){ console.warn('audio init failed', e); }
  }
  initAudio();

  // toggle música (botão no formulário)
  const toggleMusicBtn = qs('#toggleMusic');
  if(toggleMusicBtn){
    toggleMusicBtn.addEventListener('click', () => {
      if(!audio) return;
      if(audio.paused){
        audio.play();
        toggleMusicBtn.textContent = "🔊 Pausar Música";
      } else {
        audio.pause();
        toggleMusicBtn.textContent = "▶️ Tocar Música";
      }
    });
  }

  // start (abre form + tenta tocar)
  startBtn.addEventListener('click', () => {
    showPage('form');
    if(audio) audio.play().catch(()=>{});
  });

  backToLanding.addEventListener('click', () => showPage('landing'));

  // mini preview updates
  const updateMini = () => {
    const name = qs('#name').value || 'Nome';
    const phrase = qs('#phrase').value || 'Frase destaque aparecerá aqui.';
    miniName.textContent = `Feliz Aniversário, ${name}!`;
    miniPhrase.textContent = phrase;
    miniEmoji.textContent = qs('#emoji').value || '🎂';
  };
  qsa('#name,#phrase,#emoji').forEach(inp => inp.addEventListener('input', updateMini));

  // mini photo preview
  const photoInput = qs('#photo');
  if(photoInput){
    photoInput.addEventListener('change', (e) => {
      const f = e.target.files[0];
      if(!f) return;
      const url = URL.createObjectURL(f);
      miniPhotoImg.src = url;
      miniPhotoImg.classList.remove('hidden');
      qs('#miniPhoto').classList.remove('bg-gray-200');
    });
  }

  // form submit: processa imagem se houver e envia payload com themeKey
  birthdayForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = qs('#name').value.trim();
    const dob = qs('#dob').value;
    const age = qs('#age').value;
    const phrase = qs('#phrase').value.trim();
    const letter = qs('#letter').value.trim();
    const emoji = qs('#emoji').value.trim();

    if(!name) return alert('Nome é obrigatório');
    if(!dob && !age) return alert('Preencha a data de nascimento ou a idade');

    // qual tema foi selecionado?
    const selectedBtn = qsa('#themes button').find(b => b.dataset.selected === '1');
    const themeKey = selectedBtn ? selectedBtn.dataset.key : themeKeys[0];

    // se houver arquivo, ler como dataURL; senão, prosseguir
    const file = photoInput && photoInput.files && photoInput.files[0] ? photoInput.files[0] : null;
    if(file){
      const reader = new FileReader();
      reader.onload = function(evt){
        const photoData = evt.target.result;
        finalizePayload({ name, dob, age, phrase, letter, emoji, photoData, themeKey });
      };
      reader.readAsDataURL(file);
    } else {
      finalizePayload({ name, dob, age, phrase, letter, emoji, photoData: null, themeKey });
    }
  });

  function finalizePayload(payload){
    // calcula idade se só houver dob
    if(!payload.age && payload.dob){
      const birth = new Date(payload.dob);
      const today = new Date();
      let years = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years--;
      payload.age = years;
    }

    // render e mostrar resultado
    renderResultFromPayload(payload);
    showPage('result');
    try { confetti({ particleCount: 120, spread: 70, origin: { y: 0.3 } }); } catch(e){}
  }

  // render: aplica tema e foto (esconde moldura se não houver)
  function renderResultFromPayload(p){
    // título fixo acima da foto
    resultTitle.textContent = "Feliz Aniversário!";
    resultName.textContent = (p.name || '') + (p.emoji ? ' ' + p.emoji : '');
    resultAge.textContent = p.age ? `${p.age} anos` : '';
    resultPhrase.textContent = p.phrase || '';
    resultLetter.textContent = p.letter || '';

    // foto
    if(p.photoData){
      resultPhoto.src = p.photoData;
      resultPhoto.classList.remove('hidden');
      resultPhotoWrapper.classList.remove('hidden');
    } else {
      // remove a moldura (oculta o wrapper)
      resultPhotoWrapper.classList.add('hidden');
      resultPhoto.classList.add('hidden');
      resultPhoto.src = '';
    }

    // aplica tema visual no cartão (fora do card também se quiser)
    const themeKey = p.themeKey || themeKeys[0];
    const theme = THEMES[themeKey] || THEMES[themeKeys[0]];
    if(celebrationCard){
      celebrationCard.style.background = theme.bg;
      // ajustar cor do texto para contraste
      const darkText = theme.textDark ? 'text-gray-900' : 'text-white';
      // limpando classes que controlam texto (apenas aplicar via style para garantir)
      celebrationCard.style.color = theme.textDark ? '#111' : '#fff';
    }
  }

  // ações de compartilhamento e salvar
  function currentResultUrl(){
    return location.href;
  }

if(shareWhats){
  shareWhats.addEventListener('click', async () => {
    const el = celebrationCard || qs('#celebration-card');
    if(!el) return;

    // gera canvas do card
    const canvas = await html2canvas(el, { scale: 2 });
    const dataUrl = canvas.toDataURL("image/png");

    // converte para Blob (necessário pro Web Share API)
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "parabens.png", { type: "image/png" });

    const text = `🎉 Olha esse parabéns especial que criei!`;

    // tenta usar Web Share API (mobile / navegadores compatíveis)
    if(navigator.canShare && navigator.canShare({ files: [file] })){
      try {
        await navigator.share({
          text,
          files: [file]
        });
      } catch(err){
        console.log("Compartilhamento cancelado ou não suportado", err);
      }
    } else {
      // fallback: abre WhatsApp com texto + baixa a imagem
      const waText = encodeURIComponent(text + "\n\n" + currentResultUrl());
      window.open(`https://wa.me/?text=${waText}`, "_blank");

      // baixa automaticamente a imagem também
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "parabens.png";
      a.click();

      alert("Baixamos a imagem do parabéns. Agora é só anexar no WhatsApp! 📱");
    }
  });
}


  if(copyLinkBtn){
    copyLinkBtn.addEventListener('click', async () => {
      const url = currentResultUrl();
      try { await navigator.clipboard.writeText(url); alert('Link copiado!'); }
      catch(e){ prompt('Copie este link:', url); }
    });
  }

  if(downloadPNGBtn){
    downloadPNGBtn.addEventListener('click', async () => {
      const el = celebrationCard || qs('#celebration-card');
      if(!el) return;
      const canvas = await html2canvas(el, { scale: 2 });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `parabens.png`;
      a.click();
    });
  }

  // editar volta para o form (mantém dados dentro do formulário)
  if(backToForm){
    backToForm.addEventListener('click', () => showPage('form'));
  }

  function showPage(name){
    pageLanding.classList.toggle('hidden', name !== 'landing');
    pageForm.classList.toggle('hidden', name !== 'form');
    pageResult.classList.toggle('hidden', name !== 'result');
  }

  // inicializa view
  window.addEventListener('load', () => {
    showPage('landing');
  });
})();
