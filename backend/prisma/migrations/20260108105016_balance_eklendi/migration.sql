/*
  Warnings:

  - You are about to alter the column `price` on the `ItemPackage` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.

*/
-- AlterTable
ALTER TABLE "App" ADD COLUMN "imageUrl" TEXT;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ItemPackage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "appId" INTEGER NOT NULL,
    CONSTRAINT "ItemPackage_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ItemPackage" ("appId", "description", "id", "name", "price") SELECT "appId", "description", "id", "name", "price" FROM "ItemPackage";
DROP TABLE "ItemPackage";
ALTER TABLE "new_ItemPackage" RENAME TO "ItemPackage";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 100.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "password", "username") SELECT "createdAt", "email", "id", "password", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
