# Project Context: Social Network Final Project

**Role:** Expert Full-Stack Developer (Node.js/React/TypeScript)
**Context:** Academic Final Project (Colman)
**Team Structure:** 2 Developers (Split by Vertical Slicing)

---

## 1. Technical Stack & Constraints

* **Backend:** Node.js, Express, TypeScript.
* **Frontend:** React, Vite, TypeScript, Tailwind CSS.
* **Database:** MongoDB (Local Docker Container). **Strictly NO Cloud/Atlas.**
* **Auth:** JWT (Access + Refresh Tokens) + Google OAuth.
* **AI Integration:** Google Gemini API (`google-generative-ai`).
* **File Storage:** Local server storage (`public/uploads`). **No Cloudinary/S3.**
* **Testing:** Jest (Unit tests for all API endpoints).
* **Documentation:** Swagger (OpenAPI).

---

## 2. Database Schema (Mongoose)

The app relies on 3 main collections.

### Users
```typescript
{
  _id: ObjectId,
  email: String (Unique, Required),
  password: String (Bcrypt hash, optional if OAuth),
  username: String (Required),
  profilePicUrl: String (Local path),
  refreshTokens: [String], // For session management
  googleId: String, // For OAuth
}
```

### Posts
Note: Includes Text Index for AI Search.

```typeScript
{
  _id: ObjectId,
  authorId: ObjectId (Ref: User),
  content: String, // Indexed: 'text'
  title: String,   // Indexed: 'text'
  imageUrl: String (Local path),
  likes: [ObjectId], // Array of User IDs
  commentsCount: Number (Default: 0),
  createdAt: Date
}
// Index Definition: postSchema.index({ title: 'text', content: 'text' });
```

## Comments
```typeScript
{
  _id: ObjectId,
  postId: ObjectId (Ref: Post),
  authorId: ObjectId (Ref: User),
  content: String,
  createdAt: Date
}
```

## 3. Developer Missions (Work Division)
### Developer 1: Auth, Profile, & AI Infrastructure
1. Auth System:
- Register/Login (Local + Google OAuth).
- JWT Middleware (Verify Access Token).
- Token Refresh mechanism.
- Logout (Remove refresh token).

### User Profile
*   **GET** `/user/:id`: View profile details + User's posts.
*   **PUT** `/user/:id`: Edit username & upload new profile picture (Local multer storage).
*   **Constraint:** Cannot edit email/password.

### AI Smart Search (The "Keyword Extraction" Architecture)
*   **Goal:** Allow natural language search without Vector DB.
*   **Flow:** User Query -> Gemini API -> Extract Keywords -> MongoDB Text Search.
*   **Prompt Logic:** "Convert '${query}' into 5-10 related keywords for database search."

### Developer 2: Feed, Interaction & Logic
#### Feed System
*   **GET** `/posts`: Pagination support (not loading all at once).
*   **POST** `/posts`: Create post with Text + Image (Local upload).

#### Interactions
*   **Likes:** Toggle logic using `$addToSet` and `$pull` (Atomic operations).
*   **Comments:** Store in separate collection. Update `commentsCount` on Post using `$inc`.
*   **UI:** Feed shows only comment count. Clicking opens a detailed view/modal for actual comments.

## 4. Specific AI Implementation Details
*   **Feature:** Semantic Search via Query Expansion.
*   **Reasoning:** Local MongoDB container lacks `$vectorSearch`.

### The Service (`services/aiService.ts`)
*   **Input:** User's raw search string (e.g., "Where can I eat vegan food?").
*   **Gemini Action:** Generates a list of keywords (e.g., "vegan restaurant vegetable salad healthy").
*   **Output:** Returns string to Controller.

### The Controller (`controllers/searchController.ts`)
*   **Receives keywords.**
*   **Executes:** `Post.find({ $text: { $search: aiGeneratedKeywords } })`.
*   **Returns:** List of matching posts.

## 5. UI/UX Guidelines
*   **Vibe:** Social, Human Connection, Lifestyle (Not "Server/Tech" aesthetic).

### Components
*   **Feed:** Infinite scroll or Load More button.
*   **Post Card:** Shows Author, Image, Content, Like Button (with count), Comment Button (with count).
*   **Profile:** Header with Avatar, Grid of user's posts below.

## 6. Definition of Done (DoD) Checklist
*   [ ] Code is in TypeScript.
*   [ ] Images are saved locally to public/uploads.
*   [ ] API has Swagger documentation.
*   [ ] API has Jest unit tests.
*   [ ] No keys committed to Git (use `.env`).