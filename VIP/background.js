// Background Service Worker
// 自动为所有请求添加 VIP Token

// 导入 crypto utilities
importScripts('crypto-utils.js');

// VIP Token
let vipToken = null;

/**
 * 初始化：获取或创建 VIP Token
 */
async function initializeVIPToken() {
  try {
    const tokenData = await getOrCreateToken();
    vipToken = tokenData.token;
    console.log('[VIP Plugin] Token initialized successfully');
    console.log('[VIP Plugin] User ID:', tokenData.userId);
    console.log('[VIP Plugin] Expires at:', new Date(tokenData.expiresAt).toLocaleString());
  } catch (error) {
    console.error('[VIP Plugin] Failed to initialize token:', error);
  }
}

/**
 * 监听请求，添加 VIP Token header
 */
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    // 确保 token 已初始化
    if (!vipToken) {
      return { requestHeaders: details.requestHeaders };
    }

    // 添加自定义 header
    details.requestHeaders.push({
      name: 'X-VIP-Token',
      value: vipToken
    });

    // 添加额外的识别 header（更隐蔽）
    details.requestHeaders.push({
      name: 'X-Client-Version',
      value: '2.0-premium'
    });

    return { requestHeaders: details.requestHeaders };
  },
  {
    urls: [
      'http://qihuanshijie.xyz/*',
      'https://qihuanshijie.xyz/*',
      'http://www.qihuanshijie.xyz/*',
      'https://www.qihuanshijie.xyz/*',
      'http://176.97.71.149/*',
      'http://localhost:5000/*',
      'http://localhost:3000/*'
    ]
  },
  ['blocking', 'requestHeaders']
);

/**
 * 插件安装时初始化
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[VIP Plugin] Extension installed');
  await initializeVIPToken();
});

/**
 * 插件启动时初始化
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('[VIP Plugin] Extension started');
  await initializeVIPToken();
});

/**
 * 立即初始化（用于开发测试）
 */
initializeVIPToken();

/**
 * 监听来自 popup 的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTokenInfo') {
    chrome.storage.local.get(['vipToken', 'tokenData'], (result) => {
      sendResponse({
        hasToken: !!result.vipToken,
        tokenData: result.tokenData
      });
    });
    return true; // 保持消息通道打开
  }

  if (request.action === 'refreshToken') {
    getOrCreateToken().then((tokenData) => {
      vipToken = tokenData.token;
      sendResponse({
        success: true,
        tokenData: tokenData
      });
    }).catch((error) => {
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true;
  }
});
