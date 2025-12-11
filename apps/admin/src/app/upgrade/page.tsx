"use client";

import React from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PricingSection } from "@/components/marketing/PricingSection";
import { LandingFooter } from "@/components/marketing/LandingFooter";

export default function UpgradePageRoute() {
	return (
		<PageLayout>
			<PageContainer maxWidth="xl">
				<div className="py-8 sm:py-12 md:py-16">
					{/* Upgrade header */}
					<div className="max-w-7xl mx-auto text-center mb-10 sm:mb-12">
						<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
							Unlock the full experience
						</h1>
						<p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
							Get class teams, printable PDFs, private leaderboards, and the complete back catalogue. Everything you need to run the quiz your way.
						</p>
					</div>

					{/* Pricing cards */}
					<PricingSection hideHeader />
				</div>
			</PageContainer>
			
			{/* Footer */}
			<LandingFooter />
		</PageLayout>
	);
}
