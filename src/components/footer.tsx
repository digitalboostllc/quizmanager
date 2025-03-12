import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center gap-4 md:h-16 md:flex-row md:justify-between">
        <div className="text-center md:text-left">
          <p className="text-sm leading-loose text-muted-foreground">
            Built with ❤️ by Said. © {new Date().getFullYear()} FB Quiz Manager. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link
            href="/privacy"
            className="font-medium underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="font-medium underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  )
} 