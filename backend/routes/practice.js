const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { success, error } = require('../utils/response');
const auth = require('../middleware/auth');

router.post('/start', auth, async (req, res) => {
  const userId = req.user.userId;
  const { bankId, mode = 'sequential' } = req.body;

  if (!bankId) {
    return error(res, '题库ID不能为空');
  }

  try {
    const [banks] = await pool.query(
      'SELECT id, total_questions FROM question_banks WHERE id = ? AND user_id = ?',
      [bankId, userId]
    );

    if (banks.length === 0) {
      return error(res, '题库不存在', 404);
    }

    const [result] = await pool.query(
      'INSERT INTO practice_records (user_id, bank_id, mode) VALUES (?, ?, ?)',
      [userId, bankId, mode]
    );

    let questionIds = [];
    if (mode === 'random') {
      const [questions] = await pool.query(
        'SELECT id FROM questions WHERE bank_id = ? ORDER BY RAND()',
        [bankId]
      );
      questionIds = questions.map(q => q.id);
    } else {
      const [questions] = await pool.query(
        'SELECT id FROM questions WHERE bank_id = ? ORDER BY sort_order ASC',
        [bankId]
      );
      questionIds = questions.map(q => q.id);
    }

    success(res, {
      recordId: result.insertId,
      totalQuestions: banks[0].total_questions,
      questionIds: questionIds
    }, '开始刷题');
  } catch (err) {
    console.error(err);
    error(res, '开始刷题失败', 500);
  }
});

router.post('/submit', auth, async (req, res) => {
  const userId = req.user.userId;
  const { recordId, questionId, userAnswer, isMarked = false } = req.body;

  if (!recordId || !questionId) {
    return error(res, '参数不完整');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [records] = await connection.query(
      'SELECT * FROM practice_records WHERE id = ? AND user_id = ?',
      [recordId, userId]
    );

    if (records.length === 0) {
      await connection.rollback();
      return error(res, '刷题记录不存在', 404);
    }

    const [questions] = await connection.query(
      'SELECT answer FROM questions WHERE id = ?',
      [questionId]
    );

    if (questions.length === 0) {
      await connection.rollback();
      return error(res, '题目不存在', 404);
    }

    const correctAnswer = questions[0].answer;
    const isCorrect = userAnswer && userAnswer.toUpperCase() === correctAnswer.toUpperCase();

    const [existingAnswer] = await connection.query(
      'SELECT id FROM practice_answers WHERE record_id = ? AND question_id = ?',
      [recordId, questionId]
    );

    if (existingAnswer.length > 0) {
      await connection.query(
        'UPDATE practice_answers SET user_answer = ?, is_correct = ?, is_marked = ? WHERE id = ?',
        [userAnswer, isCorrect, isMarked, existingAnswer[0].id]
      );
    } else {
      await connection.query(
        'INSERT INTO practice_answers (record_id, question_id, user_answer, is_correct, is_marked) VALUES (?, ?, ?, ?, ?)',
        [recordId, questionId, userAnswer, isCorrect, isMarked]
      );

      const record = records[0];
      const newTotalAnswered = record.total_answered + 1;
      const newCorrectCount = isCorrect ? record.correct_count + 1 : record.correct_count;
      const newWrongCount = !isCorrect ? record.wrong_count + 1 : record.wrong_count;

      await connection.query(
        'UPDATE practice_records SET total_answered = ?, correct_count = ?, wrong_count = ?, current_index = current_index + 1 WHERE id = ?',
        [newTotalAnswered, newCorrectCount, newWrongCount, recordId]
      );
    }

    if (!isCorrect) {
      const [wrongQ] = await connection.query(
        'SELECT id, wrong_count FROM wrong_questions WHERE user_id = ? AND question_id = ?',
        [userId, questionId]
      );

      if (wrongQ.length > 0) {
        await connection.query(
          'UPDATE wrong_questions SET wrong_count = wrong_count + 1, last_wrong_at = NOW() WHERE id = ?',
          [wrongQ[0].id]
        );
      } else {
        const [qInfo] = await connection.query(
          'SELECT bank_id FROM questions WHERE id = ?',
          [questionId]
        );
        await connection.query(
          'INSERT INTO wrong_questions (user_id, question_id, bank_id) VALUES (?, ?, ?)',
          [userId, questionId, qInfo[0].bank_id]
        );
      }
    }

    await connection.commit();

    success(res, {
      isCorrect,
      correctAnswer
    }, '提交成功');
  } catch (err) {
    await connection.rollback();
    console.error(err);
    error(res, '提交失败', 500);
  } finally {
    connection.release();
  }
});

