const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { success, error } = require('../utils/response');
const auth = require('../middleware/auth');

router.get('/list', auth, async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, pageSize = 10 } = req.query;

  try {
    const offset = (page - 1) * pageSize;
    
    const [banks] = await pool.query(
      'SELECT id, title, description, file_name, total_questions, created_at, updated_at FROM question_banks WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, parseInt(pageSize), offset]
    );

    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM question_banks WHERE user_id = ?',
      [userId]
    );

    success(res, {
      list: banks,
      total: countResult[0].total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    console.error(err);
    error(res, '获取题库列表失败', 500);
  }
});

router.get('/:id', auth, async (req, res) => {
  const userId = req.user.userId;
  const bankId = req.params.id;

  try {
    const [banks] = await pool.query(
      'SELECT * FROM question_banks WHERE id = ? AND user_id = ?',
      [bankId, userId]
    );

    if (banks.length === 0) {
      return error(res, '题库不存在', 404);
    }

    const [questions] = await pool.query(
      'SELECT id, type, stem, options, answer, analysis, sort_order FROM questions WHERE bank_id = ? ORDER BY sort_order ASC',
      [bankId]
    );

    const formattedQuestions = questions.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));

    success(res, {
      bank: banks[0],
      questions: formattedQuestions
    });
  } catch (err) {
    console.error(err);
    error(res, '获取题库详情失败', 500);
  }
});

router.put('/:id/question/:questionId', auth, async (req, res) => {
  const userId = req.user.userId;
  const bankId = req.params.id;
  const questionId = req.params.questionId;
  const { type, stem, options, answer, analysis } = req.body;

  try {
    const [banks] = await pool.query(
      'SELECT id FROM question_banks WHERE id = ? AND user_id = ?',
      [bankId, userId]
    );

    if (banks.length === 0) {
      return error(res, '题库不存在', 404);
    }

    await pool.query(
      'UPDATE questions SET type = ?, stem = ?, options = ?, answer = ?, analysis = ? WHERE id = ? AND bank_id = ?',
      [type, stem, JSON.stringify(options || []), answer, analysis || '', questionId, bankId]
    );

    success(res, null, '题目更新成功');
  } catch (err) {
    console.error(err);
    error(res, '更新题目失败', 500);
  }
});

router.delete('/:id', auth, async (req, res) => {
  const userId = req.user.userId;
  const bankId = req.params.id;

  try {
    const [result] = await pool.query(
      'DELETE FROM question_banks WHERE id = ? AND user_id = ?',
      [bankId, userId]
    );

    if (result.affectedRows === 0) {
      return error(res, '题库不存在', 404);
    }

    success(res, null, '删除成功');
  } catch (err) {
    console.error(err);
    error(res, '删除失败', 500);
  }
});

module.exports = router;
