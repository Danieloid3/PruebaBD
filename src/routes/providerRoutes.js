import { Router } from 'express';
import * as providerController from '../controllers/providerController.js';

const router = Router();


router.get('/', providerController.getAll);
router.get('/stats/summary', providerController.getSummary);
router.get('/:id', providerController.getById);
router.get('/:id/stats', providerController.getStats);
router.post('/', providerController.create);
router.put('/:id', providerController.update);
router.delete('/:id', providerController.remove);

export default router;

