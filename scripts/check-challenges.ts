import 'dotenv/config';
import prisma from '../src/prisma';

async function checkChallenges() {
  try {
    const challengeId = 'cd8493bb-ad85-48fd-8b12-1722db2b0506'; // Latest challenge from console
    
    // Get challenge with its user challenges
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        userChallenges: {
          select: {
            id: true,
            userId: true,
            status: true,
            currentProgress: true,
            progressPercentage: true,
            startedAt: true,
            completedAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        _count: {
          select: {
            userChallenges: true
          }
        }
      }
    });
    
    console.log('Challenge:', challenge?.name);
    console.log('Total UserChallenges (_count):', challenge?._count?.userChallenges);
    console.log('Total UserChallenges (array):', challenge?.userChallenges.length);
    console.log('\nUserChallenges:');
    challenge?.userChallenges.forEach(uc => {
      console.log(`- ${uc.user.firstName} ${uc.user.lastName}: ${uc.status} (Progress: ${uc.currentProgress}, ${uc.progressPercentage}%)`);
    });
    
    // Count by status
    const assigned = challenge?.userChallenges.filter(uc => uc.status === 'ASSIGNED').length || 0;
    const inProgress = challenge?.userChallenges.filter(uc => uc.status === 'IN_PROGRESS').length || 0;
    const completed = challenge?.userChallenges.filter(uc => uc.status === 'COMPLETED').length || 0;
    
    console.log('\nStats by Status:');
    console.log('Assigned:', assigned);
    console.log('In Progress:', inProgress);
    console.log('Completed:', completed);
    
    // Calculate progress bar percentage
    const totalAssigned = challenge?._count?.userChallenges || 0;
    const completedCount = completed;
    const progressPercentage = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;
    
    console.log('\nProgress Bar Calculation:');
    console.log('Total Assigned:', totalAssigned);
    console.log('Completed Count:', completedCount);
    console.log('Progress Percentage:', progressPercentage + '%');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkChallenges();
