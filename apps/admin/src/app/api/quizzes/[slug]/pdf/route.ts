import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { canAccessFeature } from '@/lib/feature-gating';

// Mock quiz data - in production, this would fetch from database
const QUIZ_DATA: Record<string, { questions: any[]; rounds: any[] }> = {
	"12": {
		rounds: [
			{ number: 1, title: "Shape Up", blurb: "Time to get in shape! Questions about forms, figures, and geometry." },
			{ number: 2, title: "Pumpkins", blurb: "Orange you glad? All about the beloved autumn squash." },
			{ number: 3, title: "Famous First Words", blurb: "How well do you know these iconic opening lines?" },
			{ number: 4, title: "Crazes", blurb: "Remember these trends that swept the world?" },
			{ number: 5, title: "Next In Sequence", blurb: "Can you spot the pattern and predict what comes next?" },
		],
		questions: [
			{ id: 1, roundNumber: 1, question: "What colour is directly opposite purple on a traditional RYB colour wheel?", answer: "Yellow", submittedBy: "Miss Shannon, Loretto Kiribilli NSW", submissionDisplayStyle: "full" },
			{ id: 2, roundNumber: 1, question: "In literature, what word is the opposite of a prologue?", answer: "Epilogue" },
			{ id: 3, roundNumber: 1, question: "The antipode (direct opposite point of the earth) to Auckland, New Zealand lies in the southern region of which European country: France, Spain, or Germany?", answer: "Spain", submittedBy: "Steve G", submissionDisplayStyle: "first_name" },
			{ id: 4, roundNumber: 1, question: "When used to refer to moon phases, what verb is the opposite of \"to wax\"?", answer: "To wane" },
			{ id: 5, roundNumber: 1, question: "On 3 December 2007, who became the first of the three federal Opposition leaders during Kevin Rudd's time as Prime Minister?", answer: "Brendan Nelson" },
			{ id: 6, roundNumber: 1, question: "What is the geometric term for a shape with eight sides?", answer: "Octagon" },
			{ id: 7, roundNumber: 2, question: "In which hemisphere are pumpkins native?", answer: "Western Hemisphere (North America)" },
			{ id: 8, roundNumber: 2, question: "What pigment gives pumpkins their orange color?", answer: "Beta-carotene" },
			{ id: 9, roundNumber: 2, question: "Which US state produces the most pumpkins?", answer: "Illinois" },
			{ id: 10, roundNumber: 2, question: "What is a male pumpkin flower called?", answer: "Stamen" },
			{ id: 11, roundNumber: 2, question: "Pumpkins are 90% made of what?", answer: "Water", submittedBy: "Year 9 St Augustine's College", submissionDisplayStyle: "full" },
			{ id: 12, roundNumber: 2, question: "What is the largest pumpkin ever recorded?", answer: "Over 2,700 pounds" },
			{ id: 13, roundNumber: 3, question: "Which novel begins with 'Call me Ishmael'?", answer: "Moby-Dick" },
			{ id: 14, roundNumber: 3, question: "'It was the best of times, it was the worst of times' opens which novel?", answer: "A Tale of Two Cities" },
			{ id: 15, roundNumber: 3, question: "Which book starts with 'In a hole in the ground there lived a hobbit'?", answer: "The Hobbit" },
			{ id: 16, roundNumber: 3, question: "'It is a truth universally acknowledged' starts which Jane Austen novel?", answer: "Pride and Prejudice" },
			{ id: 17, roundNumber: 3, question: "Which dystopian novel begins with 'It was a bright cold day in April'?", answer: "1984" },
			{ id: 18, roundNumber: 3, question: "What novel starts with 'It was a pleasure to burn'?", answer: "Fahrenheit 451" },
			{ id: 19, roundNumber: 4, question: "What toy craze involved small beanbag animals?", answer: "Beanie Babies" },
			{ id: 20, roundNumber: 4, question: "Which dance craze involved a horse-riding motion?", answer: "Gangnam Style" },
			{ id: 21, roundNumber: 4, question: "What fidget toy became wildly popular in 2017?", answer: "Fidget Spinner" },
			{ id: 22, roundNumber: 4, question: "Which 1970s craze involved a plastic hoop?", answer: "Hula Hoop" },
			{ id: 23, roundNumber: 4, question: "What virtual pet on a keychain was a 1990s phenomenon?", answer: "Tamagotchi" },
			{ id: 24, roundNumber: 4, question: "What social media app became a craze in 2020?", answer: "TikTok" },
			{ id: 25, roundNumber: 5, question: "Complete the sequence: 2, 4, 8, 16, __?", answer: "32" },
		]
	},
	// Add more quiz data as needed
};

const QUIZ_INFO: Record<string, { title: string; weekISO: string }> = {
	"12": { title: "Shape Up, Pumpkins, Famous First Words, Crazes, and Next In Sequence.", weekISO: "2024-01-15" },
	// Add more quiz info as needed
};

