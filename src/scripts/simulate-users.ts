// src/scripts/simulate-users.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ⚠️ Use SERVICE ROLE KEY only for admin scripts - NEVER in client code
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Add this to .env.local
);

type TestUser = {
  fullName: string;
  email: string;
  password: string;
  communityIds: string[];
  delayMinutes: number;
};

// 📝 Configure your test users here (5 users, password: Kester)
const TEST_USERS: TestUser[] = [
  {
    fullName: 'Alex Morgan',
    email: 'alex@gmail.com',
    password: 'Kester',
    communityIds: ['depression-and-anxiety-support-group', 'community-id-2'],
    delayMinutes: 0,
  },
  {
    fullName: 'Jamie Lee',
    email: 'jamie@gmail.com',
    password: 'Kester',
    communityIds: ['depression-and-anxiety-support-group'],
    delayMinutes: 1,
  },
  {
    fullName: 'Taylor Reed',
    email: 'taylor@gmail.com',
    password: 'Kester',
    communityIds: ['depression-and-anxiety-support-group'],
    delayMinutes: 3,
  },
  {
    fullName: 'Morgan Smith',
    email: 'morgan@gmail.com',
    password: 'Kester',
    communityIds: ['depression-and-anxiety-support-group'],
    delayMinutes: 4,
  },
  {
    fullName: 'Casey Brown',
    email: 'casey@gmail.com',
    password: 'Kester',
    communityIds: ['depression-and-anxiety-support-group'],
    delayMinutes: 5,
  },
];

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function createUserAndJoin(user: TestUser) {
  console.log(`🕐 [${new Date().toLocaleTimeString()}] Processing: ${user.fullName}`);

  try {
    // 1. Create auth user (bypass email confirmation in dev)
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Auto-confirm for testing
      user_metadata: { 
        full_name: user.fullName, 
        is_test_account: true 
      },
    });

    if (error) throw error;
    const userId = data?.user?.id;
    if (!userId) throw new Error('No user ID returned');

    console.log(`✅ Created auth user: ${user.email}`);

    // 2. Create profile entry (matches your schema)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: user.fullName,
      avatar_url: null,
      last_online: new Date().toISOString(),
      is_anonymous: false,
      country: 'US', // or derive from your /api/country logic
    });

    if (profileError) throw profileError;
    console.log(`✅ Created profile for: ${user.fullName}`);

    // 3. Join communities
    for (const communityId of user.communityIds) {
      const { error: memberError } = await supabase.from('community_members').insert({
        community_id: communityId,
        user_id: userId,
        role: 'member',
        joined_at: new Date().toISOString(),
      });

      if (memberError) {
        // Skip if already a member (idempotent for re-runs)
        if (memberError.code !== '23505') throw memberError;
        console.log(`ℹ️  ${user.fullName} already in community ${communityId}`);
      } else {
        console.log(`✅ ${user.fullName} joined community: ${communityId}`);
      }
    }

    // 4. Update last_online to make them appear "active"
    await supabase
      .from('profiles')
      .update({ last_online: new Date().toISOString() })
      .eq('id', userId);

    console.log(`🎉 Finished: ${user.fullName}\n`);

  } catch (err) {
    console.error(`❌ Failed for ${user.email}:`, err);
  }
}

async function runSimulation() {
  console.log('🚀 Starting user simulation...\n');

  for (const user of TEST_USERS) {
    // Schedule with delay
    setTimeout(async () => {
      await createUserAndJoin(user);
    }, user.delayMinutes * 60 * 1000);

    console.log(`⏳ Scheduled ${user.fullName} in ${user.delayMinutes} min`);
  }

  // Keep script alive long enough for last user
  const maxDelay = Math.max(...TEST_USERS.map((u) => u.delayMinutes));
  console.log(`\n⏱️  Script will stay active for ~${maxDelay + 1} minutes...`);
  await sleep((maxDelay + 1) * 60 * 1000);
  console.log('🏁 Simulation complete.');
}

runSimulation().catch(console.error);