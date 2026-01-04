// Popup UI Script

document.addEventListener('DOMContentLoaded', () => {
  loadTokenInfo();

  // 刷新按钮
  document.getElementById('refreshBtn').addEventListener('click', refreshToken);
});

/**
 * 加载 Token 信息
 */
function loadTokenInfo() {
  chrome.runtime.sendMessage({ action: 'getTokenInfo' }, (response) => {
    if (response && response.hasToken) {
      displayTokenInfo(response.tokenData);
    } else {
      displayError();
    }
  });
}

/**
 * 显示 Token 信息
 */
function displayTokenInfo(tokenData) {
  const userIdEl = document.getElementById('userId');
  const expiresAtEl = document.getElementById('expiresAt');

  if (tokenData) {
    userIdEl.textContent = tokenData.userId || '未知';

    if (tokenData.expiresAt) {
      const expiryDate = new Date(tokenData.expiresAt);
      const now = new Date();
      const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      expiresAtEl.textContent = `${expiryDate.toLocaleDateString('zh-CN')} (剩余 ${daysLeft} 天)`;

      // 如果快过期了，显示警告
      if (daysLeft < 7) {
        expiresAtEl.style.color = '#ffeb3b';
      }
    } else {
      expiresAtEl.textContent = '长期有效';
    }
  }
}

/**
 * 显示错误
 */
function displayError() {
  document.getElementById('statusBadge').textContent = '✗ Token 未找到';
  document.getElementById('statusBadge').classList.remove('status-active');
  document.getElementById('userId').textContent = '请刷新 Token';
  document.getElementById('expiresAt').textContent = '请刷新 Token';
}

/**
 * 刷新 Token
 */
function refreshToken() {
  const btn = document.getElementById('refreshBtn');
  btn.textContent = '刷新中...';
  btn.disabled = true;

  chrome.runtime.sendMessage({ action: 'refreshToken' }, (response) => {
    btn.textContent = '刷新 Token';
    btn.disabled = false;

    if (response && response.success) {
      displayTokenInfo(response.tokenData);

      // 显示成功提示
      btn.textContent = '✓ 刷新成功';
      setTimeout(() => {
        btn.textContent = '刷新 Token';
      }, 2000);
    } else {
      alert('刷新失败：' + (response?.error || '未知错误'));
    }
  });
}