router.get('/record/:id', auth, async (req, res) => {
  const userId = req.user.userId;
  const recordId = req.params.id;

  try {
    const [records] = await pool.query(
      'SELECT * FROM practice_records WHERE id = ? AND user_id = ?',
      [recordId, userId]
    );

    if (records.length === 0) {
      return error(res, '记录不存在', 404);
    }

    const [answers] = await pool.query(
      'SELECT * FROM practice_answers WHERE record_id = ? ORDER BY answered_at ASC',
      [recordId]
    );

    success(res, {
      record: records[0],
      answers: answers
    });
  } catch (err) {
    console.error(err);
    error(res, '获取记录失败', 500);
  }
});

router.post('/end', auth, async (req, res) => {
  const userId = req.user.userId;
  const { recordId } = req.body;

  if (!recordId) {
    return error(res, '记录ID不能为空');
  }

  try {
    const [result] = await pool.query(
      'UPDATE practice_records SET status = "completed", ended_at = NOW() WHERE id = ? AND user_id = ?',
      [recordId, userId]
    );

    if (result.affectedRows === 0) {
      return error(res, '记录不存在', 404);
    }

    const [records] = await pool.query(
      'SELECT * FROM practice_records WHERE id = ?',
      [recordId]
    );

    success(res, records[0], '刷题结束');
  } catch (err) {
    console.error(err);
    error(res, '结束刷题失败', 500);
  }
});

router.get('/wrong-questions', auth, async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, pageSize = 10, bankId } = req.query;

  try {
    const offset = (page - 1) * pageSize;
    
    let sql = `
      SELECT wq.*, q.type, q.stem, q.options, q.answer, q.analysis, qb.title as bank_title
      FROM wrong_questions wq
      LEFT JOIN questions q ON wq.question_id = q.id
      LEFT JOIN question_banks qb ON wq.bank_id = qb.id
      WHERE wq.user_id = ?
    `;
    let params = [userId];

    if (bankId) {
      sql += ' AND wq.bank_id = ?';
      params.push(bankId);
    }

    sql += ' ORDER BY wq.last_wrong_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const [wrongQuestions] = await pool.query(sql, params);

    const formatted = wrongQuestions.map(wq => ({
      ...wq,
      options: typeof wq.options === 'string' ? JSON.parse(wq.options) : wq.options
    }));

    let countSql = 'SELECT COUNT(*) as total FROM wrong_questions WHERE user_id = ?';
    let countParams = [userId];
    if (bankId) {
      countSql += ' AND bank_id = ?';
      countParams.push(bankId);
    }

    const [countResult] = await pool.query(countSql, countParams);

    success(res, {
      list: formatted,
      total: countResult[0].total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    console.error(err);
    error(res, '获取错题列表失败', 500);
  }
});

router.delete('/wrong-questions/:questionId', auth, async (req, res) => {
  const userId = req.user.userId;
  const questionId = req.params.questionId;

  try {
    await pool.query(
      'DELETE FROM wrong_questions WHERE user_id = ? AND question_id = ?',
      [userId, questionId]
    );

    success(res, null, '已从错题本移除');
  } catch (err) {
    console.error(err);
    error(res, '移除失败', 500);
  }
});

module.exports = router;
