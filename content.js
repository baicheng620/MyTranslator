const originalTextNodes = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translatePage") {
        startTranslation(request.sourceLang, request.targetLang);
        sendResponse({ success: true });
    } else if (request.action === "restorePage") {
        restorePage();
        sendResponse({ success: true });
    }
});

async function startTranslation(sourceLang, targetLang) {
    originalTextNodes.length = 0;
    
    // 获取所有文本节点
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const tasks = [];

    while (node = walker.nextNode()) {
        // 过滤掉无关标签
        if (!node.parentElement || 
            node.nodeValue.trim().length < 2 || 
            ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'CODE'].includes(node.parentElement.tagName)) {
            continue;
        }

        // 保存任务
        tasks.push(processNode(node, sourceLang, targetLang));
    }

    // 并发处理所有节点 (后台会自动排队处理API)
    await Promise.all(tasks);
    alert("✅ 翻译完成！(API自动优选)");
}

async function processNode(node, sourceLang, targetLang) {
    const originalText = node.nodeValue;
    
    // 发送给后台翻译
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            action: "fetchTranslation",
            text: originalText,
            sourceLang: sourceLang,
            targetLang: targetLang
        }, (response) => {
            if (response && response.success && response.data) {
                originalTextNodes.push({ node: node, text: originalText });
                node.nodeValue = response.data; // 替换文字
            }
            resolve();
        });
    });
}

function restorePage() {
    originalTextNodes.forEach(item => {
        item.node.nodeValue = item.text;
    });
    originalTextNodes.length = 0;
}