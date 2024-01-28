const Photo = require('../models/photo.model');
const escapeHtml = require('escape-html');
const requestIp = require('request-ip');
const Voter = require('../models/Voter.model');
const allowedExtensions = ['gif', 'jpg', 'png'];
const maxTitleLength = 25;
const maxAuthorLength = 50;

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if (title && author && email && file) {
      // if fields are not empty...

      const escapedTitle = escapeHtml(title);
      const escapedAuthor = escapeHtml(author);
      const escapedEmail = escapeHtml(email);

      if (escapedTitle.length > maxTitleLength) {
        throw new Error(
          `Title length exceeds the maximum limit of ${maxTitleLength} characters.`
        );
      }

      if (escapedAuthor.length > maxAuthorLength) {
        throw new Error(
          `Author length exceeds the maximum limit of ${maxAuthorLength} characters.`
        );
      }

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];

      if (allowedExtensions.includes(fileExt.toLowerCase())) {
        const newPhoto = new Photo({
          title: escapedTitle,
          author: escapedAuthor,
          email: escapedEmail,
          src: fileName,
          votes: 0,
        });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        throw new Error('Wrong file format!');
      }
    } else {
      throw new Error('Wrong input!');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const ipAddress = requestIp.getClientIp(req);
    const photoId = req.params.id;

    // Check if the user already exists in the voters collection
    const existingVoter = await Voter.findOne({ user: ipAddress });

    if (!existingVoter) {
      // If the user doesn't exist, create a new voter
      const newVoter = new Voter({
        user: ipAddress,
        votes: [photoId],
      });

      await newVoter.save();
    } else {
      // If the user already exists, check if they voted for the same photo
      if (existingVoter.votes.includes(photoId)) {
        // If the user already voted for the same photo, return an error
        throw new Error('User already voted for this photo.');
      }

      // Add the photoId to the user's votes
      existingVoter.votes.push(photoId);
      await existingVoter.save();
    }

    // Now, update the votes for the photo
    const photoToUpdate = await Photo.findOne({ _id: photoId });

    if (!photoToUpdate) {
      res.status(404).json({ message: 'Not found' });
    } else {
      photoToUpdate.votes++;
      await photoToUpdate.save();
      res.json({ message: 'OK' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
