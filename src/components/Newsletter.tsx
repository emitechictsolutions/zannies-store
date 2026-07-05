import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      toast.error("Enter a valid email");
      return;
    }
    toast.success("Welcome to the list — first access awaits.");
    setEmail("");
  };
  return (
    <form
      onSubmit={submit}
      className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 border border-gold/40 bg-transparent px-4 py-3 text-sm text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none"
      />
      <button type="submit" className="btn-gold">
        Subscribe
      </button>
    </form>
  );
}
