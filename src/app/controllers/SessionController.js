import jwt from 'jsonwebtoken';
import * as Yup from 'yup';

import File from '../models/File';
import User from '../models/User';

import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'url', 'path'],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        message: `User's ${email} not found.`,
        userMessage: `Usuário com email ${email} não encontrado.`,
        code: 'ERROR_USER_NOT_FOUND',
      });
    }

    const passwordMatch = await user.checkPassword(password);
    if (!passwordMatch) {
      return res.status(401).json({
        message: `Invalid Password.`,
        userMessage: `Senha incorreta, tente novamente.`,
        code: 'ERROR_UNAUTHORIZED',
      });
    }

    const { id, name, avatar } = user;
    const { expiresIn, secret } = authConfig;

    return res.json({
      user: {
        id,
        name,
        email,
        avatar,
      },
      token: jwt.sign({ id }, secret, {
        expiresIn,
      }),
    });
  }
}

export default new SessionController();
