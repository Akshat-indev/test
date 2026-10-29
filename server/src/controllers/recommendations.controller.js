import { generateRecommendations } from '../services/recommendation.service.js';

export async function getRecommendations(req, res, next) {
  try {
    const { location, query, page, limit } = req.query;
    const result = await generateRecommendations(req.user.id, { location, query, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function generateNewRecommendations(req, res, next) {
  try {
    const { location, query, page, limit } = req.body;
    const result = await generateRecommendations(req.user.id, { location, query, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

