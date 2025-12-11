'use client';

import Link from 'next/link';
import { SpeculationRules } from '@/components/SpeculationRules';
import { Logo } from '@/components/Logo';

export function Footer() {
	const currentYear = new Date().getFullYear();
	const startYear = 2024;
	const endYear = 2026;

	// Footer links to prerender
	const footerUrls = [
		'/quizzes',
		'/about',
		'/contact',
		'/help',
		'/achievements',
		'/account',
		'/upgrade',
		'/privacy',
		'/terms',
	];

	return (
		<footer className="relative bg-blue-600 dark:bg-blue-700 text-white pt-16 md:pt-20 pb-8 px-4 sm:px-6 lg:px-8">
			{/* Prerender footer links on hover */}
			<SpeculationRules 
				urls={footerUrls}
				eagerness="conservative" // Only prerender on hover/focus
			/>
			
			{/* Subtle top gradient/shadow for separation */}
			<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-black/5 to-transparent" />
			
			{/* Rounded top corners effect - page background curving down into footer */}
			<div 
				className="absolute top-0 left-0 right-0 h-6 md:h-8 rounded-b-[1.5rem] md:rounded-b-[2.5rem] bg-gray-50 dark:bg-[#0F1419]" 
			/>
			
			<div className="max-w-7xl mx-auto relative z-10">
				{/* Main Footer Content */}
				<div className="flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-16 pb-16 md:pb-20">
					{/* Brand Block - Left (wider) */}
					<div className="space-y-4 flex-shrink-0 lg:max-w-md">
						<Link href="/" className="inline-block group">
							<Logo className="h-8 w-auto text-white transition-opacity group-hover:opacity-80" />
						</Link>
						<p className="text-blue-100/90 text-sm leading-relaxed">
							Weekly quiz for Australian students. Test your knowledge and compete with friends.
						</p>
						<p className="text-blue-200/70 text-xs italic">
							Built by a teacher for teachers
						</p>
					</div>

					{/* Navigation Links - Right (single horizontal row) */}
					<nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-normal text-blue-100/70">
						<Link 
							href="/quizzes" 
							className="hover:text-white transition-colors"
						>
							Quizzes
						</Link>
						<span className="text-blue-200/40">·</span>
						<Link 
							href="/achievements" 
							className="hover:text-white transition-colors"
						>
							Achievements
						</Link>
						<span className="text-blue-200/40">·</span>
						<Link 
							href="/upgrade" 
							className="hover:text-white transition-colors"
						>
							Pricing
						</Link>
						<span className="text-blue-200/40">·</span>
						<Link 
							href="/about" 
							className="hover:text-white transition-colors"
						>
							About
						</Link>
						<span className="text-blue-200/40">·</span>
						<Link 
							href="/contact" 
							className="hover:text-white transition-colors"
						>
							Contact
						</Link>
						<span className="text-blue-200/40">·</span>
						<Link 
							href="/help" 
							className="hover:text-white transition-colors"
						>
							Help Center
						</Link>
						<span className="text-blue-200/40">·</span>
						<Link 
							href="/account" 
							className="hover:text-white transition-colors"
						>
							Account
						</Link>
					</nav>
				</div>

				{/* Bottom Bar - Copyright & Legal */}
				<div className="pt-8 border-t border-blue-500/30">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						{/* Copyright */}
						<div className="text-blue-100/70 text-xs flex items-center gap-2 flex-wrap">
							<span>© {startYear === currentYear ? currentYear : `${startYear}–${endYear}`} The School Quiz</span>
							<span className="hidden sm:inline">·</span>
							<span className="hidden sm:inline">Made in Australia</span>
						</div>

						{/* Legal Links */}
						<nav className="flex gap-4 md:gap-6">
							<Link 
								href="/privacy" 
								className="text-blue-100/70 hover:text-white transition-colors text-xs"
							>
								Privacy
							</Link>
							<Link 
								href="/terms" 
								className="text-blue-100/70 hover:text-white transition-colors text-xs"
							>
								Terms
							</Link>
						</nav>
					</div>
				</div>
			</div>
		</footer>
	);
}

