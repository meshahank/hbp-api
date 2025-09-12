const prisma = require('../config/database');
const { paginate, createPaginationMeta, sanitizeUser } = require('../utils/helpers');

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

    // Build where clause
    let where = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        {
          username: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          firstName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          email: req.user?.role === 'ADMIN', // Only admins can see emails
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          bio: true,
          avatar: true,
          createdAt: true,
          _count: {
            select: {
              articles: true,
              comments: true,
              likes: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const pagination = createPaginationMeta(total, pageNum, limitNum);

    res.json({
      users,
      pagination
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: req.user?.role === 'ADMIN' || req.user?.id === id, // Users can see their own email
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        bio: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            articles: true,
            comments: true,
            likes: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

const getUserArticles = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { skip, take, page: pageNum, limit: limitNum } = paginate(page, limit);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build where clause - only show published articles unless it's the user's own articles
    let where = { authorId: id };
    
    if (!req.user || (req.user.id !== id && req.user.role !== 'ADMIN')) {
      where.status = 'PUBLISHED';
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
    console.error('Get user articles error:', error);
    res.status(500).json({ error: 'Failed to get user articles' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete user (cascading delete will handle related records)
    await prisma.user.delete({
      where: { id }
    });

    res.json({ 
      message: 'User deleted successfully',
      deletedUser: user.username
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = {
  getUsers,
  getUser,
  getUserArticles,
  deleteUser
};
