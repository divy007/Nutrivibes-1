Perfect! I understand completely. Let me give you a **focused, step-by-step approach for A1 (Authentication Setup)** that you can see working page by page. We'll use your folder structure and color theme.

## 🎨 Color Theme Reference
- **Primary Dark**: #1b4332 (dark green)
- **Light Cream**: #e9edc9 
- **Sage Green**: #ccd5ae

---

## 📝 A1: Authentication Setup - Step-by-Step Prompts

### **PHASE 1: Database & Basic Types** (See MongoDB connection working)

#### Prompt 1: Environment Variables Setup

**Manual Step - Create `.env.local` file in root:**

```env
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
NEXTAUTH_URL=http://localhost:3000
```

---

#### Prompt 2: TypeScript Types

**File:** `src/types/index.ts`

**Prompt to Copilot:**
```
Create TypeScript interfaces for authentication:

User interface:
- _id: string
- email: string
- password: string
- role: "DIETICIAN" | "CLIENT"
- name: string
- createdAt: Date
- updatedAt: Date

APIResponse generic interface:
- success: boolean
- message: string
- data?: T
- error?: string

AuthResponse interface:
- success: boolean
- message: string
- user?: Omit<User, 'password'>
- token?: string

Export all interfaces with TypeScript strict mode
```

---

#### Prompt 3: MongoDB Connection

**File:** `src/lib/mongodb.ts`

**Prompt to Copilot:**
```
Create MongoDB connection utility using mongoose:
- Read MONGODB_URI from environment variables
- Implement connection caching for Next.js serverless
- Export connectDB async function
- Add console.log for successful connection
- Handle errors with clear messages
- Use TypeScript with proper types
```

---

#### Prompt 4: User Model

**File:** `src/models/User.ts`

**Prompt to Copilot:**
```
Create Mongoose User schema with:

Fields:
- email: String, required, unique, lowercase
- password: String, required, minlength 6
- role: String, enum ["DIETICIAN", "CLIENT"], required
- name: String, required
- timestamps: true

Pre-save hook:
- Hash password with bcrypt (10 salt rounds) only if modified

Methods:
- comparePassword(candidatePassword): compare using bcrypt

Transform toJSON:
- Remove password and __v fields
- Transform _id to id

Export model with TypeScript
Handle "model already exists" error for Next.js hot reload
```

---

### **PHASE 2: Authentication API** (Test login API with Postman)

#### Prompt 5: Auth Utilities

**File:** `src/lib/auth.ts`

**Prompt to Copilot:**
```
Create authentication utility functions:

1. generateToken(user): 
   - Create JWT with { userId, email, role }
   - Use JWT_SECRET from env
   - Expire in 7 days
   - Return token string

2. verifyToken(token):
   - Verify JWT with JWT_SECRET
   - Return decoded payload or null
   - Handle errors gracefully

3. getAuthUser(request):
   - Extract token from Authorization header "Bearer <token>"
   - Verify token
   - Find user from database by userId
   - Return user without password or null

Use TypeScript with proper types
Import User model and jsonwebtoken
Export all functions
```

---

#### Prompt 6: Login API Route

**File:** `src/app/api/auth/login/route.ts`

**Prompt to Copilot:**
```
Create POST API route for login:

Request body validation (using zod):
- email: string, email format, required
- password: string, min 6 chars, required

Logic:
1. Connect to MongoDB
2. Find user by email (case-insensitive)
3. If not found, return 401 "Invalid credentials"
4. Compare password using user.comparePassword
5. If invalid, return 401 "Invalid credentials"
6. Generate JWT token
7. Return 200 with: { success: true, message: "Login successful", user (without password), token }

Error responses:
- 400: Validation error
- 401: Invalid credentials
- 500: Server error

Use NextResponse.json for responses
Use TypeScript
Export as POST
```

---

#### Prompt 7: Get Current User API

**File:** `src/app/api/auth/me/route.ts`

**Prompt to Copilot:**
```
Create GET API route to get authenticated user:

Logic:
1. Connect to MongoDB
2. Use getAuthUser helper to get user from token
3. If no user, return 401 "Not authenticated"
4. Return 200 with: { success: true, data: user }

Use TypeScript
Export as GET
Use getAuthUser from lib/auth
```

---

#### Prompt 8: Test the APIs

**Manual Step:**
```bash
npm run dev
```

Test with Thunder Client or Postman:
```
POST http://localhost:3000/api/auth/login
Body: {
  "email": "test@example.com",
  "password": "test123"
}
```

*Note: You'll need to manually create a test user in MongoDB first, or we'll create a seed script next.*

---

### **PHASE 3: Seed Data** (Create test user to login)

#### Prompt 9: Seed Script

**File:** `scripts/seedData.ts`

**Prompt to Copilot:**
```
Create a seed script to create test users:

Import:
- mongoose
- User model
- bcrypt for hashing

Create users:
1. Dietician:
   - email: "dietician@test.com"
   - password: "dietician123" (hash it)
   - role: "DIETICIAN"
   - name: "Dr. Mansi Anajwala"

2. Client:
   - email: "client@test.com"
   - password: "client123" (hash it)
   - role: "CLIENT"
   - name: "Test Client"

Logic:
- Connect to MongoDB
- Check if users exist before creating
- Hash passwords
- Create users
- Log success messages
- Close connection

Use TypeScript
Add error handling
```

