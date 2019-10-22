import * as Yup from 'yup';
import User from '../models/User';
import File from '../modes/File';

class UserController {
  async store(req, res) {
    const userExists = await User.findOne({ where: req.body.email });

    if (userExists) {
      return res.status(400).json({
        message: `E-mail already exists`,
        userMessage: `Usuário com e-mail já cadastrado`,
        code: 'ERROR_BAD_REQUEST',
      });
    }

    const { id, name, email } = await User.create(req.body);

    return res.json({
      id,
      name,
      email,
    });
  }

  async update(req, res) {
    const { name: oldName, email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (!email || !oldName) {
      return res.status(400).json({
        message: `Please fill with a valid name and e-mail`,
        userMessage: `Você não pode deixar os campos de nome e e-mail vazios`,
        code: 'ERROR_BAD_REQUEST',
      });
    }

    if (email && email !== user.email) {
      const userExists = await User.findOne({
        where: { email },
      });

      if (userExists) {
        return res.status(400).json({
          message: `E-mail already been used`,
          userMessage: `Usuário com este e-mail já cadastrado`,
          code: 'ERROR_BAD_REQUEST',
        });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({
        message: `Old password doesn't match`,
        userMessage: `Password inválido`,
        code: 'ERROR_BAD_REQUEST',
      });
    }

    await user.update(req.body);

    const { id, name, avatar } = await User.findByPk(req.userId, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json({
      id,
      name,
      email,
      avatar,
    });
  }
}
