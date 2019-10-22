import * as Yup from 'yup';

export default async (req, res, next) => {
  const schema = Yup.object().shape({
    email: Yup.string()
      .email()
      .required(),
    password: Yup.string().required(),
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
