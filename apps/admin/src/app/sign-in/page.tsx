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
							title="Sign in"
							subtitle="Welcome back to The School Quiz"
							centered
						/>
						<SignInForm />
					</div>
				</div>
			</PageContainer>
		</PageLayout>
	);
}

