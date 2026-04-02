const bodyPartToMuscles = {
  "chest": ["pectorals", "upper chest"],
  "back": ["lats", "latissimus dorsi", "traps", "trapezius", "rhomboids", "levator scapulae", "serratus anterior", "upper back", "spine"],
  "shoulders": ["deltoids", "rear deltoids", "delts", "rotator cuff"],
  "upper arms": ["biceps", "triceps", "brachialis"],
  "lower arms": ["forearms", "wrist flexors", "wrist extensors", "grip muscles", "wrists", "hands"],
  "upper legs": ["quads", "quadriceps", "hamstrings", "glutes", "abductors", "adductors", "inner thighs", "hip flexors", "groin"],
  "lower legs": ["calves", "soleus", "shins", "ankles", "ankle stabilizers", "feet"],
  "waist": ["abs", "abdominals", "lower abs", "obliques", "core"],
  "neck": ["sternocleidomastoid"],
  "cardio": ["cardiovascular system"]
};

class MusclesController {
  async getMusclesByBodyPart(req, res, next) {
    try {
      const { bodyPart } = req.query;

      if (!bodyPart) {
        return res.status(400).json({
          success: false,
          error: 'bodyPart query parameter is required'
        });
      }

      const normalizedBodyPart = bodyPart.trim().toLowerCase();

      if (!bodyPartToMuscles[normalizedBodyPart]) {
        return res.status(400).json({
          success: false,
          error: 'Invalid body part'
        });
      }

      const muscles = [...new Set(bodyPartToMuscles[normalizedBodyPart].map(m => m.toLowerCase()))];

      res.status(200).json({
        success: true,
        data: {
          bodyPart: normalizedBodyPart,
          muscles
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MusclesController();
