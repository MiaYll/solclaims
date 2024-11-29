import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();

  const toggleLocale = () => {
    const newLocale = locale === 'en' ? 'zh' : 'en';
    router.push(`/${newLocale}`);
  };

  return (
    <button
      onClick={toggleLocale}
      className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-sm"
    >
      {locale === 'en' ? '中文' : 'English'}
    </button>
  );
} 