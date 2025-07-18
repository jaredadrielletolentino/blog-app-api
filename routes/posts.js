const express = require('express');
const postController = require('../controllers/posts');
const { verify, verifyAdmin } = require("../auth");

const router = express.Router();

// Public routes
router.get('/getAllPosts', postController.getAllPosts);
router.get('/getSpecificPost/:postId', postController.getPost);

// Authenticated user routes
router.post('/createPost', verify, postController.createPost);
router.patch('/updatePost/:postId', verify, postController.updatePost);
router.delete('/deletePost/:postId', verify, postController.deletePost);

// Comment routes
router.post('/addComment/:postId', verify, postController.addComment);
router.delete('/:postId/comments/:commentId', verify, postController.deleteComment);
router.patch('/:postId/updateComment/:commentId', verify, postController.updateComment);

// Admin-only routes
router.delete('/adminDeletePost/:postId', verify, verifyAdmin, postController.adminDeletePost);
router.delete('/adminDeleteComment/:postId/comments/:commentId', verify, verifyAdmin, postController.adminDeleteComment);

module.exports = router;