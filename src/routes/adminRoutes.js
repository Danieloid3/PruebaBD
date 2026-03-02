import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';

const router = Router();

router.post('/reset-schema', adminController.resetSchema);
router.post('/migrate-data', adminController.migrateData);
router.post('/sync-mongo', adminController.syncMongo);
router.get('/mongo-history', adminController.getMongoHistories);

export default router;
