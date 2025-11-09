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
							title="Create your account"
							subtitle="Get 5 weeks of free access to the latest quizzes"
							centered
						/>
						<SignUpForm />
					</div>
				</div>
			</PageContainer>
		</PageLayout>
	);
}

