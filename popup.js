document.getElementById('translateBtn').addEventListener('click', async () => {
    const sourceLang = document.getElementById('sourceLang').value;
    const targetLang = document.getElementById('targetLang').value;
    const statusDiv = document.getElementById('status');
    
    statusDiv.textContent = "任务下发中...";
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, {
        action: "translatePage",
        sourceLang: sourceLang,
        targetLang: targetLang
    }, (response) => {
        if (chrome.runtime.lastError) {
            statusDiv.textContent = "错误：请刷新页面重试";
        } else {
            statusDiv.textContent = "翻译进行中...";
        }
    });
});

document.getElementById('restoreBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: "restorePage" });
    document.getElementById('status').textContent = "已恢复";
});