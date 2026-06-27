const success = (res, data = null, message = 'success') => {
  res.json({
    code: 200,
    message,
    data
  });
};

const error = (res, message = 'error', code = 400) => {
  res.status(code).json({
    code,
    message,
    data: null
  });
};

module.exports = {
  success,
  error
};
