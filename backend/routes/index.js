const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const uploadRoutes = require('./upload');
const bankRoutes = require('./bank');
const practiceRoutes = require('./practice');
const userRoutes = require('./user');

router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
router.use('/bank', bankRoutes);
router.use('/practice', practiceRoutes);
router.use('/user', userRoutes);

module.exports = router;
