const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  votes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Photo',
    },
  ],
});

module.exports = mongoose.model('Voter', voterSchema);
