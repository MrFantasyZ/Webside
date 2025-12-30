import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"AI素材网" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '重置密码 - AI素材网',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>密码重置请求</h2>
        <p>您好，</p>
        <p>我们收到了您重置密码的请求。请点击下面的链接来重置您的密码：</p>
        <p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">重置密码</a>
        </p>
        <p>此链接将在30分钟后过期。</p>
        <p>如果您没有请求重置密码，请忽略此邮件。</p>
        <br>
        <p>AI素材网团队</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (email: string, username: string) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"AI素材网" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '欢迎加入 AI素材网',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>欢迎加入 AI素材网！</h2>
        <p>亲爱的 ${username}，</p>
        <p>欢迎您注册AI素材网！我们很高兴您能加入我们的社区。</p>
        <p>在这里您可以：</p>
        <ul>
          <li>浏览和搜索高质量的AI视频素材</li>
          <li>按分类筛选您感兴趣的内容</li>
          <li>购买后48小时内免费下载</li>
        </ul>
        <p>开始探索我们丰富的视频素材库吧！</p>
        <br>
        <p>AI素材网团队</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};