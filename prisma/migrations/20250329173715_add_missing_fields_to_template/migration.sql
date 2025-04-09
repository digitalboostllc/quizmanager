-- Add userId, planId, isPublic, and previewImageUrl fields to Template table
-- Step 1: Find a default user to associate with existing templates
-- This assumes you have at least one user in the database
CREATE OR REPLACE FUNCTION get_default_user_id() RETURNS TEXT AS $$
DECLARE
    default_user_id TEXT;
BEGIN
    SELECT id INTO default_user_id FROM "User" LIMIT 1;
    RETURN default_user_id;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Add the fields to the table
ALTER TABLE "Template" 
ADD COLUMN "userId" TEXT,
ADD COLUMN "planId" TEXT NULL,
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "previewImageUrl" TEXT NULL;

-- Step 3: Set the default user for existing templates
UPDATE "Template" SET "userId" = get_default_user_id() WHERE "userId" IS NULL;

-- Step 4: Once all records have a userId, make it NOT NULL
ALTER TABLE "Template" ALTER COLUMN "userId" SET NOT NULL;

-- Step 5: Create indexes for the foreign key relationships
CREATE INDEX "Template_userId_idx" ON "Template"("userId");
CREATE INDEX "Template_planId_idx" ON "Template"("planId");
CREATE INDEX "Template_isPublic_idx" ON "Template"("isPublic");

-- Step 6: Clean up the function
DROP FUNCTION get_default_user_id(); 