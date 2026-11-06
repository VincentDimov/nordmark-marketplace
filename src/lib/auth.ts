import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { db } from './db';
import { sendEmail } from './integrations/email';
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    requireEmailVerification: process.env.DEMO_MODE !== 'true',
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(user.id, user.email, 'Återställ lösenord', url);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(user.id, user.email, 'Verifiera e-post', url);
    },
  },
  rateLimit: { enabled: true, storage: 'database' },
  plugins: [nextCookies()],
});
