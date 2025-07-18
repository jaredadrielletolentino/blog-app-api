const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../auth');

module.exports.createPost = (req, res) => {
    const { title, content } = req.body;

    const newPost = new Post({
        title,
        content,
        author: req.user.id
    });

    newPost.save()
        .then(post => {
            res.status(201).json(post);
        })
        .catch(error => auth.errorHandler(error, req, res));
};

module.exports.getAllPosts = (req, res) => {
    Post.find()
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .then(posts => {
            res.status(200).json(posts);
        })
        .catch(error => auth.errorHandler(error, req, res));
};

module.exports.getPost = (req, res) => {
    Post.findById(req.params.postId)
        .populate('author', 'username')
        .populate('comments.userId', 'username')
        .then(post => {
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }
            res.status(200).json(post);
        })
        .catch(error => auth.errorHandler(error, req, res));
};

module.exports.updatePost = (req, res) => {
    const { title, content } = req.body;

    Post.findOneAndUpdate(
        { _id: req.params.postId, author: req.user.id },
        { title, content },
        { new: true, runValidators: true }
    )
    .then(updatedPost => {
        if (!updatedPost) {
            return res.status(404).json({ 
                message: 'Post not found or you are not authorized to update this post' 
            });
        }
        res.status(200).json(updatedPost);
    })
    .catch(error => auth.errorHandler(error, req, res));
};

module.exports.deletePost = (req, res) => {
    Post.findOneAndDelete({ _id: req.params.postId, author: req.user.id })
        .then(deletedPost => {
            if (!deletedPost) {
                return res.status(404).json({ 
                    message: 'Post not found or you are not authorized to delete this post' 
                });
            }
            res.status(200).json({ message: 'Post deleted successfully' });
        })
        .catch(error => auth.errorHandler(error, req, res));
};

module.exports.adminDeletePost = (req, res) => {
    Post.findByIdAndDelete(req.params.postId)
        .then(deletedPost => {
            if (!deletedPost) {
                return res.status(404).json({ message: 'Post not found' });
            }
            res.status(200).json({ 
                message: 'Post deleted by admin successfully',
                deletedPost
            });
        })
        .catch(error => auth.errorHandler(error, req, res));
};

module.exports.addComment = (req, res) => {
    const { content } = req.body;

    Post.findById(req.params.postId)
        .then(post => {
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            post.comments.push({
                userId: req.user.id,
                content
            });

            return post.save();
        })
        .then(updatedPost => {
            res.status(200).json(updatedPost);
        })
        .catch(error => auth.errorHandler(error, req, res));
};

module.exports.deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const commentIndex = post.comments.findIndex(
            comment => comment._id.toString() === req.params.commentId
        );

        if (commentIndex === -1) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const comment = post.comments[commentIndex];
        
        // Authorization check
        if (comment.userId.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ 
                message: 'Unauthorized to delete this comment' 
            });
        }

        post.comments.splice(commentIndex, 1);
        const updatedPost = await post.save();
        
        res.status(200).json({ 
            message: 'Comment deleted successfully',
            post: updatedPost
        });
    } catch (error) {
        // Make sure we haven't already sent a response
        if (!res.headersSent) {
            auth.errorHandler(error, req, res);
        }
    }
};

// admin-specific comment deletion method
module.exports.adminDeleteComment = (req, res) => {
    Post.findById(req.params.postId)
        .then(post => {
            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            const commentIndex = post.comments.findIndex(
                comment => comment._id.toString() === req.params.commentId
            );

            if (commentIndex === -1) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            post.comments.splice(commentIndex, 1);
            return post.save();
        })
        .then(updatedPost => {
            res.status(200).json({ 
                message: 'Comment deleted by admin successfully',
                post: updatedPost
            });
        })
        .catch(error => auth.errorHandler(error, req, res));
};

module.exports.updateComment = async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Verify the comment belongs to the requesting user
        if (comment.userId.toString() !== req.user.id) {
            return res.status(403).json({ 
                message: 'Unauthorized to update this comment' 
            });
        }

        // Update the comment
        comment.content = content;
        comment.updatedAt = Date.now();
        
        const updatedPost = await post.save();

        res.status(200).json({
            message: 'Comment updated successfully',
            updatedComment: comment,
            post: updatedPost
        });

    } catch (error) {
        if (!res.headersSent) {
            auth.errorHandler(error, req, res);
        }
    }
};