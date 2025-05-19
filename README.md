# a_blog_backend_node

RESTful APIs built with **Node.js** and **Express** for a blog system.

## Getting Started

```bash
git clone https://github.com/danielxfeng/a_blog_backend_node.git backend_node
cd backend_node
npm install
# launch the db container
docker compose -f docker-compose.dev.yml up -d
npm run demo
```

## OpenAPI Documentation

Once running, visit:
[http://localhost:3000/api/docs](http://localhost:3000/api/docs)
to explore the available API endpoints.

## Demo Users

Test users are automatically added and reset on each server restart:
- demo_admin / DEMOpass123!
- demo_user1 / DEMOpass123!
- demo_user2 / DEMOpass123!

All data is temporary and reset when the server restarts.

## Todo List

- Some middlewares are required.
- Oauth related APIs need to be tested.
- The `/api/blog/posts/search` and `/api/blog/tags/search` endpoints require Elasticsearch, which is not deployed yet.