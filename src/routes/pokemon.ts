import { Router } from 'express';

import PokeImagesController from '../controllers/poke-images';

const router = Router();

router.get('/images/:id', PokeImagesController.get);

export default router;
