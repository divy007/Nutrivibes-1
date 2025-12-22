export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-white">
            <nav className="border-b p-4">Client Navbar</nav>
            {children}
        </div>
    );
}
