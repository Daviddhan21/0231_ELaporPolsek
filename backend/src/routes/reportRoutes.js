import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireOfficer } from '../middlewares/roleMiddleware.js';
import { uploadImage } from '../middlewares/uploadMiddleware.js';
import {
  getActiveMapReports,
  getAllReports,
  getReportDetail,
  createReport,
  updateReport,
  deleteReport
} from '../controllers/reportController.js';
import { respondToReport } from '../controllers/responseController.js';

const router = Router();

router.get('/active-map', verifyToken, getActiveMapReports);
router.get('/', verifyToken, getAllReports);
router.get('/:id', verifyToken, getReportDetail);
router.post('/', verifyToken, uploadImage.single('image'), createReport);
router.put('/:id', verifyToken, uploadImage.single('image'), updateReport);
router.delete('/:id', verifyToken, deleteReport);
router.post('/:id/respond', verifyToken, requireOfficer, uploadImage.single('proof_image'), respondToReport);

export default router;
