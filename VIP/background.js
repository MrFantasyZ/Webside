// Background Service Worker (Manifest V3)
// 使用 declarativeNetRequest 自动添加 VIP Token

// Import crypto utilities
importScripts('crypto-utils.js');

// VIP Token
let vipToken = null;

/**
 * 初始化：获取或创建 VIP Token，并设置请求头规则
 */
async function initializeVIPToken() {
  try {
    const tokenData = await getOrCreateToken();
    vipToken = tokenData.token;

    console.log('[VIP Plugin] Token initialized successfully');
    console.log('[VIP Plugin] User ID:', tokenData.userId);
    console.log('[VIP Plugin] Expires at:', new Date(tokenData.expiresAt).toLocaleString());

    // 使用 declarativeNetRequest 添加请求头
    await updateRequestHeaders(vipToken);

  } catch (error) {
    console.error('[VIP Plugin] Failed to initialize token:', error);
  }
}

/**
 * 更新请求头规则
 */
async function updateRequestHeaders(token) {
  try {
    // 先移除所有可能存在的旧规则（ID 1-5）
    try {
      await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [1, 2, 3, 4, 5]
      });
    } catch (e) {
      // 如果规则不存在，忽略错误
      console.log('[VIP Plugin] No existing rules to remove');
    }

    // 定义新规则
    const newRules = [
      {
        id: 1,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'X-VIP-Token',
              operation: 'set',
              value: token
            },
            {
              header: 'X-Client-Version',
              operation: 'set',
              value: '2.0-premium'
            }
          ]
        },
        condition: {
          urlFilter: '||qihuanshijie.xyz',
          resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest']
        }
      },
      {
        id: 2,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'X-VIP-Token',
              operation: 'set',
              value: token
            },
            {
              header: 'X-Client-Version',
              operation: 'set',
              value: '2.0-premium'
            }
          ]
        },
        condition: {
          urlFilter: '||www.qihuanshijie.xyz',
          resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest']
        }
      },
      {
        id: 3,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'X-VIP-Token',
              operation: 'set',
              value: token
            },
            {
              header: 'X-Client-Version',
              operation: 'set',
              value: '2.0-premium'
            }
          ]
        },
        condition: {
          urlFilter: '||176.97.71.149',
          resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest']
        }
      },
      {
        id: 4,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'X-VIP-Token',
              operation: 'set',
              value: token
            },
            {
              header: 'X-Client-Version',
              operation: 'set',
              value: '2.0-premium'
            }
          ]
        },
        condition: {
          urlFilter: '||localhost:8081',
          resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest']
        }
      },
      {
        id: 5,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'X-VIP-Token',
              operation: 'set',
              value: token
            },
            {
              header: 'X-Client-Version',
              operation: 'set',
              value: '2.0-premium'
            }
          ]
        },
        condition: {
          urlFilter: '||localhost:3000',
          resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest']
        }
      }
    ];

    // 添加新规则
    await chrome.declarativeNetRequest.updateSessionRules({
      addRules: newRules
    });

    console.log('[VIP Plugin] Request header rules updated successfully');

  } catch (error) {
    console.error('[VIP Plugin] Failed to update request headers:', error);
  }
}

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
    getOrCreateToken().then(async (tokenData) => {
      vipToken = tokenData.token;
      await updateRequestHeaders(vipToken);
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
