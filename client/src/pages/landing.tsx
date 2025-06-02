import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Users, Link, Shield, Globe, Smartphone } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <h1 className="text-xl font-semibold">InfoSpace</h1>
            </div>
            <Button onClick={handleLogin}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Your Personal Information Space
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Seamlessly store, organize, and access your files, notes, contacts, and links across all your devices with a clean, intuitive interface.
          </p>
          <Button size="lg" onClick={handleLogin} className="text-lg px-8 py-3">
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">File Storage</h3>
                <p className="text-sm text-muted-foreground">
                  Upload and organize any type of file with drag-and-drop simplicity
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold">Quick Notes</h3>
                <p className="text-sm text-muted-foreground">
                  Capture thoughts instantly with our one-click note creation
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold">Contact Management</h3>
                <p className="text-sm text-muted-foreground">
                  Store and organize contact information with ease
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Link className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">Link Bookmarks</h3>
                <p className="text-sm text-muted-foreground">
                  Save and categorize important links for quick access
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose InfoSpace?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your data is protected with enterprise-grade security and user authentication
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                <Globe className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold">Access Anywhere</h3>
              <p className="text-muted-foreground">
                Sync your information across all devices and access from anywhere
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Mobile Friendly</h3>
              <p className="text-muted-foreground">
                Optimized for mobile devices with responsive design and touch-friendly interface
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Organized?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of users who trust InfoSpace to keep their information organized and accessible.
          </p>
          <Button size="lg" variant="secondary" onClick={handleLogin} className="text-lg px-8 py-3">
            Start Using InfoSpace
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 InfoSpace. Your personal information management solution.</p>
        </div>
      </footer>
    </div>
  );
}