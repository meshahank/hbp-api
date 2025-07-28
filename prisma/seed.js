const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      bio: 'System administrator'
    }
  });

  // Create author users
  const authorPassword = await bcrypt.hash('author123', 12);
  
  const author1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      username: 'johndoe',
      password: authorPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'AUTHOR',
      bio: 'Tech writer and software developer'
    }
  });

  const author2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      username: 'janesmith',
      password: authorPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'AUTHOR',
      bio: 'Frontend developer and UI/UX designer'
    }
  });

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'Technology' },
      update: {},
      create: { name: 'Technology', slug: 'technology' }
    }),
    prisma.tag.upsert({
      where: { name: 'JavaScript' },
      update: {},
      create: { name: 'JavaScript', slug: 'javascript' }
    }),
    prisma.tag.upsert({
      where: { name: 'Node.js' },
      update: {},
      create: { name: 'Node.js', slug: 'nodejs' }
    }),
    prisma.tag.upsert({
      where: { name: 'React' },
      update: {},
      create: { name: 'React', slug: 'react' }
    }),
    prisma.tag.upsert({
      where: { name: 'Tutorial' },
      update: {},
      create: { name: 'Tutorial', slug: 'tutorial' }
    })
  ]);

  // Create sample articles
  const article1 = await prisma.article.create({
    data: {
      title: 'Getting Started with Node.js and Express',
      slug: 'getting-started-with-nodejs-and-express',
      content: `# Getting Started with Node.js and Express

Node.js is a powerful JavaScript runtime that allows you to build server-side applications. Express is a minimal and flexible web framework for Node.js.

## Installation

First, make sure you have Node.js installed on your system. Then create a new project:

\`\`\`bash
mkdir my-express-app
cd my-express-app
npm init -y
npm install express
\`\`\`

## Creating Your First Server

Create an \`app.js\` file:

\`\`\`javascript
const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
\`\`\`

## Conclusion

This is just the beginning! Express provides many more features for building robust web applications.`,
      excerpt: 'Learn how to create your first Node.js application with Express framework.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: author1.id,
      tags: {
        create: [
          { tag: { connect: { id: tags[0].id } } }, // Technology
          { tag: { connect: { id: tags[1].id } } }, // JavaScript
          { tag: { connect: { id: tags[2].id } } }, // Node.js
          { tag: { connect: { id: tags[4].id } } }  // Tutorial
        ]
      }
    }
  });

  const article2 = await prisma.article.create({
    data: {
      title: 'Modern React Development Patterns',
      slug: 'modern-react-development-patterns',
      content: `# Modern React Development Patterns

React has evolved significantly since its introduction. Let's explore some modern patterns that can make your React applications more maintainable and efficient.

## Custom Hooks

Custom hooks allow you to extract component logic into reusable functions:

\`\`\`javascript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}
\`\`\`

## Context API for State Management

For managing global state, the Context API provides a clean solution:

\`\`\`javascript
const ThemeContext = createContext();

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
\`\`\`

## Conclusion

These patterns will help you write more maintainable React applications.`,
      excerpt: 'Explore modern React patterns including custom hooks and context API.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: author2.id,
      tags: {
        create: [
          { tag: { connect: { id: tags[0].id } } }, // Technology
          { tag: { connect: { id: tags[1].id } } }, // JavaScript
          { tag: { connect: { id: tags[3].id } } }, // React
          { tag: { connect: { id: tags[4].id } } }  // Tutorial
        ]
      }
    }
  });

  const article3 = await prisma.article.create({
    data: {
      title: 'Building RESTful APIs with Prisma',
      slug: 'building-restful-apis-with-prisma',
      content: `# Building RESTful APIs with Prisma

Prisma is a next-generation ORM that makes database access easy and type-safe. Let's build a RESTful API using Prisma and Express.

## Setting Up Prisma

First, install Prisma in your project:

\`\`\`bash
npm install prisma @prisma/client
npx prisma init
\`\`\`

## Defining Your Schema

Edit your \`schema.prisma\` file:

\`\`\`prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  author    User    @relation(fields: [authorId], references: [id])
  authorId  Int
}
\`\`\`

## Creating API Endpoints

With Prisma, creating CRUD operations is straightforward and type-safe.`,
      excerpt: 'Learn how to build type-safe RESTful APIs using Prisma ORM.',
      status: 'DRAFT',
      authorId: author1.id,
      tags: {
        create: [
          { tag: { connect: { id: tags[0].id } } }, // Technology
          { tag: { connect: { id: tags[2].id } } }, // Node.js
          { tag: { connect: { id: tags[4].id } } }  // Tutorial
        ]
      }
    }
  });

  // Create sample comments
  const comment1 = await prisma.comment.create({
    data: {
      content: 'Great tutorial! This really helped me understand Express basics.',
      articleId: article1.id,
      userId: author2.id
    }
  });

  const comment2 = await prisma.comment.create({
    data: {
      content: 'Thanks for the feedback! Glad it was helpful.',
      articleId: article1.id,
      userId: author1.id,
      parentId: comment1.id
    }
  });

  await prisma.comment.create({
    data: {
      content: 'The custom hooks section is particularly useful. I\'ve been looking for examples like this.',
      articleId: article2.id,
      userId: author1.id
    }
  });

  // Create sample likes
  await prisma.like.create({
    data: {
      articleId: article1.id,
      userId: author2.id
    }
  });

  await prisma.like.create({
    data: {
      articleId: article2.id,
      userId: author1.id
    }
  });

  await prisma.like.create({
    data: {
      articleId: article1.id,
      userId: admin.id
    }
  });

  console.log('✅ Database seeding completed!');
  console.log('\n📊 Seeded data:');
  console.log(`👥 Users: ${[admin, author1, author2].length}`);
  console.log(`📝 Articles: 3 (2 published, 1 draft)`);
  console.log(`🏷️  Tags: ${tags.length}`);
  console.log(`💬 Comments: 3`);
  console.log(`❤️  Likes: 3`);
  console.log('\n🔐 Test accounts:');
  console.log('Admin: admin@example.com / admin123');
  console.log('Author 1: john@example.com / author123');
  console.log('Author 2: jane@example.com / author123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
