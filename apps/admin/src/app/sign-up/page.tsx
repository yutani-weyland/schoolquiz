"use client";

import React from "react";
import Link from "next/link";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUpPage() {
	return (
		<PageLayout>
			<PageContainer maxWidth="sm">
				<div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
					<div className="w-full max-w-md">
						<PageHeader
							title="Get Started"
							subtitle={
								<>
									Get free access to your first 5 quizzes. Upgrade anytime to unlock the full experience — class teams, printable PDFs, private leaderboards{" "}
									<Link href="/upgrade" className="text-blue-600 dark:text-blue-400 hover:underline">
										and more
									</Link>.
								</>
							}
							centered
							className="hidden md:block"
						/>
						<div className="md:hidden mb-6 text-center">
							<h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Get Started</h1>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Free access to your first 5 quizzes.{" "}
								<Link href="/upgrade" className="text-blue-600 dark:text-blue-400 hover:underline">
									See Premium features
								</Link>.
							</p>
						</div>
						<SignUpForm />
					</div>
				</div>
			</PageContainer>
		</PageLayout>
	);
}
