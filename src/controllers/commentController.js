const prisma = require('../config/database');
const { paginate, createPaginationMeta } = require('../utils/helpers');

const createComment = async (req, res) => {
  try {
    const { content, articleId, parentId } = req.body;
    const userId = req.user.id;

    // Check if article exists and is published
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, status: true }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'Cannot comment on unpublished article' });
    }

    // If parentId is provided, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, articleId: true }
      });

      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }

      if (parentComment.articleId !== articleId) {
        return res.status(400).json({ error: 'Parent comment must be on the same article' });
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        articleId,
        userId,
        parentId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

const getArticleComments = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Get top-level comments with their replies
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          articleId,
          parentId: null
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      }),
      prisma.comment.count({
        where: {
          articleId,
          parentId: null
        }
      })
    ]);

    const pagination = createPaginationMeta(total, pageNum, limitNum);

    res.json({
      comments,
      pagination
    });
  } catch (error) {
    console.error('Get article comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
};

const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    // Check if comment exists and user has permission
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, userId: true }
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existingComment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update comment
    const comment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if comment exists and user has permission
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, userId: true }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete comment (cascading delete will handle replies)
    await prisma.comment.delete({
      where: { id }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

module.exports = {
  createComment,
  getArticleComments,
  updateComment,
  deleteComment
};
