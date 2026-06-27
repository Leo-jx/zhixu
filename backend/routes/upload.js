const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');

const router = express.Router();
const pool = require('../config/database');
const { success, error } = require('../utils/response');
const auth = require('../middleware/auth');
const { analyzeQuestions, parseQuestionsFallback } = require('../services/aiService');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 .doc 和 .docx 格式的文件'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

const extractTextFromWord = async (filePath, extname) => {
  if (extname === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else {
    throw new Error('.doc 格式文件需要安装 libreoffice 转换，请先转换为 .docx 格式');
  }
};

router.post('/word', auth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return error(res, '请上传文件');
  }

  const userId = req.user.userId;
  const fileName = req.file.originalname;
  const filePath = req.file.path;
  const extname = path.extname(fileName).toLowerCase();

  try {
    const text = await extractTextFromWord(filePath, extname);
    
    let questions = [];
    let useAI = true;

    try {
      questions = await analyzeQuestions(text);
    } catch (aiError) {
      console.warn('AI解析失败，使用备用解析方案:', aiError.message);
      questions = parseQuestionsFallback(text);
      useAI = false;
    }

    if (questions.length === 0) {
      return error(res, '未能识别到题目，请检查文档格式');
    }

    const bankTitle = fileName.replace(extname, '');
    const [bankResult] = await pool.query(
      'INSERT INTO question_banks (user_id, title, file_name, total_questions) VALUES (?, ?, ?, ?)',
      [userId, bankTitle, fileName, questions.length]
    );

    const bankId = bankResult.insertId;

    const questionValues = questions.map((q, index) => [
      bankId,
      q.type || 'single',
      q.stem,
      JSON.stringify(q.options || []),
      q.answer || '',
      q.analysis || '',
      index
    ]);

    await pool.query(
      'INSERT INTO questions (bank_id, type, stem, options, answer, analysis, sort_order) VALUES ?',
      [questionValues]
    );

    fs.unlink(filePath, (err) => {
      if (err) console.error('删除文件失败:', err);
    });

    success(res, {
      bankId: bankId,
      title: bankTitle,
      totalQuestions: questions.length,
      useAI: useAI,
      questions: questions.map((q, index) => ({
        id: null,
        type: q.type,
        stem: q.stem,
        options: q.options,
        answer: q.answer,
        analysis: q.analysis,
        sort_order: index
      }))
    }, '解析成功');
  } catch (err) {
    console.error(err);
    error(res, err.message || '解析失败，请稍后重试', 500);
  }
});

router.post('/word/guest', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return error(res, '请上传文件');
  }

  const fileName = req.file.originalname;
  const filePath = req.file.path;
  const extname = path.extname(fileName).toLowerCase();

  try {
    const text = await extractTextFromWord(filePath, extname);
    
    let questions = [];
    let useAI = true;

    try {
      questions = await analyzeQuestions(text);
    } catch (aiError) {
      console.warn('AI解析失败，使用备用解析方案:', aiError.message);
      questions = parseQuestionsFallback(text);
      useAI = false;
    }

    if (questions.length === 0) {
      return error(res, '未能识别到题目，请检查文档格式');
    }

    fs.unlink(filePath, (err) => {
      if (err) console.error('删除文件失败:', err);
    });

    const bankId = 'guest_' + Date.now();
    const bankTitle = fileName.replace(extname, '');

    success(res, {
      bankId: bankId,
      title: bankTitle,
      totalQuestions: questions.length,
      useAI: useAI,
      questions: questions.map((q, index) => ({
        id: index,
        type: q.type,
        stem: q.stem,
        options: q.options,
        answer: q.answer,
        analysis: q.analysis,
        sort_order: index
      }))
    }, '解析成功');
  } catch (err) {
    console.error(err);
    error(res, err.message || '解析失败，请稍后重试', 500);
  }
});

module.exports = router;
