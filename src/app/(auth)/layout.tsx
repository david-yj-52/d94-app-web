import TshLogo from "@/components/TshLogo";

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4 py-12">
            <div className="mb-8 flex flex-col items-center gap-2">
                <TshLogo className="h-10 w-10 object-contain"/>
                <span className="text-xl font-bold text-slate-800 tracking-tight">
          CIRA
        </span>
            </div>
            {children}
        </div>
    );
}
