document.addEventListener('DOMContentLoaded', () => {
  const ruler = document.getElementById('ruler');
  const displayVal = document.getElementById('displayVal');
  const sensorNameDisplay = document.getElementById('sensorNameDisplay');
  const lensValueDisplay = document.getElementById('lensValueDisplay');
  const sensorBtns = document.querySelectorAll('.sensor-btn');
  const presetContainer = document.getElementById('presetContainer');
  
  // 設定：最小値を5mm (MFT等の超広角計算用)
  const minFocal = 5;
  const maxFocal = 200;
  const stepWidth = 8;
  let currentSensorCrop = 1.5;
  let lastDisplayedVal = -1;

  // 定番画角リスト (8mmは削除し、10mmスタートに変更)
  const classicFocals = [10, 12, 14, 16, 20, 24, 28, 35, 40, 50, 70, 75, 85, 105, 135];
  const presetChips = [];

  // 0. プリセットボタン生成
  classicFocals.forEach(mm => {
    const chip = document.createElement('div');
    chip.className = 'preset-chip';
    chip.innerText = mm;
    chip.dataset.mm = mm;
    
    chip.addEventListener('click', () => {
      let targetPhysicalMm = Math.round(mm / currentSensorCrop);
      // 計算結果がダイヤル範囲外なら無視
      if (targetPhysicalMm < minFocal || targetPhysicalMm > maxFocal) return; 

      const targetScrollLeft = (targetPhysicalMm - minFocal) * stepWidth;
      ruler.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
    });

    presetContainer.appendChild(chip);
    presetChips.push(chip);
  });

  // 1. 目盛り生成
  for (let i = minFocal; i <= maxFocal; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'tick-wrapper';
    
    const tick = document.createElement('div');
    if (i % 10 === 0) {
      tick.className = 'tick major';
      const label = document.createElement('span');
      label.className = 'tick-label';
      label.innerText = i;
      wrapper.appendChild(label);
    } else if (i % 5 === 0) {
      tick.className = 'tick medium';
    } else {
      tick.className = 'tick minor';
    }
    
    wrapper.appendChild(tick);
    ruler.appendChild(wrapper);
  }

  function getSensorName(cropVal) {
    if(cropVal === 0.79) return "Large";
    if(cropVal === 1.0) return "Full Frame";
    if(cropVal === 1.5) return "APS-C";
    if(cropVal === 2.0) return "MFT";
    return "";
  }

  // 2. 表示更新関数
  function updateDisplay(physicalMm, animate = false) {
    let equivalentMm = Math.round(physicalMm * currentSensorCrop);

    // マグネット補正
    const closestClassic = classicFocals.find(c => Math.abs(c - equivalentMm) <= 1);
    let displayMm = equivalentMm;
    if (closestClassic) {
      displayMm = closestClassic;
    }

    // 表示更新
    if (displayMm !== lastDisplayedVal || animate) {
      lastDisplayedVal = displayMm;
      const strEquiv = String(displayMm);
      if (animate) {
        let animatedHtml = "";
        for (let i = 0; i < strEquiv.length; i++) {
          const delay = i * 0.05;
          animatedHtml += `<span class="char-anim" style="animation-delay: ${delay}s">${strEquiv[i]}</span>`;
        }
        displayVal.innerHTML = `${animatedHtml}<span class="unit-small">mm</span>`;
      } else {
        displayVal.innerHTML = `${strEquiv}<span class="unit-small">mm</span>`;
      }
    }

    sensorNameDisplay.innerText = getSensorName(currentSensorCrop);
    lensValueDisplay.innerText = `${physicalMm}mm`;

    // チップのハイライト
    presetChips.forEach(chip => {
      const chipMm = parseInt(chip.dataset.mm);
      if (chipMm === displayMm) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  // 3. スクロール監視
  ruler.addEventListener('scroll', () => {
    const scrollLeft = ruler.scrollLeft;
    let currentMm = Math.round(scrollLeft / stepWidth) + minFocal;
    if (currentMm < minFocal) currentMm = minFocal;
    if (currentMm > maxFocal) currentMm = maxFocal;

    updateDisplay(currentMm, false);
  });

  // 4. センサー切り替え
  sensorBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      sensorBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentSensorCrop = parseFloat(e.target.dataset.crop);
      
      const scrollLeft = ruler.scrollLeft;
      let currentMm = Math.round(scrollLeft / stepWidth) + minFocal;
      lastDisplayedVal = -1; 
      updateDisplay(currentMm, true);
    });
  });

  // 初期位置
  const initialMm = 50; 
  setTimeout(() => {
    ruler.scrollLeft = (initialMm - minFocal) * stepWidth;
    updateDisplay(initialMm, true);
  }, 100);
});