const axios = require('axios');

const analyzeQuestions = async (content) => {
  const apiUrl = process.env.XUNFEI_API_URL || 'https://maas-api.cn-huabei-1.xf-yun.com/v2';
  const apiKey = process.env.XUNFEI_API_KEY;
  const model = process.env.XUNFEI_MODEL || 'xopqwen36v35b';

  const prompt = `
你是一个专业的试题解析助手。请从以下文档内容中提取所有题目，并按照指定的JSON格式返回结果。

文档内容：
${content}

请严格按照以下JSON格式返回，不要有任何其他文字：
{
  "questions": [
    {
      "type": "single",
      "stem": "题目内容",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "answer": "A",
      "analysis": "题目解析"
    }
  ]
}

题目类型说明：
- single: 单选题
- multiple: 多选题
- judge: 判断题（选项为["正确", "错误"]，答案为"正确"或"错误"）

注意：
1. 如果是多选题，answer字段用逗号分隔，如"A,C"
2. 如果没有解析，analysis字段为空字符串
3. 确保返回的是合法的JSON格式
`;

  try {
    const response = await axios.post(
      `${apiUrl}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 120000
      }
    );

    let resultText = response.data.choices[0].message.content;
    
    resultText = resultText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      resultText = jsonMatch[0];
    }

    const result = JSON.parse(resultText);
    return result.questions || [];
  } catch (error) {
    console.error('AI解析失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
    throw new Error('AI解析失败，请稍后重试');
  }
};

const parseQuestionsFallback = (content) => {
  const questions = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  let currentQuestion = null;
  let currentOptions = [];

  const questionPatterns = [
    /^\d+[.、]/,
    /^[（(]\d+[）)]/,
    /^第\d+题/
  ];

  const optionPattern = /^[A-Z][.、]/;
  const answerPattern = /答案[:：\s]*([A-Z,，]+|正确|错误)/i;
  const analysisPattern = /(解析|分析|说明)[:：]/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const isQuestionStart = questionPatterns.some(pattern => pattern.test(line));
    
    if (isQuestionStart) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      
      currentQuestion = {
        type: 'single',
        stem: line.replace(/^\d+[.、]\s*/, '').replace(/^[（(]\d+[）)]\s*/, '').replace(/^第\d+题\s*/, ''),
        options: [],
        answer: '',
        analysis: ''
      };
      currentOptions = [];
    } else if (currentQuestion && optionPattern.test(line)) {
      currentOptions.push(line);
      currentQuestion.options = currentOptions;
    } else if (currentQuestion && answerPattern.test(line)) {
      const match = line.match(answerPattern);
      if (match) {
        let answer = match[1].toUpperCase();
        answer = answer.replace(/，/g, ',');
        currentQuestion.answer = answer;
        
        if (answer.includes(',')) {
          currentQuestion.type = 'multiple';
        }
        if (answer === '正确' || answer === '错误') {
          currentQuestion.type = 'judge';
          currentQuestion.options = ['正确', '错误'];
        }
      }
    } else if (currentQuestion && analysisPattern.test(line)) {
      currentQuestion.analysis = line.replace(analysisPattern, '').trim();
    } else if (currentQuestion) {
      if (currentQuestion.analysis) {
        currentQuestion.analysis += ' ' + line;
      } else if (!optionPattern.test(line)) {
        currentQuestion.stem += ' ' + line;
      }
    }
  }

  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return questions.filter(q => q.stem && q.stem.length > 5);
};

module.exports = {
  analyzeQuestions,
  parseQuestionsFallback
};
