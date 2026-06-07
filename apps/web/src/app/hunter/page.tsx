import HunterDashboard from '@/components/HunterDashboard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getProfile() {
  const apiUrl = process.env['API_URL'] || 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/profiles?limit=1`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }
}

export default async function HunterPage() {
  const profile = await getProfile();

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-4">Hunter Protocol</h1>
        <p className="text-gray-600 mb-8">
          No active profile found. Please create a profile to use the Hunter Protocol.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <HunterDashboard profileId={profile.id} />
    </main>
  );
}
