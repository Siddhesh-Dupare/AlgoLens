export default function DesktopHeader() {
  return (
    <nav className="hidden md:flex items-center p-2">
      <div className="flex border border-accent-foreground rounded-sm p-2 gap-6">
        <a href="" className="hover:bg-blue-400">
          Home
        </a>
        <a href="" className="">
          Data
        </a>
      </div>
    </nav>
  );
}
