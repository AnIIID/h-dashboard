import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password" },
      },
      authorize(credentials) {
        if (
          credentials?.username === process.env.ADMIN_USER &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "1", name: credentials.username as string };
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
});