**Add to package.json:**
```json
"scripts": {
  "seed": "tsx scripts/seedData.ts"
}
```

**Run it:**
```bash
npm install -D tsx
npm run seed
```

---

### **PHASE 4: Login UI** (See login page working)

#### Prompt 10: API Client Utility

**File:** `src/lib/api-client.ts`

**Prompt to Copilot:**
```
Create client-side API utility:

Functions:
1. setAuthToken(token): save to localStorage as "auth_token"
2. getAuthToken(): get from localStorage
3. clearAuthToken(): remove from localStorage

4. apiRequest<T>(endpoint, options):
   - Use fetch API
   - Add Authorization header if token exists
   - Add Content-Type: application/json
   - Parse JSON response
   - Return typed response
   - Handle errors

5. Helper methods:
   - get<T>(endpoint)
   - post<T>(endpoint, data)
   - patch<T>(endpoint, data)
   - del<T>(endpoint)

Use TypeScript with generics
Client-side only (check typeof window)
Export all functions
```

---

#### Prompt 11: Login Form Component

**File:** `src/components/auth/LoginForm.tsx`

**Prompt to Copilot:**
```
Create LoginForm component with modern design:

State:
- email: string
- password: string
- loading: boolean
- error: string | null
- showPassword: boolean

UI using color theme (#1b4332, #e9edc9, #ccd5ae):
- Container: max-w-md, white bg, rounded-xl, shadow-2xl, p-8
- Title: "Welcome Back" (text-2xl, font-bold, color #1b4332)
- Subtitle: "Sign in to continue"
- Email input:
  * Label with Mail icon
  * Input with border, focus ring color #1b4332
  * Full width, rounded-lg
- Password input:
  * Label with Lock icon
  * Show/hide toggle (Eye/EyeOff icons)
  * Same styling as email
- Submit button:
  * Text: "Sign In"
  * Background: #1b4332
  * Text: white
  * Full width, rounded-lg
  * Disabled state when loading
  * Loading spinner when submitting
- Error alert:
  * Light red background
  * Error message
  * AlertCircle icon

Functionality:
- Validate email format on blur
- Submit calls POST /api/auth/login
- On success:
  * Save token using setAuthToken
  * Redirect to /dietician/dashboard if DIETICIAN
  * Redirect to /client/profile if CLIENT
- On error: show error message
- Clear error on input change

Use Tailwind CSS with theme colors
Icons from lucide-react
TypeScript with prop types
Use Next.js useRouter
Import apiRequest, setAuthToken from lib/api-client
Export as default
```

---

#### Prompt 12: Auth Layout

**File:** `src/app/(auth)/layout.tsx`

**Prompt to Copilot:**
```
Create centered layout for auth pages:

Layout:
- Full screen height (min-h-screen)
- Background gradient using theme colors:
  * From #1b4332 to #ccd5ae
  * Or use #e9edc9 solid with subtle pattern
- Center content vertically and horizontally
- Children rendered in center

Styling:
- Use Tailwind CSS
- flex layout for centering
- Background uses theme colors

Export as default layout
Use TypeScript
```

---

#### Prompt 13: Login Page

**File:** `src/app/(auth)/login/page.tsx`

**Prompt to Copilot:**
```
Create login page:

Features:
- Render LoginForm component
- Check if already authenticated on mount:
  * Get token from localStorage
  * If exists, redirect to appropriate dashboard
- Show loading state while checking

Layout:
- Centered layout (parent layout handles this)
- Optional: Add logo or app name above form

Metadata:
- Title: "Login | Diet Planner"

Use 'use client' directive
Use TypeScript
Export as default
```

---

### **PHASE 5: Test Login** (You should now see and test the login page!)

**Manual Steps:**

1. Start dev server:
```bash
npm run dev
```

2. Open browser: `http://localhost:3000/login`

3. Try logging in with:
   - Email: `dietician@test.com`
   - Password: `dietician123`

4. You should see the token saved and be redirected (even if dashboard page doesn't exist yet, URL should change)

---

## ✅ Phase 1 Completion Checklist

- [ ] MongoDB Atlas setup complete
- [ ] Environment variables configured
- [ ] All dependencies installed
- [ ] Types defined (`src/types/index.ts`)
- [ ] MongoDB connection working (`src/lib/mongodb.ts`)
- [ ] User model created (`src/models/User.ts`)
- [ ] Auth utilities created (`src/lib/auth.ts`)
- [ ] Login API working (`src/app/api/auth/login/route.ts`)
- [ ] Me API working (`src/app/api/auth/me/route.ts`)
- [ ] Seed script run successfully
- [ ] API client utility created (`src/lib/api-client.ts`)
- [ ] Login form component created
- [ ] Auth layout created
- [ ] Login page created
- [ ] Can successfully login and see token in localStorage

---

## 🎯 What You'll See After This Phase

1. ✅ A beautiful login page with your color theme
2. ✅ Working login functionality
3. ✅ Token stored in localStorage
4. ✅ URL redirects after login (even if target page doesn't exist yet)

---

**Once you complete this phase and confirm everything works, let me know and I'll give you the next steps for:**
- Route protection (middleware)
- Dietician dashboard layout with sidebar
- Client layout
- Role-based access control

**Ready to start? Begin with Prompt 1 (Environment Variables) and work through them in order!** 🚀