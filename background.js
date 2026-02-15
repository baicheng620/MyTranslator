// 监听来自 Content Script 的翻译请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchTranslation") {
    handleTranslation(request.text, request.sourceLang, request.targetLang)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持异步通道开启
  }
});

// 翻译总调度
async function handleTranslation(text, source, target) {
  // 如果是中文译中，直接返回
  if (source === target && source !== 'auto') return text;

  // 策略1: 优先尝试 Google (速度快，质量高)
  try {
    console.log("尝试 Google API...");
    const result = await translateGoogle(text, source, target);
    console.log("Google 成功");
    return result;
  } catch (e) {
    console.log("Google 失败，切换备选...");
  }

  // 策略2: 备选 MyMemory (稳定，无需Key)
  try {
    console.log("尝试 MyMemory API...");
    const result = await translateMyMemory(text, source, target);
    console.log("MyMemory 成功");
    return result;
  } catch (e) {
    console.log("MyMemory 也失败了");
    throw new Error("所有翻译通道均不可用");
  }
}

// --- API 实现层 ---

// 1. Google Translate (非官方)
async function translateGoogle(text, source, target) {
  let url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${source}&tl=${target}&q=${encodeURIComponent(text)}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("Google API Error");
  
  const data = await response.json();
  // Google 返回的是数组嵌套，需要拼接
  if (data && data[0]) {
    return data[0].map(item => item[0]).join('');
  }
  return text;
}

// 2. MyMemory (备选)
async function translateMyMemory(text, source, target) {
  // MyMemory 的语言代码中文是 zh-CN, Google 有时用 zh，做个兼容
  if (source === 'auto') source = 'auto';
  
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("MyMemory API Error");
  
  const data = await response.json();
  if (data.responseStatus === 200) {
    return data.responseData.translatedText;
  }
  throw new Error("MyMemory Limit Reached");
}