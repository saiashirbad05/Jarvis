import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-client-id-for-dev",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-client-secret-for-dev",
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Pass the access token or user ID to the session object
      session.user.id = token.sub
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-dev",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
