"use client";

import React from "react";
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
							title="Join our Community"
							subtitle={
								<>
									Sign up to get free access to the latest edition of <span className="font-bold text-blue-600 dark:text-blue-400">The School Quiz</span>, plus weekly email and SMS reminders!
								</>
							}
							centered
						/>
						<SignUpForm />
					</div>
				</div>
			</PageContainer>
		</PageLayout>
	);
}

