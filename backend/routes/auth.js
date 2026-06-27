const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();
const pool = require('../config/database');
const { success, error } = require('../utils/response');
const auth = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return error(res, '用户名、邮箱和密码不能为空');
  }

  if (password.length < 6) {
    return error(res, '密码长度不能少于6位');
  }

  try {
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return error(res, '用户名或邮箱已被注册');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    const token = jwt.sign(
      { userId: result.insertId, username, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    success(res, {
      token,
      user: {
        id: result.insertId,
        username,
        email
      }
    }, '注册成功');
  } catch (err) {
    console.error(err);
    error(res, '注册失败，请稍后重试', 500);
  }
});

router.post('/login', async (req, res) => {
  const { account, password } = req.body;

  if (!account || !password) {
    return error(res, '账号和密码不能为空');
  }

  try {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [account, account]
    );

    if (users.length === 0) {
      return error(res, '账号不存在');
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return error(res, '密码错误');
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    success(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    }, '登录成功');
  } catch (err) {
    console.error(err);
    error(res, '登录失败，请稍后重试', 500);
  }
});

router.get('/userinfo', auth, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return error(res, '用户不存在', 404);
    }

    success(res, users[0]);
  } catch (err) {
    console.error(err);
    error(res, '获取用户信息失败', 500);
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return error(res, '邮箱不能为空');
  }

  try {
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return error(res, '该邮箱未注册');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);

    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [email, token, expiresAt]
    );

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: '知序 - 密码重置',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>密码重置</h2>
          <p>您好，</p>
          <p>您收到这封邮件是因为有人请求重置您在知序平台的密码。</p>
          <p>请点击下面的链接重置密码：</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #409eff; color: white; text-decoration: none; border-radius: 4px;">重置密码</a>
          <p>如果您没有请求重置密码，请忽略这封邮件。</p>
          <p>此链接有效期为1小时。</p>
          <hr />
          <p style="color: #999; font-size: 12px;">这是一封自动发送的邮件，请勿直接回复。</p>
        </div>
      `
    });

    success(res, null, '重置密码邮件已发送，请查收');
  } catch (err) {
    console.error(err);
    error(res, '发送重置邮件失败，请稍后重试', 500);
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return error(res, '参数不完整');
  }

  if (password.length < 6) {
    return error(res, '密码长度不能少于6位');
  }

  try {
    const [resets] = await pool.query(
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [token]
    );

    if (resets.length === 0) {
      return error(res, '重置链接无效或已过期');
    }

    const reset = resets[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, reset.email]
    );

    await pool.query('DELETE FROM password_resets WHERE email = ?', [reset.email]);

    success(res, null, '密码重置成功');
  } catch (err) {
    console.error(err);
    error(res, '密码重置失败，请稍后重试', 500);
  }
});

module.exports = router;
