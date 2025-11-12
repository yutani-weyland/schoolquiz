"use client";

import React from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import SignInForm from "@/components/auth/SignInForm";

export default function SignInPage() {
	return (
		<PageLayout>
			<PageContainer maxWidth="sm">
				<div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
					<div className="w-full max-w-md">
						<PageHeader
							title="Log in"
							subtitle="Welcome back! Log in to access your weekly quizzes, track your progress, and see your achievements."
							centered
							className="hidden md:block"
						/>
						<div className="md:hidden mb-8 text-center">
							<h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Log in</h1>
						</div>
						<SignInForm />
					</div>
				</div>
			</PageContainer>
		</PageLayout>
	);
}

