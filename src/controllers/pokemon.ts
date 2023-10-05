import type { Request, Response } from 'express';
import axios from 'axios';

class PokemonController {
  static async getImageById(_req: Request, res: Response): Promise<void> {
    const id = _req.params.id;
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const front_default = data.sprites.front_default;
    res.status(200).send({ url: front_default });
  }
}

export default PokemonController;
