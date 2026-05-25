document.addEventListener('DOMContentLoaded', async () => {
  const setupView = document.getElementById('setup-view');
  const mainView = document.getElementById('main-view');
  const apiKeyInput = document.getElementById('api-key');
  const apiUrlInput = document.getElementById('api-url');
  const saveBtn = document.getElementById('save-btn');
  
  const currentUrlEl = document.getElementById('current-url');
  const scanBtn = document.getElementById('scan-tab-btn');
  const resultBox = document.getElementById('result-box');
  const resultBadge = document.getElementById('result-badge');
  const resultScore = document.getElementById('result-score');
  const resultDetails = document.getElementById('result-details');
  const resetBtn = document.getElementById('reset-btn');

  let currentTabUrl = '';

  // Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      currentTabUrl = tabs[0].url;
      currentUrlEl.textContent = currentTabUrl;
    }
  });

  // Load state
  const data = await chrome.storage.sync.get(['apiKey', 'apiUrl']);
  if (data.apiKey) {
    showMain();
  } else {
    showSetup();
  }

  saveBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    const url = apiUrlInput.value.trim();
    if (key) {
      await chrome.storage.sync.set({ apiKey: key, apiUrl: url });
      showMain();
    }
  });

  resetBtn.addEventListener('click', async () => {
    await chrome.storage.sync.remove(['apiKey']);
    showSetup();
  });

  scanBtn.addEventListener('click', async () => {
    if (!currentTabUrl || currentTabUrl.startsWith('chrome://')) {
      alert("Cannot scan this type of page.");
      return;
    }

    scanBtn.disabled = true;
    scanBtn.textContent = "Scanning...";
    resultBox.classList.add('hidden');

    const config = await chrome.storage.sync.get(['apiKey', 'apiUrl']);
    const endpoint = `${config.apiUrl}/scan/url`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey
        },
        body: JSON.stringify({ url: currentTabUrl })
      });

      const result = await response.json();
      
      if (result.success) {
        const scan = result.data.scan;
        const level = scan.result?.riskLevel || 'safe';
        
        resultBadge.textContent = level.toUpperCase();
        resultBadge.className = `badge ${level}`;
        resultScore.textContent = `Score: ${scan.result?.riskScore || 0}/100`;
        resultDetails.textContent = scan.result?.aiExplanation || 'Analyzed via ML Models';
        
        resultBox.classList.remove('hidden');
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert("Error scanning page: " + err.message);
    } finally {
      scanBtn.disabled = false;
      scanBtn.textContent = "Scan Current Page";
    }
  });

  function showSetup() {
    setupView.classList.remove('hidden');
    mainView.classList.add('hidden');
  }

  function showMain() {
    setupView.classList.add('hidden');
    mainView.classList.remove('hidden');
  }
});
