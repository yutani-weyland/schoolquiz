'use client';

import Link from 'next/link';

export function Footer() {
	const currentYear = new Date().getFullYear();
	const startYear = 2024;

	return (
		<footer className="relative bg-[#3B82F6] text-white pt-20 pb-8 px-4 md:px-8">
			{/* Rounded top corners effect - page background curving down into footer */}
			<div className="absolute top-0 left-0 right-0 h-6 md:h-8 bg-gray-50 dark:bg-[#0F1419] rounded-b-[1.5rem] md:rounded-b-[2.5rem]" />
			
			<div className="max-w-7xl mx-auto relative z-10">
				<div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
					{/* Logo and Tagline - Left Side */}
					<div className="space-y-4 flex-shrink-0">
						<div className="text-2xl font-bold tracking-tight">
							The School Quiz
						</div>
						<p className="text-blue-100 text-sm leading-relaxed max-w-xs">
							Weekly quiz for Australian students. Test your knowledge and compete with friends.
						</p>
					</div>

					{/* Navigation Links - Right Side */}
					<div className="flex flex-col md:flex-row gap-12 md:gap-16 lg:gap-20">
						{/* Navigation Links - Column 1 */}
						<div className="flex flex-col gap-3">
							<Link 
								href="/quizzes" 
								className="text-blue-100 hover:text-white transition-colors text-sm"
							>
								Quizzes
							</Link>
							<Link 
								href="/about" 
								className="text-blue-100 hover:text-white transition-colors text-sm"
							>
								About
							</Link>
							<Link 
								href="/contact" 
								className="text-blue-100 hover:text-white transition-colors text-sm"
							>
								Contact
							</Link>
							<Link 
								href="/help" 
								className="text-blue-100 hover:text-white transition-colors text-sm"
							>
								Help Center
							</Link>
						</div>

						{/* Navigation Links - Column 2 */}
						<div className="flex flex-col gap-3">
							<Link 
								href="/achievements" 
								className="text-blue-100 hover:text-white transition-colors text-sm"
							>
								Achievements
							</Link>
							<Link 
								href="/account" 
								className="text-blue-100 hover:text-white transition-colors text-sm"
							>
								Account
							</Link>
							<Link 
								href="/upgrade" 
								className="text-blue-100 hover:text-white transition-colors text-sm"
							>
								Pricing
							</Link>
						</div>
					</div>
				</div>

				{/* Bottom Section */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-8 border-t border-blue-500">
					{/* Copyright */}
					<div className="text-blue-100 text-xs">
						© {startYear === currentYear ? currentYear : `${startYear}-${currentYear}`} The School Quiz. All rights reserved.
					</div>

					{/* Legal Links */}
					<div className="flex gap-6">
						<Link 
							href="/privacy" 
							className="text-blue-100 hover:text-white transition-colors text-xs"
						>
							Privacy policy
						</Link>
						<Link 
							href="/terms" 
							className="text-blue-100 hover:text-white transition-colors text-xs"
						>
							Terms
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}

