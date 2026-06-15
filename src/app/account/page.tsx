import { redirect } from 'next/navigation';
import BuilderBackLink from '@/app/components/BuilderBackLink';
import AccountSettingsClient from './AccountSettingsClient';
import { getCurrentUser } from '@/lib/services/session.service';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Account Settings | ShipStack',
  description: 'Manage your ShipStack profile, avatar, password, and sign-in options.',
};

export default async function AccountPage() {
  try {
    const user = await getCurrentUser();

    return (
      <>
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <BuilderBackLink
            title="Back to builder"
            description="Head back to the ShipStack builder to create a new app or continue iterating on an existing one."
          />
        </div>
        <AccountSettingsClient
          initialProfile={{
            id: user.id,
            name: user.name ?? '',
            email: user.email ?? '',
            avatarUrl: user.avatarUrl,
            role: user.role,
            hasPassword: Boolean(user.passwordHash),
          }}
          googleEnabled={
            Boolean(process.env.GOOGLE_CLIENT_ID) &&
            Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
            process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
          }
        />
      </>
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      redirect('/auth/login');
    }

    throw error;
  }
}
