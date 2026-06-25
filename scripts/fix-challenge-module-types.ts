/**
 * Script to fix moduleType and other missing fields for existing challenges
 * Run with: npx tsx scripts/fix-challenge-module-types.ts
 */

import 'dotenv/config';
import prisma from '../src/prisma';

async function fixChallengeFields() {
  console.log('Starting to fix challenge fields...\n');

  try {
    // Get all challenges
    const allChallenges = await prisma.challenge.findMany({
      select: {
        id: true,
        name: true,
        moduleType: true,
        challengeType: true,
        targetValue: true,
        targetUnit: true,
        requiresJournaling: true,
        requiresMeditation: true,
        requiresMusic: true,
        requiresPsychoeducation: true
      }
    });

    console.log(`Found ${allChallenges.length} total challenges\n`);

    let fixedCount = 0;

    // Update each challenge
    for (const challenge of allChallenges) {
      const updates: any = {};
      let needsUpdate = false;

      // Fix moduleType if NULL
      if (!challenge.moduleType) {
        if (challenge.requiresJournaling) {
          updates.moduleType = 'JOURNALING';
        } else if (challenge.requiresMeditation) {
          updates.moduleType = 'MEDITATION';
        } else if (challenge.requiresMusic) {
          updates.moduleType = 'MUSIC';
        } else if (challenge.requiresPsychoeducation) {
          updates.moduleType = 'ARTICLE';
        }
        if (updates.moduleType) needsUpdate = true;
      }

      // Fix challengeType if NULL (default to DAILY)
      if (!challenge.challengeType) {
        updates.challengeType = 'DAILY';
        needsUpdate = true;
      }

      // Fix targetUnit if NULL
      if (!challenge.targetUnit) {
        if (challenge.requiresMeditation || challenge.requiresMusic) {
          updates.targetUnit = 'MINUTES';
          updates.targetValue = updates.targetValue || 10;
        } else if (challenge.requiresJournaling) {
          updates.targetUnit = 'ENTRIES';
          updates.targetValue = updates.targetValue || 1;
        } else if (challenge.requiresPsychoeducation) {
          updates.targetUnit = 'ARTICLES';
          updates.targetValue = updates.targetValue || 1;
        }
        needsUpdate = true;
      }

      // Fix targetValue if NULL
      if (!challenge.targetValue && updates.targetUnit) {
        updates.targetValue = 1; // Default to 1
        needsUpdate = true;
      }

      if (needsUpdate) {
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: updates
        });
        console.log(`✓ Updated challenge "${challenge.name}":`, updates);
        fixedCount++;
      } else {
        console.log(`- Challenge "${challenge.name}" is already correct`);
      }
    }

    console.log(`\n✓ Migration complete. Fixed ${fixedCount} challenges`);

  } catch (error) {
    console.error('Error fixing challenge fields:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixChallengeFields()
  .then(() => {
    console.log('\n✓ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Script failed:', error);
    process.exit(1);
  });
