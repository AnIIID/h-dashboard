import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        if (
          credentials?.email === process.env.DASHBOARD_USER &&
          credentials?.password === process.env.DASHBOARD_PASSWORD
        ) {
          return {
            id: "1",
            name: "Admin",
            email: credentials.email as string,
          };
        }
        return null;
      },
    }),
  ],
  basePath: "/dashboard/api/auth",
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth: session }) {
      return !!session?.user;
    },
  },
});
