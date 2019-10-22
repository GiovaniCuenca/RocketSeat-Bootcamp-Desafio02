import * as Yup from 'yup';

export default async (req, res, next) => {
  const schema = Yup.object().shape({
    name: Yup.string().required(),
    email: Yup.string().email(),
    password: Yup.string().min(8),
    passwordConfirmation: Yup.string().when('password', (password, field) =>
      password ? field.required().oneOf([Yup.ref('password')]) : field
    ),
    oldPassword: Yup.string().when('password', (password, field) =>
      password ? field.required() : field
    ),
  });

  if (!(await schema.isValid(req.body))) {
    return res.json(400).json({
      message: `There are missing or invalid parameters on the request.`,
      userMessage: `Gentileza informar todos os dados corretamente`,
      code: 'ERROR_BAD_REQUEST',
    });
  }

  return next();
};
