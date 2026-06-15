import { promises as fs } from "fs";
import path from "path";
import { createHash, randomUUID } from "crypto";

const dataDir = path.join(process.cwd(), "data");
const usersFile = path.join(dataDir, "users.json");

async function ensureUsersFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(usersFile);
  } catch {
    await fs.writeFile(usersFile, "[]", "utf8");
  }
}

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

async function saveUser(user) {
  await ensureUsersFile();
  const fileContents = await fs.readFile(usersFile, "utf8");
  const users = JSON.parse(fileContents || "[]");
  users.push(user);
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), "utf8");
}

export async function POST(request) {
  const body = await request.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return new Response(JSON.stringify({ error: "Name, email, and password are required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof password !== "string" || password.length < 8) {
    return new Response(JSON.stringify({ error: "Password must be at least 8 characters." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = {
    id: randomUUID(),
    name: String(name),
    email: String(email),
    passwordHash: hashPassword(String(password)),
    createdAt: new Date().toISOString(),
  };

  await saveUser(user);

  return new Response(JSON.stringify({ success: true, userId: user.id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
