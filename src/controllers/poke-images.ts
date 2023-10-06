/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import axios from 'axios';
import type { Request, Response } from 'express';
import { REDIS_STORE_TIME } from 'src/helpers/constants';
import { logger } from 'src/logger';
import { client } from 'src/redis';
import { z } from 'zod';

const getSchema = z.object({
  id: z.string().nonempty(),
});

class PokeImagesController {
  static async get(req: Request, res: Response): Promise<void> {
    const data = getSchema.safeParse(req.params);

    if (!data.success) {
      res.status(400).send(data.error);
      return;
    }

    const { id } = data.data;

    const redisRes = await client.get(`poke-images:${id}`);

    if (redisRes) {
      logger.info({ microservice: 'poke-images', message: 'Read from redis' });

      res.status(200).send(JSON.parse(redisRes));
      return;
    }

    const uri = `${process.env.POKE_API_URI}/pokemon/${id}`;

    const {
      data: { sprites: url },
    } = await axios.get(uri);

    client.set(`poke-images:${id}`, JSON.stringify({ url }), {
      EX: REDIS_STORE_TIME,
    });

    logger.info({ microservice: 'poke-images', message: 'Read from api' });

    res.status(200).send({ url });
  }
}

export default PokeImagesController;
