import { isBefore, parseISO, startOf, endOfDay } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';
import Subscripction from '../models/Subscription';

class MeetupController {
  async index(req, res) {
    const meetUps = await Meetup.findAll({
      where: { user_id: req.userId },
      attributes: ['id', 'title', 'description', 'location', 'date_time'],
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'url', 'path'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['date_time', 'ASC']],
    });

    return res.json(meetUps);
  }
}
