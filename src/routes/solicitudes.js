const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');

// Definir endpoints
router.get('/', solicitudController.listar);
router.get('/:id', solicitudController.obtener);
router.post('/', solicitudController.crear);
router.patch('/:id/estado', solicitudController.cambiarEstado);

module.exports = router; 
