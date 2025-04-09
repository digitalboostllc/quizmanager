# Migration `20250602000000_remove_word_usage`

This migration has been manually created to remove the deprecated WordUsage table.

## Changes

```diff
-model WordUsage {
-  id       String   @id @default(cuid())
-  userId   String
-  word     String
-  language String
-  isUsed   Boolean  @default(true)
-  usedAt   DateTime @default(now())
-  user     User     @relation("UserWordUsage", fields: [userId], references: [id], onDelete: Cascade)
-
-  @@unique([userId, word, language])
-  @@index([userId])
-  @@index([word])
-  @@index([language, isUsed])
-  @@index([userId, language, isUsed])
-  @@index([userId, language, usedAt])
-  @@index([usedAt])
-}
``` 