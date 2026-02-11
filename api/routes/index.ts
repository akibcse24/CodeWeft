import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import pagesRouter from './pages';
import webhooksRouter from './webhooks';

const router = Router();

router.use(authenticateToken);

router.use('/pages', pagesRouter);
router.use('/webhooks', webhooksRouter);
router.use('/databases', (_req: Request, res: Response) => {
  res.status(501).json({ error: 'Not implemented', message: 'Databases endpoint coming soon' });
});

router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API route error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

export default router;
