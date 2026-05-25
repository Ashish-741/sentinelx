chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "scanLink",
    title: "Scan link with SentinelX",
    contexts: ["link"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "scanLink" && info.linkUrl) {
    const data = await chrome.storage.sync.get(["apiKey", "apiUrl"]);
    if (!data.apiKey) {
      // Notify user to set API key
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => alert("Please configure your SentinelX API Key in the extension popup first.")
      });
      return;
    }

    let apiUrl = data.apiUrl || "http://localhost:5000/api/scan/url";
    if (apiUrl.endsWith('/api') || apiUrl.endsWith('/api/')) {
      apiUrl = apiUrl.replace(/\/$/, '') + '/scan/url';
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": data.apiKey
        },
        body: JSON.stringify({ url: info.linkUrl })
      });

      const result = await response.json();
      
      if (result.success) {
        const threatScore = result.data.scan.result?.riskScore ?? 0;
        const threatLevel = result.data.scan.result?.riskLevel ?? 'unknown';
        
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (url, level, score) => alert(`SentinelX Scan Result:\nURL: ${url}\nRisk Level: ${level.toUpperCase()}\nRisk Score: ${score}/100`),
          args: [info.linkUrl, threatLevel, threatScore]
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (errMsg) => alert("SentinelX Scan Failed: " + errMsg),
        args: [err.message]
    });
    }
  }
});
