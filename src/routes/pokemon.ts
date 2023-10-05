import { Router } from 'express';

import PokemonController from '../controllers/pokemon';

const router = Router();

router.get('/images/:id', PokemonController.getImageById);

export default router;
