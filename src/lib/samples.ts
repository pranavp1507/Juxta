export const SAMPLES = {
  code: {
    name: 'Source Code (TypeScript/JS)',
    left: `/**
 * Simple user manager service.
 * Created on 2026-06-15.
 */
class UserService {
  private users: string[] = ["Admin", "Alice", "Charlie"];

  public async findUser(id: number): Promise<string | null> {
    console.log("Locating user in database for id: " + id);
    if (this.users[id]) {
      return this.users[id];
    }
    return null;
  }

  public deleteUser(id: number): boolean {
    if (id < this.users.length) {
      this.users.splice(id, 1);
      return true;
    }
    return false;
  }
}`,
    right: `/**
 * Premium user manager system.
 * Updated: 2026-06-18.
 */
class UserManagementService {
  private users: string[] = ["SuperAdmin", "Alice", "Bob", "Charlie"];

  public async findUser(userId: number): Promise<string | null> {
    console.log(\`Searching database for user ID: \${userId}\`);
    if (this.users[userId]) {
      return this.users[userId];
    }
    return null;
  }

  public removeUser(userId: number): boolean {
    if (userId >= 0 && userId < this.users.length) {
      this.users.splice(userId, 1);
      return true;
    }
    return false;
  }
}`
  },
  prose: {
    name: 'Editorial Prose (English)',
    left: `The revolutionary invention of the printing press during the medieval period catalyzed a dramatic shift in human communication and literature. Prior to Gutenberg, books were meticulously hand-written by dedicated scribes, which was incredibly slow and highly expensive. This restricted access to knowledge exclusively to the nobility and wealthy monasteries. Consequently, literacy levels globally remained low for centuries. However, the introduction of movable type fundamentally democratized information, sparking the massive intellectual explosion known as the Renaissance.`,
    right: `The majestic invention of the movable-type printing press during the fifteenth century caused a dramatic paradigm shift in human communication and global literacy. Before Johannes Gutenberg, books were painstakingly hand-copied by monastic scribes, an effort that was notoriously slow and highly expensive. This restricted information access almost exclusively to the rich nobility and clerical elite. Consequently, public literacy levels remained low for generations. The rapid spread of cheap printed books democratized knowledge, directly fueling the intellectual explosion of the European Renaissance.`
  },
  html: {
    name: 'HTML Document',
    left: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Old Dashboard</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="header bg-slate-100">
    <h1>Welcome to the Old System</h1>
    <p>Status: Active</p>
  </header>
  <main class="content">
    <div id="user-profile">
      <h3>John Doe</h3>
      <button class="btn btn-primary" onclick="alert('Hello')">View Profile</button>
    </div>
  </main>
</body>
</html>`,
    right: `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Analytics Dashboard</title>
  <link rel="stylesheet" href="dist/output.css">
</head>
<body class="bg-zinc-950 text-zinc-550 antialiased">
  <header class="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
    <h1 class="text-xl font-bold font-sans">Analytics Hub</h1>
    <span class="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded-full">Live</span>
  </header>
  <main class="p-8 max-w-7xl mx-auto space-y-6">
    <div id="user-profile-v2" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
        <h3 class="font-semibold text-zinc-200">Administrator</h3>
        <p class="text-sm text-zinc-400">Pranav Lighthouse</p>
      </div>
      <button class="btn-modern-indigo" onclick="openProfile('admin')">Manage Account</button>
    </div>
  </main>
</body>
</html>`
  },
  css: {
    name: 'CSS Stylesheet',
    left: `.card {
  background: white;
  border: 1px solid #ddd;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.btn {
  background-color: #3b82f6;
  color: white;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
}

.btn:hover {
  background-color: #2563eb;
}`,
    right: `.card-modern {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  margin-bottom: 24px;
  border-radius: 12px;
  backdrop-filter: blur(12px);
  transition: all 0.2s ease-in-out;
}

.btn-indigo {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.btn-indigo:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
}`
  },
  json: {
    name: 'JSON Configuration',
    left: `{
  "name": "metadata-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0"
  },
  "features": {
    "darkMode": false,
    "experimentalApi": true
  }
}`,
    right: `{
  "name": "metadata-app-premium",
  "version": "1.2.0",
  "private": true,
  "dependencies": {
    "express": "^4.20.0",
    "react": "^19.0.0",
    "lucide-react": "^0.400.0"
  },
  "features": {
    "darkMode": true,
    "experimentalApi": false,
    "collaborationMode": true
  }
}`
  }
};

export type SampleKey = keyof typeof SAMPLES;
