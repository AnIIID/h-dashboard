"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Ungueltige E-Mail oder Passwort");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-sm border-gray-800 bg-gray-900 text-gray-100">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold text-white">
          Honcho Dashboard
        </CardTitle>
        <p className="text-sm text-gray-400">Anmelden</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              E-Mail
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="mail@example.com"
              required
              autoFocus
              className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-300"
            >
              Passwort
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
