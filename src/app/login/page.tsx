'use client';
 
import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
 
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
 
export default function LoginPage() {
  const loginHeroImage = PlaceHolderImages.find(
    (img) => img.id === 'login-hero'
  );
  const { login, loginWithCredentials } = useAuth();
  const { language, setLanguage, languages } = useLanguage();
  const t = useTranslations();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginRole, setLoginRole] = useState<'rider' | 'admin' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<'employee' | 'gig_worker' | ''>('');
 
  const handleRiderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
   
    if (!userType) {
      setError('Please select a user type');
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
   
    setLoginRole('rider');
    setIsLoggingIn(true);
   
    try {
      const result = await loginWithCredentials(username, password, language, userType || undefined);
     
      if (!result.success) {
        setError(result.error || 'Login failed');
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: result.error || 'Invalid username or password',
        });
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred during login',
      });
    } finally {
      setIsLoggingIn(false);
      setLoginRole(null);
    }
  };
 
  const handleAdminLogin = () => {
    setLoginRole('admin');
    setIsLoggingIn(true);
    // Simulate network delay for admin login
    setTimeout(() => {
      login('admin');
    }, 1000);
  };
 
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo />
            <h1 className="text-3xl font-bold mt-4">Login</h1>
            <p className="text-balance text-muted-foreground">
              {t('enter_rider_id')}
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('rider_access')}</CardTitle>
              <CardDescription>
                Enter your username and password to login
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRiderLogin} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="user-type">User Type</Label>
                  <Select
                    value={userType}
                    onValueChange={(value) => setUserType(value as typeof userType)}
                  >
                    <SelectTrigger id="user-type">
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent className=" text-black border-[#3647A6]">
                      <SelectItem
                        value="employee"
                        className="focus:bg-[#3647A6] focus:text-white data-[state=checked]:bg-[#3647A6] data-[state=checked]:text-white"
                      >
                        Employee
                      </SelectItem>
                      <SelectItem
                        value="gig_worker"
                        className="focus:bg-[#3647A6] focus:text-white data-[state=checked]:bg-[#3647A6] data-[state=checked]:text-white"
                      >
                        Gig Worker
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoggingIn}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="#"
                      className="ml-auto inline-block text-sm underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoggingIn}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="language">Select Language</Label>
                  <Select
                    value={language}
                    onValueChange={(value) => setLanguage(value as typeof language)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className=" text-black border-[#3647A6]">
                      {languages.map((lang) => (
                        <SelectItem
                          key={lang.code}
                          value={lang.code}
                          className="focus:bg-[#3647A6] focus:text-white data-[state=checked]:bg-[#3647A6] data-[state=checked]:text-white"
                        >
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full"
                >
                  {isLoggingIn && loginRole === 'rider' ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          <div className="mt-4 text-center text-sm">
            {t('not_a_rider')}{' '}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={handleAdminLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn && loginRole === 'admin' ? (
                <Loader2 className="animate-spin" />
              ) : (
                'Login as Admin'
              )}
            </Button>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {loginHeroImage && (
          <Image
            src={loginHeroImage.imageUrl}
            alt={loginHeroImage.description}
            data-ai-hint={loginHeroImage.imageHint}
            width="1200"
            height="800"
            className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        )}
      </div>
    </div>
  );
}
