import { db } from "./index";
import { usersTable } from "./schema";
import { eq, like } from "drizzle-orm";
import { clerkClient } from "@clerk/express";

/**
 * Script to fix existing users with placeholder emails (@noemail.jobquest)
 * by fetching their real email from Clerk API and updating the database.
 */
async function fixPlaceholderEmails() {
  try {
    console.log("Starting to fix placeholder emails...");

    // Find all users with placeholder email pattern
    const placeholderUsers = await db
      .select({
        id: usersTable.id,
        clerkId: usersTable.clerkId,
        email: usersTable.email,
        name: usersTable.name,
      })
      .from(usersTable)
      // Using SQL LIKE to find emails ending with @noemail.jobquest
      // Note: This is a simplified check - in practice, we'd want to be more precise
      // but for now we'll use a basic pattern match
      .where(like(usersTable.email, '%@noemail.jobquest'));

    console.log(`Found ${placeholderUsers.length} users with placeholder emails`);

    for (const user of placeholderUsers) {
      try {
        console.log(`Processing user ${user.clerkId} (ID: ${user.id})...`);

        // Fetch the user from Clerk to get their real email
        const clerkUser = await clerkClient.users.getUser(user.clerkId);

        // Get the primary email address
        const primaryEmailId = clerkUser.primaryEmailAddressId;
        const emailObj = clerkUser.emailAddresses.find(
          (email: { id: string }) => email.id === primaryEmailId
        );

        if (!emailObj) {
          console.warn(`No email address found for clerk user ${user.clerkId}`);
          continue;
        }

        const email = emailObj.emailAddress;
        const firstName = clerkUser.firstName ?? "";
        const lastName = clerkUser.lastName ?? "";
        const name = `${firstName} ${lastName}`.trim() || null;

        if (!email || email.includes('@noemail.jobquest')) {
          console.warn(`Clerk user ${user.clerkId} still has invalid or placeholder email: ${email}`);
          continue;
        }

        // Update the user in our database
        await db
          .update(usersTable)
          .set({
            email,
            name: name ?? user.name // Only update name if we have one, otherwise keep existing
          })
          .where(eq(usersTable.id, user.id));

        console.log(`Updated user ${user.clerkId} with email: ${email}`);
      } catch (err) {
        console.error(`Failed to process user ${user.clerkId}:`, err);
        // Continue with other users even if one fails
      }
    }

    console.log("Finished fixing placeholder emails");
  } catch (err) {
    console.error("Failed to fix placeholder emails:", err);
    process.exit(1);
  }
}

// Run the function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixPlaceholderEmails().then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  }).catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
  });
}

export default fixPlaceholderEmails;