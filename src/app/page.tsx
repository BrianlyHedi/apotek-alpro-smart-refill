import { redirect } from "next/navigation";

export default function Home() {
  // Redirect pengguna langsung ke halaman login
  redirect("/login");
}
