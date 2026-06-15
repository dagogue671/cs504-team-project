import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";

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

async function findUserByEmail(email) {
  await ensureUsersFile();
  const fileContents = await fs.readFile(usersFile, "utf8");
  const users = JSON.parse(fileContents || "[]");
  return users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
}

export async function POST(request) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email and password are required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid email or password." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const passwordHash = hashPassword(String(password));
  if (passwordHash !== user.passwordHash) {
    return new Response(JSON.stringify({ error: "Invalid email or password." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, userId: user.id, name: user.name }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
