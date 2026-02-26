const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// BMI calculator (public for unauthenticated use in app too, but we protect for consistency)
router.post(
  '/bmi',
  authMiddleware,
  [
    body('weightKg').isFloat({ min: 20, max: 300 }),
    body('heightCm').isFloat({ min: 100, max: 250 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { weightKg, heightCm } = req.body;
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    let category = 'normal';
    if (bmi < 18.5) category = 'underweight';
    else if (bmi < 25) category = 'normal';
    else if (bmi < 30) category = 'overweight';
    else category = 'obese';
    res.json({ bmi: Math.round(bmi * 10) / 10, category });
  }
);

// Daily calorie estimate (Mifflin-St Jeor)
router.post(
  '/calorie',
  authMiddleware,
  [
    body('weightKg').isFloat({ min: 20, max: 300 }),
    body('heightCm').isFloat({ min: 100, max: 250 }),
    body('age').isInt({ min: 10, max: 120 }),
    body('gender').isIn(['male', 'female']),
    body('activityLevel').isIn(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { weightKg, heightCm, age, gender, activityLevel } = req.body;
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.2));
    res.json({
      bmr: Math.round(bmr),
      dailyCalorie: tdee,
      activityLevel,
    });
  }
);

module.exports = router;
