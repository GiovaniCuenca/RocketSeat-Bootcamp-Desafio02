import { isBefore } from 'date-fns';

import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';
import Queue from '../../lib/Queue';
import SubscriptionMail from '../jobs/SubscriptionMail';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      attributes: ['id'],
      include: [
        {
          model: Meetup,
          as: 'meetup',
          attributes: ['id', 'title', 'description', 'location', 'date_time'],
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email'],
            },
            {
              model: File,
              as: 'banner',
              attributes: ['id', 'url', 'path'],
            },
          ],
        },
      ],
      order: [['meetup', 'date_time']],
    });

    return res.json(
      subscriptions.filter(sub =>
        isBefore(new Date(), new Date(sub.meetup.date_time))
      )
    );
  }

  async store(req, res) {
    const { meetUpId } = req.query;

    const meetUp = await Meetup.findByPk(meetUpId);

    if (!meetUp) {
      return res.status(404).json({
        message: `MeetUp with id ${meetUpId} not found`,
        userMessage: `MeetUp ${meetUpId} não foi encontrado`,
        code: 'ERROR_MEETUP_NOT_FOUND',
      });
    }

    if (isBefore(new Date(meetUp.date_time), new Date())) {
      return res.status(400).json({
        message: `You can't subscribe to past Meetups.`,
        userMessage: `Você não pode se cadastrar em Meetups passados`,
        code: 'ERROR_PAST_MEETUP',
      });
    }

    if (meetUp.user_id === req.userId) {
      return res.status(401).json({
        message: `You can't subscribe to your own Meetup`,
        userMessage: `Você não pode se inscrever em seu próprio Meetup`,
        code: 'ERROR_BAD_REQUEST',
      });
    }

    const subscriptionExists = await Subscription.findOne({
      where: { user_id: req.userId, meetup_id: meetUpId },
    });

    if (subscriptionExists) {
      return res.status(400).json({
        message: `MeetUp already subscribed by user`,
        userMessage: `Você já se inscreveu neste Meetup`,
        code: 'ERROR_BAD_REQUEST',
      });
    }

    const sameHoursMeetUps = await Subscription.findOne({
      where: { user_id: req.userId },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          attributes: ['id'],
          where: { date_time: meetUp.date_time },
        },
      ],
    });

    if (sameHoursMeetUps) {
      return res.status(400).json({
        message: `Already subscribed to another MeetUp during this time`,
        userMessage: `Voê já está inscrito para um MeetUp no mesmo horário`,
        code: 'EEROR_BAD_REQUEST',
      });
    }

    const subscription = await Subscription.create({
      user_id: req.userId,
      meetup_id: meetUpId,
    });

    const mailData = await Subscription.findByPk(subscription.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
        {
          model: Meetup,
          as: 'meetup',
          attributes: ['title'],
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['name', 'email'],
            },
          ],
        },
      ],
    });

    const mailOrganizedData = {
      user: mailData.user,
      owner: mailData.meetup.owner,
      meetup: { title: mailData.metup.title },
      date: mailData.createAt,
    };

    await Queue.add(SubscriptionMail.key, { subscription: mailOrganizedData });

    return res.json({ subscription });
  }

  async delete(req, res) {
    const { meetUpId } = req.query;

    const meetUp = Meetup.findByPk(meetUpId);
    const subscription = await Subscription.findOne({
      where: { user_id: req.userId, meetup_id: meetUpId },
    });

    if (!subscription) {
      return res.status(404).json({
        message: `Subscription to Meetup with id ${meetUpId} not found`,
        userMessage: `Inscrição para este Meetup não encontrada`,
        code: 'ERROR_SUBSCRIPTION_NOT_FOUND',
      });
    }

    if (isBefore(new Date(meetUp.date_time), new Date())) {
      return res.status(400).json({
        message: `You can't cancel past MeetUps subscriptions`,
        userMessage: `Não é possível cancelar inscrição de eventos passados`,
        code: 'ERROR_PAST_MEETUP',
      });
    }

    Subscription.destroy({ where: { meetup_id: meetUpId } });

    return res.json({
      message: `Subscription to MeetUp with id ${meetUpId} was deleted`,
      userMessage: `Inscrição no Meetup ${meetUpId} cancelada`,
      code: 'SUCCESS',
    });
  }
}

export default new SubscriptionController();
