/**
 * Script to clean up all challenge-related data from the database
 * Run with: npx tsx scripts/cleanup-challenges.ts
 * 
 * This will delete:
 * - All UserChallenges (student challenge assignments and progress)
 * - All ChallengeAssignments
 * - All ActivityEvents related to challenges
 * - All Challenges
 */

import 'dotenv/config';
import prisma from '../src/prisma';

async function cleanupChallenges() {
  console.log('Starting challenge cleanup...\n');

  try {
    // Delete in order to respect foreign key constraints
    
    // 1. Delete ActivityEvents related to challenges
    const activityEventsCount = await prisma.activityEvent.deleteMany({
      where: {
        challengeId: {
          not: null
        }
      }
    });
    console.log(`✓ Deleted ${activityEventsCount.count} activity events`);

    // 2. Delete all UserChallenges (student progress)
    const userChallengesCount = await prisma.userChallenge.deleteMany({});
    console.log(`✓ Deleted ${userChallengesCount.count} user challenges`);

    // 3. Delete all ChallengeAssignments
    const challengeAssignmentsCount = await prisma.challengeAssignment.deleteMany({});
    console.log(`✓ Deleted ${challengeAssignmentsCount.count} challenge assignments`);

    // 4. Delete all Challenges
    const challengesCount = await prisma.challenge.deleteMany({});
    console.log(`✓ Deleted ${challengesCount.count} challenges`);

    console.log('\n✓ Challenge cleanup completed successfully!');
    console.log('\nDatabase is now clean and ready for fresh testing.');

  } catch (error) {
    console.error('Error cleaning up challenges:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
cleanupChallenges()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Script failed:', error);
    process.exit(1);
  });
