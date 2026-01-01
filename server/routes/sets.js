const express = require('express');
const StudySet = require('../models/StudySet');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all sets for current user
router.get('/', async (req, res) => {
  try {
    const sets = await StudySet.find({ user: req.userId }).sort({ updatedAt: -1 });

    // Transform to match frontend format
    const formattedSets = sets.map(set => ({
      id: set._id.toString(),
      title: set.title,
      questions: set.questions.map(q => ({
        id: q._id.toString(),
        questionText: q.questionText,
        correctAnswer: q.correctAnswer
      })),
      createdAt: set.createdAt.getTime(),
      updatedAt: set.updatedAt.getTime()
    }));

    res.json(formattedSets);
  } catch (error) {
    console.error('Get sets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single set
router.get('/:id', async (req, res) => {
  try {
    const set = await StudySet.findOne({ _id: req.params.id, user: req.userId });

    if (!set) {
      return res.status(404).json({ message: 'Set not found' });
    }

    res.json({
      id: set._id.toString(),
      title: set.title,
      questions: set.questions.map(q => ({
        id: q._id.toString(),
        questionText: q.questionText,
        correctAnswer: q.correctAnswer
      })),
      createdAt: set.createdAt.getTime(),
      updatedAt: set.updatedAt.getTime()
    });
  } catch (error) {
    console.error('Get set error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new set
router.post('/', async (req, res) => {
  try {
    const { title, questions } = req.body;

    const set = new StudySet({
      title,
      questions: questions.map(q => ({
        questionText: q.questionText,
        correctAnswer: q.correctAnswer
      })),
      user: req.userId
    });

    await set.save();

    res.status(201).json({
      id: set._id.toString(),
      title: set.title,
      questions: set.questions.map(q => ({
        id: q._id.toString(),
        questionText: q.questionText,
        correctAnswer: q.correctAnswer
      })),
      createdAt: set.createdAt.getTime(),
      updatedAt: set.updatedAt.getTime()
    });
  } catch (error) {
    console.error('Create set error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update set
router.put('/:id', async (req, res) => {
  try {
    const { title, questions } = req.body;

    const set = await StudySet.findOne({ _id: req.params.id, user: req.userId });

    if (!set) {
      return res.status(404).json({ message: 'Set not found' });
    }

    set.title = title;
    set.questions = questions.map(q => ({
      questionText: q.questionText,
      correctAnswer: q.correctAnswer
    }));

    await set.save();

    res.json({
      id: set._id.toString(),
      title: set.title,
      questions: set.questions.map(q => ({
        id: q._id.toString(),
        questionText: q.questionText,
        correctAnswer: q.correctAnswer
      })),
      createdAt: set.createdAt.getTime(),
      updatedAt: set.updatedAt.getTime()
    });
  } catch (error) {
    console.error('Update set error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete set
router.delete('/:id', async (req, res) => {
  try {
    const set = await StudySet.findOneAndDelete({ _id: req.params.id, user: req.userId });

    if (!set) {
      return res.status(404).json({ message: 'Set not found' });
    }

    res.json({ message: 'Set deleted' });
  } catch (error) {
    console.error('Delete set error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
