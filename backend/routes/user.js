const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../config/database');
const { success, error } = require('../utils/response');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
  const userId = req.user.userId;

  try {
    const [bankCount] = await pool.query(
      'SELECT COUNT(*) as total FROM question_banks WHERE user_id = ?',
      [userId]
    );

    const [questionCount] = await pool.query(
      `SELECT COUNT(*) as total FROM questions q 
       JOIN question_banks qb ON q.bank_id = qb.id 
       WHERE qb.user_id = ?`,
      [userId]
    );

    const [wrongCount] = await pool.query(
      'SELECT COUNT(*) as total FROM wrong_questions WHERE user_id = ?',
      [userId]
    );

    const [practiceStats] = await pool.query(
      `SELECT 
        COUNT(*) as total_practices,
        SUM(correct_count) as total_correct,
        SUM(wrong_count) as total_wrong
       FROM practice_records 
       WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );

    const totalAnswered = (practiceStats[0].total_correct || 0) + (practiceStats[0].total_wrong || 0);
    const accuracy = totalAnswered > 0 
      ? Math.round((practiceStats[0].total_correct / totalAnswered) * 100) 
      : 0;

    success(res, {
      totalBanks: bankCount[0].total,
      totalQuestions: questionCount[0].total,
      totalWrongQuestions: wrongCount[0].total,
      totalPractices: practiceStats[0].total_practices || 0,
      totalCorrect: practiceStats[0].total_correct || 0,
      totalWrong: practiceStats[0].total_wrong || 0,
      accuracy: accuracy
    });
  } catch (err) {
    console.error(err);
    error(res, '获取统计数据失败', 500);
  }
});

router.get('/practice-history', auth, async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, pageSize = 10 } = req.query;

  try {
    const offset = (page - 1) * pageSize;
    
    const [records] = await pool.query(
      `SELECT pr.*, qb.title as bank_title 
       FROM practice_records pr
       JOIN question_banks qb ON pr.bank_id = qb.id
       WHERE pr.user_id = ? 
       ORDER BY pr.started_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, parseInt(pageSize), offset]
    );

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM practice_records WHERE user_id = ?',
      [userId]
    );

    success(res, {
      list: records,
      total: countResult[0].total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    console.error(err);
    error(res, '获取历史记录失败', 500);
  }
});

router.put('/password', auth, async (req, res) => {
  const userId = req.user.userId;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return error(res, '参数不完整');
  }

  if (newPassword.length < 6) {
    return error(res, '新密码长度不能少于6位');
  }

  try {
    const [users] = await pool.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return error(res, '用户不存在', 404);
    }

    const isValidPassword = await bcrypt.compare(oldPassword, users[0].password);
    if (!isValidPassword) {
      return error(res, '原密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    success(res, null, '密码修改成功');
  } catch (err) {
    console.error(err);
    error(res, '修改密码失败', 500);
  }
});

router.put('/profile', auth, async (req, res) => {
  const userId = req.user.userId;
  const { username, avatar } = req.body;

  if (!username) {
    return error(res, '用户名不能为空');
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [username, userId]
    );

    if (existing.length > 0) {
      return error(res, '用户名已被使用');
    }

    await pool.query(
      'UPDATE users SET username = ?, avatar = COALESCE(?, avatar) WHERE id = ?',
      [username, avatar || null, userId]
    );

    const [users] = await pool.query(
      'SELECT id, username, email, avatar FROM users WHERE id = ?',
      [userId]
    );

    success(res, users[0], '更新成功');
  } catch (err) {
    console.error(err);
    error(res, '更新失败', 500);
  }
});

module.exports = router;
