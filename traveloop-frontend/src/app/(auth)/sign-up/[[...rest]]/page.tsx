import { SignUp } from "@clerk/nextjs";

const clerkAppearance = {
  variables: {
    colorPrimary: "#e8734a",
    colorBackground: "#fffdf7",
    colorText: "#1e1a16",
    colorTextSecondary: "#6b5e52",
    colorTextOnPrimaryBackground: "#ffffff",
    colorInputBackground: "#fffdf7",
    colorInputText: "#1e1a16",
    borderRadius: "14px",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "15px",
  },
  elements: {
    card: "shadow-none bg-transparent",
    rootBox: "w-full",
    formButtonPrimary: "bg-[#e8734a] hover:bg-[#d4603a] text-white font-semibold active:scale-[0.97] transition-all",
    formFieldInput: "border-[#e8e0d5] focus:border-[#e8734a] focus:ring-2 focus:ring-[#e8734a]/20 bg-[#fffdf7]",
    footerActionLink: "text-[#e8734a] hover:text-[#d4603a] font-medium",
    headerTitle: "font-semibold text-[#1e1a16]",
    headerSubtitle: "text-[#6b5e52]",
    dividerLine: "bg-[#e8e0d5]",
    dividerText: "text-[#a89a8e]",
    socialButtonsBlockButton: "border-[#e8e0d5] hover:bg-[#f5f0e8] text-[#1e1a16] transition-colors",
  },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden" style={{ background: "var(--primary)" }}>
        <svg className="absolute inset-0 w-full h-full opacity-10" aria-hidden="true">
          <defs>
            <pattern id="dots2" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots2)" />
        </svg>
        <svg className="absolute bottom-24 right-20 opacity-20" width="120" height="80" viewBox="0 0 120 80" fill="none" aria-hidden="true">
          <path d="M110 60 Q60 10 10 40" stroke="white" strokeWidth="2" strokeDasharray="6 4" fill="none" />
          <path d="M15 35 L5 42 L17 44 L15 35Z M10 40 L25 36 L22 30Z" fill="white" />
        </svg>
        <svg className="absolute top-20 right-16 opacity-20" width="40" height="50" viewBox="0 0 40 50" fill="none" aria-hidden="true">
          <ellipse cx="20" cy="18" rx="14" ry="14" fill="white" />
          <path d="M20 32 Q8 42 20 50 Q32 42 20 32Z" fill="white" />
          <circle cx="20" cy="18" r="5" fill="#e8734a" />
        </svg>
        <div className="relative z-10 text-center max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <svg width="44" height="44" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <circle cx="14" cy="14" r="13" fill="white" fillOpacity="0.2" />
              <path d="M8 14 Q14 7 20 14 Q14 21 8 14Z" fill="white" />
              <circle cx="14" cy="14" r="2.5" fill="#e8734a" />
            </svg>
            <span className="text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>Traveloop</span>
          </div>
          <h1 className="text-4xl font-semibold italic text-white leading-tight mb-4" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>
            Start your<br />adventure today.
          </h1>
          <p className="text-white/75 text-base leading-relaxed">Join thousands of travellers who plan smarter, travel better, and share more.</p>
          <svg className="mt-10 mx-auto opacity-30" width="200" height="20" viewBox="0 0 200 20" fill="none" aria-hidden="true">
            <path d="M0 10 Q25 0 50 10 Q75 20 100 10 Q125 0 150 10 Q175 20 200 10" stroke="white" strokeWidth="2" fill="none" />
          </svg>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[var(--bg-base)]">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <circle cx="14" cy="14" r="13" fill="var(--primary)" />
              <path d="M8 14 Q14 7 20 14 Q14 21 8 14Z" fill="white" />
              <circle cx="14" cy="14" r="2.5" fill="white" />
            </svg>
            <span className="text-2xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>Traveloop</span>
          </div>
          <SignUp appearance={clerkAppearance} />
        </div>
      </div>
    </div>
  );
}
