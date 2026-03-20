export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
        <span className="text-xs tracking-wide text-zinc-600">
          &copy; {new Date().getFullYear()} TwilightSnap
        </span>
        <span className="text-xs tracking-wide text-zinc-700">
          Professional twilight photography
        </span>
      </div>
    </footer>
  );
}