async function getUserTier(request: NextRequest): Promise<string | null> {
	const authToken = request.headers.get('Authorization')?.replace('Bearer ', '');
	const userId = request.headers.get('X-User-Id');

	if (!authToken || !userId) {
		return null;
	}

	try {
		// Fetch user subscription/tier from API
		const baseUrl = request.nextUrl.origin;
		const response = await fetch(`${baseUrl}/api/user/subscription`, {
			headers: {
				Authorization: `Bearer ${authToken}`,
				'X-User-Id': userId,
			},
		});

		if (response.ok) {
			const data = await response.json();
			const premiumStatuses = ['ACTIVE', 'TRIALING', 'FREE_TRIAL'];
			const isPremium = 
				data.tier === 'premium' ||
				premiumStatuses.includes(data.status) ||
				(data.freeTrialUntil && new Date(data.freeTrialUntil) > new Date());
			
			return isPremium ? 'premium' : 'basic';
		}
	} catch (error) {
		console.error('Error fetching user tier:', error);
	}

	return null;
}

function generatePDF(quizSlug: string, quizTitle: string, quizData: { questions: any[]; rounds: any[] }): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({
			margin: 50,
			size: 'A4',
		});

		const chunks: Buffer[] = [];

		doc.on('data', (chunk) => {
			chunks.push(chunk);
		});

		doc.on('end', () => {
			resolve(Buffer.concat(chunks));
		});

		doc.on('error', reject);

		// Header
		doc.fontSize(24)
			.font('Helvetica-Bold')
			.text('The School Quiz', { align: 'center' });

		doc.moveDown(0.5);

		doc.fontSize(18)
			.font('Helvetica-Bold')
			.text(`Quiz #${quizSlug}`, { align: 'center' });

		doc.moveDown(0.3);

		doc.fontSize(14)
			.font('Helvetica')
			.text(quizTitle, { align: 'center' });

		doc.moveDown(1);

		// Group questions by round
		const questionsByRound = quizData.rounds.map(round => ({
			round,
			questions: quizData.questions.filter(q => q.roundNumber === round.number),
		}));

		// Generate content for each round
		questionsByRound.forEach(({ round, questions }, roundIndex) => {
			if (roundIndex > 0) {
				doc.addPage();
			}

			// Round header
			doc.fontSize(16)
				.font('Helvetica-Bold')
				.text(`Round ${round.number}: ${round.title}`, {
					underline: true,
				});

			if (round.blurb) {
				doc.moveDown(0.3);
				doc.fontSize(11)
					.font('Helvetica-Oblique')
					.text(round.blurb);
			}

			doc.moveDown(0.8);

			// Questions
			questions.forEach((q, qIndex) => {
				// Check if we need a new page
				if (doc.y > 700) {
					doc.addPage();
				}

				doc.fontSize(12)
					.font('Helvetica-Bold')
					.text(`${qIndex + 1}. ${q.question}`, {
						continued: false,
					});

				doc.moveDown(0.2);

				// Answer (with space for writing)
				doc.fontSize(10)
					.font('Helvetica')
					.text('Answer: ', { continued: true })
					.font('Helvetica-Bold')
					.text(q.answer);

				// Show submission info if available
				if (q.submittedBy) {
					doc.moveDown(0.1);
					doc.fontSize(8)
						.font('Helvetica-Oblique')
						.text(`Submitted by: ${q.submittedBy}`, {
							indent: 20,
						});
				}

				doc.moveDown(0.5);
			});
		});

		// Footer on last page
		doc.fontSize(8)
			.font('Helvetica')
			.text(
				'Generated by The School Quiz - Premium Feature',
				doc.page.width / 2,
				doc.page.height - 30,
				{ align: 'center' }
			);

		doc.end();
	});
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	try {
		const { slug } = await params;

		// Check premium access
		const tier = await getUserTier(request);
		if (!canAccessFeature(tier, 'pdf_downloads')) {
			return NextResponse.json(
				{ error: 'Premium access required to download PDFs' },
				{ status: 403 }
			);
		}

		// Get quiz data
		const quizData = QUIZ_DATA[slug];
		const quizInfo = QUIZ_INFO[slug];

		if (!quizData || !quizInfo) {
			return NextResponse.json(
				{ error: 'Quiz not found' },
				{ status: 404 }
			);
		}

		// Generate PDF
		const pdfBuffer = await generatePDF(slug, quizInfo.title, quizData);

		// Return PDF as response
		return new NextResponse(pdfBuffer, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="quiz-${slug}.pdf"`,
			},
		});
	} catch (error) {
		console.error('Error generating PDF:', error);
		return NextResponse.json(
			{ error: 'Failed to generate PDF' },
			{ status: 500 }
		);
	}
}

