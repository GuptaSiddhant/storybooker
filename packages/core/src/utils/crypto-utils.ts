import crypto from "node:crypto";

const ALGORITHM = "aes-256-cbc";
const RANDOM_IV = crypto.randomBytes(16);

export function encrypt(secret: string, data: string): string {
  const key = crypto.createHash("sha512").update(secret).digest("hex").slice(0, 32);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key), RANDOM_IV);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Package the IV and encrypted data together so it can be stored in a single
  // column in the database.
  return RANDOM_IV.toString("hex") + encrypted;
}

export function decrypt(secret: string, encryptedData: string): string {
  const key = crypto.createHash("sha512").update(secret).digest("hex").slice(0, 32);

  // Unpackage the combined iv + encrypted message. Since we are using a fixed
  // size IV, we can hard code the slice length.
  const inputIV = encryptedData.slice(0, 32);
  const encrypted = encryptedData.slice(32);
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(key),
    Buffer.from(inputIV, "hex"),
  );

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function generateHMAC(secret: string, data: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}
