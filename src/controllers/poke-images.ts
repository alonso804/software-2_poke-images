import axios, { AxiosError } from 'axios';
import type { Request, Response } from 'express';
import { performance } from 'perf_hooks';
import { REDIS_STORE_TIME } from 'src/helpers/constants';
import { logger } from 'src/logger';
import { client } from 'src/redis';
import { z } from 'zod';

const getSchema = z.object({
  id: z.string().nonempty(),
});

class PokeImagesController {
  static async get(req: Request, res: Response): Promise<void> {
    const start = performance.now();

    let status = 200;

    const data = getSchema.safeParse(req.params);

    if (!data.success) {
      res.status(400).send(data.error);
      return;
    }

    const { id } = data.data;

    const redisRes = await client.get(`poke-images:${id}`);

    if (redisRes) {
      const end = performance.now();
      logger.info({
        microservice: 'poke-images',
        message: 'Read from redis',
        time: end - start,
        status,
      });

      res.status(status).send(JSON.parse(redisRes));
      return;
    }

    const uri = `${process.env.POKE_API_URI}/pokemon/${id}`;

    let images: unknown[];

    try {
      const response = await axios.get(uri);

      const data = response.data as { sprites: unknown[] };

      images = data.sprites;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          const end = performance.now();

          status = 404;

          logger.warn({
            microservice: 'poke-images',
            message: 'Pokemon not found',
            time: end - start,
            status,
          });

          res.status(status).send({ message: 'Pokemon not found' });
          return;
        }
      }

      throw error;
    }

    client.set(`poke-images:${id}`, JSON.stringify({ url: images }), {
      EX: REDIS_STORE_TIME,
    });

    const end = performance.now();
    logger.info({
      microservice: 'poke-images',
      message: 'Read from api',
      time: end - start,
      status,
    });

    res.status(status).send({ images });
  }
}

export default PokeImagesController;
