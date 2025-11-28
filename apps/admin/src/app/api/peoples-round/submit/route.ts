import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { handleApiError } from '@/lib/api-error';
import { prisma } from '@schoolquiz/db';

interface SubmissionRequest {
  quizSlug: string;
  organisationId?: string;
  organisationName?: string;
  schoolName?: string;
  teacherName: string;
  wantsShoutout: boolean;
  color1?: string;
  color2?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiAuth();

    // Check if user is premium
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tier: true, subscriptionStatus: true },
    });

    if (userData?.tier !== 'premium' || (userData?.subscriptionStatus !== 'ACTIVE' && userData?.subscriptionStatus !== 'TRIALING')) {
      return NextResponse.json(
        { error: 'Only premium users can submit to The People\'s Round' },
        { status: 403 }
      );
    }

    const body: SubmissionRequest = await request.json();
    const { quizSlug, organisationId, organisationName, schoolName, teacherName, wantsShoutout, color1, color2 } = body;

    // Validate required fields
    if (!quizSlug || !teacherName) {
      return NextResponse.json(
        { error: 'Quiz slug and teacher name are required' },
        { status: 400 }
      );
    }

    if (!organisationName && !schoolName) {
      return NextResponse.json(
        { error: 'Either organisation name or school name is required' },
        { status: 400 }
      );
    }

    if (wantsShoutout && (!color1 || !color2)) {
      return NextResponse.json(
        { error: 'Both colors are required when shoutout is enabled' },
        { status: 400 }
      );
    }

    // Find the quiz
    const quiz = await prisma.quiz.findUnique({
      where: { slug: quizSlug },
      include: {
        rounds: {
          where: { isPeoplesRound: true },
          include: {
            questions: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Get the People's Round question (should be question 25)
    const peoplesRound = quiz.rounds.find(r => r.isPeoplesRound);
    if (!peoplesRound || peoplesRound.questions.length === 0) {
      return NextResponse.json(
        { error: 'People\'s Round question not found in this quiz' },
        { status: 404 }
      );
    }

    const peoplesQuestion = peoplesRound.questions[0]?.question;
    if (!peoplesQuestion) {
      return NextResponse.json(
        { error: 'People\'s Round question not found' },
        { status: 404 }
      );
    }

    // Create or update submission
    // Store submission metadata in a JSON field or create a new model
    // For now, we'll create a UserQuestionSubmission with metadata
    const submissionData: any = {
      userId: user.id,
      question: peoplesQuestion.text,
      answer: peoplesQuestion.answer,
      explanation: peoplesQuestion.explanation || null,
      teacherName,
      schoolName: organisationName || schoolName,
      consentForShoutout: wantsShoutout,
      status: 'PENDING',
      category: 'People\'s Round',
      // Store additional metadata in notes field as JSON (temporary solution)
      notes: JSON.stringify({
        quizSlug,
        organisationId,
        organisationName,
        schoolName,
        color1: wantsShoutout ? color1 : undefined,
        color2: wantsShoutout ? color2 : undefined,
        submissionType: 'peoples_round_quiz',
      }),
    };

    const submission = await prisma.userQuestionSubmission.create({
      data: submissionData,
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: 'Your submission has been received and will be reviewed.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}

