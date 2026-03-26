import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetJudgeAssignments(teamIds: string[]) {
  if (teamIds.length === 0) {
    console.log('No team IDs provided. Exiting.');
    return;
  }

  console.log(`Attempting to reset judge assignments for teams with IDs: ${teamIds.join(', ')}`);

  try {
    const updatedAssignments = await prisma.judgeAssignment.updateMany({
      where: {
        teamId: {
          in: teamIds,
        },
      },
      data: {
        status: 'SCHEDULED',
        score: null,
        scoreBreakdown: null,
      },
    });

    console.log(`Successfully reset ${updatedAssignments.count} judge assignments.`);
  } catch (error) {
    console.error('Error resetting judge assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: ts-node scripts/reset-judge-assignments.ts <teamId1> <teamId2> ...');
  process.exit(1);
}

resetJudgeAssignments(args);
