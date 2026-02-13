'use client';
 
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { withLocale } from '@/i18n/config';
 
type LoginDraft = {
  username: string;
  password: string;
  userType: 'employee' | 'gig_worker' | '';
};

export default function LoginPage() {
  const LOGIN_DRAFT_KEY = 'login:draft';
  const getInitialDraft = (): LoginDraft => {
    if (typeof window === 'undefined') {
      return { username: '', password: '', userType: '' };
    }
    try {
      const raw = sessionStorage.getItem(LOGIN_DRAFT_KEY);
      if (!raw) return { username: '', password: '', userType: '' };
      const parsed = JSON.parse(raw) as Partial<LoginDraft>;
      const userType =
        parsed.userType === 'employee' || parsed.userType === 'gig_worker'
          ? parsed.userType
          : '';
      return {
        username: typeof parsed.username === 'string' ? parsed.username : '',
        password: typeof parsed.password === 'string' ? parsed.password : '',
        userType,
      };
    } catch {
      return { username: '', password: '', userType: '' };
    }
  };

  const initialDraft = getInitialDraft();
  const loginHeroImage = PlaceHolderImages.find(
    (img) => img.id === 'login-hero'
  );
  const { login, loginWithCredentials } = useAuth();
  const { language, setLanguage, languages } = useLanguage();
  const router = useRouter();
  const t = useTranslations();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginRole, setLoginRole] = useState<'rider' | 'admin' | null>(null);
  const [username, setUsername] = useState(initialDraft.username);
  const [password, setPassword] = useState(initialDraft.password);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState<'employee' | 'gig_worker' | ''>(initialDraft.userType);
  const persistDraft = (
    next: Partial<{
      username: string;
      password: string;
      userType: 'employee' | 'gig_worker' | '';
    }>
  ) => {
    try {
      sessionStorage.setItem(
        LOGIN_DRAFT_KEY,
        JSON.stringify({
          username,
          password,
          userType,
          ...next,
        })
      );
    } catch (err) {
      console.error('Failed to persist login draft:', err);
    }
  };

  const handleRiderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
   
    if (!userType) {
      setError(t('error_select_user_type'));
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError(t('error_enter_credentials'));
      return;
    }
   
    setLoginRole('rider');
    setIsLoggingIn(true);
   
    try {
      const result = await loginWithCredentials(username, password, language, userType || undefined);
     
      if (!result.success) {
        setError(result.error || t('error_login_failed'));
        toast({
          variant: 'destructive',
          title: t('title_login_failed'),
          description: result.error || t('error_login_invalid_credentials'),
        });
      } else {
        sessionStorage.removeItem(LOGIN_DRAFT_KEY);
        router.replace(withLocale('/', language));
      }
    } catch (err) {
      setError(t('error_login_generic'));
      toast({
        variant: 'destructive',
        title: t('title_error'),
        description: t('error_login_occurred'),
      });
    } finally {
      setIsLoggingIn(false);
      setLoginRole(null);
    }
  };
 
  const handleAdminLogin = () => {
    sessionStorage.removeItem(LOGIN_DRAFT_KEY);
    setLoginRole('admin');
    setIsLoggingIn(true);
    login('admin');
  };
 
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo />
            <h1 className="text-3xl font-bold mt-4">{t('login_title')}</h1>
            <p className="text-balance text-muted-foreground">
              {t('enter_rider_id')}
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t('rider_access')}</CardTitle>
              <CardDescription>
                {t('login_card_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRiderLogin} className="grid gap-4" autoComplete="off">
                <div className="grid gap-2">
                  <Label htmlFor="user-type">{t('label_user_type')}</Label>
                  <Select
                    value={userType}
                    onValueChange={(value) => {
                      const nextUserType = value as typeof userType;
                      setUserType(nextUserType);
                      persistDraft({ userType: nextUserType });
                    }}
                  >
                    <SelectTrigger id="user-type">
                      <SelectValue placeholder={t('placeholder_select_user_type')} />
                    </SelectTrigger>
                    <SelectContent className=" text-black border-[#3647A6]">
                      <SelectItem
                        value="employee"
                        className="focus:bg-[#3647A6] focus:text-white data-[state=checked]:bg-[#3647A6] data-[state=checked]:text-white"
                      >
                        {t('option_employee')}
                      </SelectItem>
                      <SelectItem
                        value="gig_worker"
                        className="focus:bg-[#3647A6] focus:text-white data-[state=checked]:bg-[#3647A6] data-[state=checked]:text-white"
                      >
                        {t('option_gig_worker')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">{t('label_username')}</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={t('placeholder_username')}
                    required
                    value={username}
                    autoComplete="off"
                    onChange={(e) => {
                      const nextUsername = e.target.value;
                      setUsername(nextUsername);
                      persistDraft({ username: nextUsername });
                    }}
                    disabled={isLoggingIn}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">{t('label_password')}</Label>
                    <Link
                      href="#"
                      className="ml-auto inline-block text-sm underline"
                    >
                      {t('forgot_password')}
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('placeholder_password')}
                    required
                    value={password}
                    autoComplete="off"
                    onChange={(e) => {
                      const nextPassword = e.target.value;
                      setPassword(nextPassword);
                      persistDraft({ password: nextPassword });
                    }}
                    disabled={isLoggingIn}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="language">{t('label_select_language')}</Label>
                  <Select
                    value={language}
                    onValueChange={(value) => {
                      persistDraft({});
                      setLanguage(value as typeof language);
                    }}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder={t('placeholder_select_language')} />
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
                    t('button_login')
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
                t('button_login_admin')
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
