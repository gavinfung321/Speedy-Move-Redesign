import Link from "next/link";

export default function NotFound() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="text-4xl font-extrabold">Page not found</h1>
      <p className="mt-4 leading-7">That address is not in the current Speedy Move page list.</p>
      <Link href="/" className="mt-6 inline-flex font-bold text-[var(--green)]">
        Back to the homepage
      </Link>
    </article>
  );
}
