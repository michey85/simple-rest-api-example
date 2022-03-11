const path = require('path');
const fs = require('fs');
const {validationResult} = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

// with pagination
const POST_PER_PAGE = 2;
exports.getPosts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalPosts;

  Post.find().countDocuments().then(count => {
    totalPosts = count;
    return Post.find().skip((page - 1) * POST_PER_PAGE).limit(POST_PER_PAGE);
  })
  .then((posts) => {
    res.json({
      posts,
      total: totalPosts,
    })
  }).catch(next);  
}

exports.getPostById = (req, res, next) => {
  Post.findById(req.params.id).then(post => {
    if (!post) throw new Error('There is no post with such id');

    res.json(post);
  }).catch(next)
}

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({msg: 'Validation error!', errors: errors.array()})
  }

  const {title, content} = req.body;
  const imageUrl = req.file?.path; // from multer middleware

  let newPost;

  Post.create({title, content, creator: req.userId, imageUrl})
    .then((post) => {
      newPost = post;

      return User.findById(req.userId)
    })
    .then(user => {
      user.posts.push(newPost._id);
      return user.save()
    })
    .then(() => {
      res.status(201).json({
        msg: 'Content was created',
        post: newPost,
      })
    })
    .catch(next);
}

exports.updatePost = (req, res, next) => {
  const {title, content} = req.body;

  let imageUrl = req.body.image; // старая ссылка
  let newPost;

  if (req.file) {
    imageUrl = req.file.path; // значит новый файл был загружен
  }

  Post.findById(req.params.id)
    .then(post => {
      if (!post) throw new Error('NO Post with such ID' + req.params.id);

      checkUserCanProceed(post.creator.toString(), req.userId);

      // если картинка изменилась, то старую удаляем
      if (post.imageUrl && post.imageUrl !== imageUrl) {
        clearImage(post.imageUrl);
      }
        
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;

      newPost = post;

      return post.save();
    })
    .then(() => {
      res.json({msg: 'Post was updated', post: newPost})
    })
    .catch(next);
}

exports.deletePost = (req, res, next) => {
  const postId = req.params.id;
  Post.findById(postId)
    .then(post => {
      if (!post) throw new Error('No Post with such Id!');
      checkUserCanProceed(post.creator.toString(), req.userId);

      // validate user rules for deleting this post
      clearImage(post.imageUrl)

      return Post.findByIdAndRemove(postId);
    })
    .then(() => {
      return User.findById(req.userId);
    })
    .then(user => {
      // удаляем пост у пользователя
      user.post.pull(postId);
      return user.save();
    })
    .then(() => res.json({msg: 'The post was deleted!'}))
    .catch(next)
}

// helpers
function clearImage(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  fs.unlink(fullPath, console.error);
}

function checkUserCanProceed(postCreatorId, userId) {
      // проверяем что запрос инициирован автором
      if (postCreatorId !== userId) {
        const error = new Error('You\'re not allowed to delete this post.');
        error.statusCode = 403;
        throw error;
      }

}