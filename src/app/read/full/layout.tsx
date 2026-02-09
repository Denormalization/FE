export default function ReadFullLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 bg-white flex items-center justify-center">
            {children}
        </div>
    );
}
