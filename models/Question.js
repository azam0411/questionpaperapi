const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  originalQuestion: { type: String, required: true },
  generatedQuestions: { type: String },
  options: [String],
  correctAnswer: { type: String, required: true },
  metadata: {
    uploadedAt: { type: Date, default: Date.now },
    fileName: String,
  },
});

module.exports = mongoose.model("Question", QuestionSchema);
