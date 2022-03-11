const express = require('express');
const {body} = require('express-validator');

const isAuth = require('../middleware/is-auth');
const postController = require('../controllers/postController');

const router = express.Router();

router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);

router.post('/', isAuth, [
  // validation set of middleware
  body('title').trim().isLength({min: 5}),
  body('content').trim().isLength({min: 5}),
], postController.createPost);

// Для формы с редактированием, когда вся статья редактируется
router.put('/:id', isAuth, postController.updatePost);

router.delete('/:id', isAuth, postController.deletePost);

module.exports = router;
