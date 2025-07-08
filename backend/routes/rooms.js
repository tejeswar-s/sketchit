const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.post('/create', roomController.createRoom);
router.post('/join', roomController.joinRoom);
router.post('/leave', roomController.leaveRoom);
router.get('/:code', roomController.getRoom);
router.post('/:code/settings', roomController.updateSettings);

module.exports = router; 