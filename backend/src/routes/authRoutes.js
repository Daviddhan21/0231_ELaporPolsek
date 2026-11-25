import { Router } from 'express';
import { registerCitizen, login, refreshToken } from '../controllers/authController.js';
const router = Router();
router.post('/register', registerCitizen);
router.post('/login', login);
router.post('/refresh', refreshToken);
export default router;
