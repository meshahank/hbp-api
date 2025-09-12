const prisma = require('../config/database');
const { generateUniqueSlug, paginate, createPaginationMeta } = require('../utils/helpers');

const createArticle = async (req, res) => {
  try {
    const { title, content, excerpt, featuredImage, tags } = req.body;
    const authorId = req.user.id;

    // Generate unique slug
    const slug = await generateUniqueSlug(title, prisma);

    // Create article
    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        authorId,
        ...(tags && tags.length > 0 && {
          tags: {
            create: tags.map(tagName => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: {
                    name: tagName,
                    slug: tagName.toLowerCase().replace(/\s+/g, '-')
                  }
                }
              }
            }))
          }
        })
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Article created successfully',
      article
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
};

const getArticles = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, author, search } = req.query;
    const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

    // Build where clause
    let where = {};

    // Filter by status - only show published articles to non-authenticated users
    if (req.user) {
      if (status) {
        where.status = status;
      }
      // Authenticated users can see their own drafts/submitted articles
      if (req.user.role !== 'ADMIN') {
        where.OR = [
          { status: 'PUBLISHED' },
          { authorId: req.user.id }
        ];
      }
    } else {
      where.status = 'PUBLISHED';
    }

    // Filter by author
    if (author) {
      where.author = {
        username: {
          contains: author,
          mode: 'insensitive'
        }
      };
    }

    // Search in title and content
    if (search) {
      where.OR = [
        ...(where.OR || []),
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          content: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      }),
      prisma.article.count({ where })
    ]);

    const pagination = createPaginationMeta(total, pageNum, limitNum);

    res.json({
      articles,
      pagination
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: 'Failed to get articles' });
  }
};

const getArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        comments: {
          where: {
            parentId: null // Only top-level comments
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
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check if user can view this article
    if (article.status !== 'PUBLISHED') {
      if (!req.user || (req.user.id !== article.authorId && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Check if current user has liked this article
    let isLiked = false;
    if (req.user) {
      const like = await prisma.like.findUnique({
        where: {
          articleId_userId: {
            articleId: id,
            userId: req.user.id
          }
        }
      });
      isLiked = !!like;
    }

    res.json({
      article: {
        ...article,
        isLiked
      }
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Failed to get article' });
  }
};

const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, featuredImage, tags } = req.body;

    // Check if article exists and user has permission
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      select: { id: true, authorId: true, slug: true, title: true }
    });

    if (!existingArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (existingArticle.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate new slug if title changed
    let slug = existingArticle.slug;
    if (title && title !== existingArticle.title) {
      slug = await generateUniqueSlug(title, prisma, existingArticle.slug);
    }

    // Update article
    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(title && { slug }),
        ...(content && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(tags && {
          tags: {
            deleteMany: {},
            create: tags.map(tagName => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: {
                    name: tagName,
                    slug: tagName.toLowerCase().replace(/\s+/g, '-')
                  }
                }
              }
            }))
          }
        })
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    res.json({
      message: 'Article updated successfully',
      article
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if article exists and user has permission
    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true, authorId: true }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.article.delete({
      where: { id }
    });

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
};

const publishArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await prisma.article.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      message: 'Article published successfully',
      article
    });
  } catch (error) {
    console.error('Publish article error:', error);
    res.status(500).json({ error: 'Failed to publish article' });
  }
};

const likeArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Create like (will fail if already exists due to unique constraint)
    try {
      await prisma.like.create({
        data: {
          articleId: id,
          userId
        }
      });

      // Get updated like count
      const likeCount = await prisma.like.count({
        where: { articleId: id }
      });

      res.json({
        message: 'Article liked successfully',
        likeCount,
        isLiked: true
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Article already liked' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Like article error:', error);
    res.status(500).json({ error: 'Failed to like article' });
  }
};

const unlikeArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Delete like
    const deletedLike = await prisma.like.deleteMany({
      where: {
        articleId: id,
        userId
      }
    });

    if (deletedLike.count === 0) {
      return res.status(404).json({ error: 'Like not found' });
    }

    // Get updated like count
    const likeCount = await prisma.like.count({
      where: { articleId: id }
    });

    res.json({
      message: 'Article unliked successfully',
      likeCount,
      isLiked: false
    });
  } catch (error) {
    console.error('Unlike article error:', error);
    res.status(500).json({ error: 'Failed to unlike article' });
  }
};

const getArticleLikes = async (req, res) => {
  try {
    const { id } = req.params;

    const likes = await prisma.like.findMany({
      where: { articleId: id },
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
        createdAt: 'desc'
      }
    });

    res.json({
      likes,
      count: likes.length
    });
  } catch (error) {
    console.error('Get article likes error:', error);
    res.status(500).json({ error: 'Failed to get article likes' });
  }
};

module.exports = {
  createArticle,
  getArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  likeArticle,
  unlikeArticle,
  getArticleLikes
};
