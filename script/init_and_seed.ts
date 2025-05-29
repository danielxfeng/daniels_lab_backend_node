import fs from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { searchFactory } from "../src/service/search/service_search";
import request from "supertest";
import app from "../src/app";
import { faker } from "@faker-js/faker";
import loadEnv from "../src/utils/load_env";

loadEnv();

process.env.SEED = "true";

const prisma = new PrismaClient();

const readJson = async <T = unknown>(filename: string): Promise<T> => {
  const fullPath = path.join(__dirname, "seed", filename);
  const file = await fs.readFile(fullPath, "utf-8");
  return JSON.parse(file) as T;
};

// Function to seed a user
const seedUser = async (user: {
  username: string;
  password: string;
  deviceId: string;
}) => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      ...user,
      confirmPassword: user.password,
      consentAt: new Date(),
    });

  if (res.status !== 201) {
    console.error(`Failed to create user ${user.username}: ${res.text}`);
    throw new Error(`Failed to create user ${user.username}: ${res.text}`);
  }

  return res.body.accessToken;
};

// Function to seed a post
const seedPost = async (accessToken: string, post: any) => {
  const res = await request(app)
    .post("/api/blog/posts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send(post);

  if (res.status !== 201) {
    console.error(`Failed to create post: ${res.text}`);
    throw new Error(`Failed to create post: ${res.text}`);
  }

  if (!res.headers.location) {
    console.error("Post creation response does not contain location header.");
    throw new Error("Post creation response does not contain location header.");
  }

  const slug = res.headers.location.split("/").pop();

  const created = await prisma.post.findUniqueOrThrow({
    where: { slug: slug! },
    include: { PostTag: { include: { tag: true } }, author: true },
  });

  return created;
};

async function main() {
  const searchEngine = await searchFactory();
  // clear the database
  console.log("Resetting database...");
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await searchEngine.resetSearchEngine();
  console.log("All data cleared.");

  // create users
  const users = await readJson<any[]>("users.json");
  const accessTokens: string[] = [];
  for (const user of users) {
    accessTokens.push(await seedUser(user));
  }

  // Join the first user to admin group
  const admin = await request(app)
    .put("/api/auth/join-admin")
    .set("Authorization", `Bearer ${accessTokens[0]}`)
    .send({
      referenceCode: process.env.ADMIN_REF_CODE!,
      deviceId: users[0].deviceId,
    });

  if (admin.status !== 200) {
    console.error(`Failed to join admin group: ${admin.text}`);
    throw new Error(`Failed to join admin group: ${admin.text}`);
  }

  const adminToken = admin.body.accessToken;
  console.log("Demo users created.");

  // create posts
  console.log("Creating demo posts...");

  let postsRes: any[] = [];

  const posts = await readJson<any[]>("posts.json");
  for (let i = 0; i < 32; i++) {
    const p = i < posts.length ? posts[i] : { title: faker.lorem.sentence() };
    const markdown =
      i < posts.length
        ? await fs.readFile(
            path.resolve(`./script/seed/post${i + 1}.md`),
            "utf-8"
          )
        : faker.lorem.paragraphs(3);

    const coverUrl = `https://picsum.photos/1200/600?random=${i + 1}`;

    const tagStart = (i % 5) + 1;
    const tags: string[] = [];
    for (let t = tagStart; t <= 5; t++) {
      tags.push(`tag${t}`);
    }

    const daysAgo = i + 1;
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const post = {
      ...p,
      markdown,
      tags,
      coverUrl,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    };

    const postRes = await seedPost(adminToken, post);
    postsRes.push(postRes);
  }

  const postsToInsert = postsRes.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? "",
    markdown: post.markdown ?? "",
    cover: post.coverUrl,
    tags: post.PostTag.map((pt: any) => pt.tag.name),
    authorId: post.authorId,
    authorName: post.author.username,
    authorAvatar: post.author.avatar,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }));

  // Insert posts into search engine
  await searchEngine.insertPosts(postsToInsert, true);

  console.log("Demo posts created.");

  // create comments

  const postIdRes = await request(app).get(`/api/blog/posts/${postsRes[0].slug}`);
  if (postIdRes.status !== 200) {
    console.error(`Failed to get post ID: ${postIdRes.text}`);
    throw new Error(`Failed to get post ID: ${postIdRes.text}`);
  }
  const postId = postIdRes.body.id;
  console.log("Creating demo comments...");

  for (let i = 0; i < 21; i++) {
    const content = faker.lorem.sentences(faker.number.int({ min: 1, max: 3 }));

    const res = await request(app)
      .post("/api/blog/comments/")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        postId,
        content,
      });

    if (res.status !== 201) {
      console.error(`Failed to create comment: ${res.text}`);
      throw new Error(`Failed to create comment: ${res.text}`);
    }
  }
  console.log("Demo comments created.");

  process.env.SEED = "false";
}

main()
  .then(() => {
    console.log("Seed script finished!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed script failed:", err);
    process.exit(1);
  });
